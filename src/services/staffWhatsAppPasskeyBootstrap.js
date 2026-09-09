'use strict';

const crypto = require('crypto');
const { pool } = require('../db/pool');
const {
  normalizeWhatsapp,
  sha256,
  deriveCalendarViewer,
  issueStaffBrowserSession,
} = require('./staffBrowserSession');
const {
  CHALLENGE_TTL_MS,
  fromB64url,
  passkeyPolicy,
  verifyRegistrationResponse,
} = require('./staffPasskeyAuth');

const FEATURE_FLAG = 'SHILOH_STAFF_WHATSAPP_PASSKEY_BOOTSTRAP_ENABLED';
const BOOTSTRAP_TTL_MS = 10 * 60 * 1000;
const ISSUE_WINDOW_MS = 10 * 60 * 1000;
const ISSUE_LIMIT = 3;

function bootstrapPolicy(env = process.env) {
  const enabled = String(env[FEATURE_FLAG] || '').trim().toLowerCase() === 'true';
  const passkey = passkeyPolicy(env);
  return {
    enabled,
    operational: enabled && passkey.operational,
    origin: passkey.origin,
    rpId: passkey.rpId,
  };
}

function opaqueUserId(adminId) {
  return Buffer.from(`staff-admin:${Number(adminId)}`, 'utf8').toString('base64url');
}

function cleanDisplayName(value) {
  return String(value || 'Shiloh staff').replace(/[\r\n\t]+/g, ' ').slice(0, 80) || 'Shiloh staff';
}

function evaluateBootstrapPrincipal(rows = []) {
  if (!Array.isArray(rows) || rows.length !== 1) {
    return { matched: Array.isArray(rows) && rows.length > 0, eligible: false, code: rows?.length > 1 ? 'STAFF_PASSKEY_BOOTSTRAP_AMBIGUOUS' : 'STAFF_PASSKEY_BOOTSTRAP_UNKNOWN' };
  }
  const admin = rows[0];
  if (admin.admin_active !== true || (admin.staff_id != null && admin.staff_status !== 'active')) {
    return { matched: true, eligible: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INACTIVE' };
  }
  if (!deriveCalendarViewer(admin)) {
    return { matched: true, eligible: false, code: 'STAFF_PASSKEY_BOOTSTRAP_ACCESS_REQUIRED' };
  }
  return {
    matched: true,
    eligible: true,
    admin: {
      ...admin,
      id: Number(admin.id),
      staff_id: admin.staff_id == null ? null : Number(admin.staff_id),
      display_name: cleanDisplayName(admin.display_name),
    },
  };
}

function setupUrl(token, env = process.env) {
  const policy = bootstrapPolicy(env);
  if (!policy.operational || !/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return null;
  return `${policy.origin}/calendar/staff-auth/passkeys/bootstrap#setup=${encodeURIComponent(token)}`;
}

function parseRegistrationChallenge(response, expectedOrigin) {
  try {
    const raw = fromB64url(response?.response?.clientDataJSON, 16384);
    const parsed = JSON.parse(raw.toString('utf8'));
    if (!parsed || parsed.type !== 'webauthn.create' || parsed.origin !== expectedOrigin || parsed.crossOrigin === true) return null;
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(String(parsed.challenge || ''))) return null;
    return parsed.challenge;
  } catch (_) {
    return null;
  }
}

function createStaffWhatsAppPasskeyBootstrapService({
  db = pool,
  env = process.env,
  now = () => new Date(),
  randomBytes = crypto.randomBytes,
  sessionTtlMs,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('staff WhatsApp passkey bootstrap db is required');

  function policy() { return bootstrapPolicy(env); }

  async function audit(client, eventType, adminId, requestFingerprintHash = null, metadata = {}) {
    await client.query(
      `INSERT INTO staff_auth_security_events
         (event_type, operator_admin_id, subject_admin_id, auth_method, request_fingerprint_hash, metadata)
       VALUES ($1, NULL, $2, 'passkey', $3, $4::jsonb)`,
      [eventType, adminId, requestFingerprintHash, JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {})]
    );
  }

  async function identityRows(queryable, normalized, { forUpdate = false } = {}) {
    const result = await queryable.query(
      `SELECT a.id, a.staff_id, a.display_name, a.role, a.business_role, a.calendar_scope,
              a.service_scope, a.permissions, a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id = a.staff_id
        WHERE a.normalized_whatsapp = $1
        ORDER BY a.id
        LIMIT 3${forUpdate ? '\n        FOR UPDATE OF a' : ''}`,
      [normalized]
    );
    return result.rows;
  }

  async function resolveIdentity(whatsapp) {
    const normalized = normalizeWhatsapp(whatsapp);
    if (!normalized) return { matched: false, eligible: false, code: 'STAFF_PASSKEY_BOOTSTRAP_UNKNOWN' };
    return evaluateBootstrapPrincipal(await identityRows(db, normalized));
  }

  async function resolveAdmin(queryable, adminId, { forUpdate = false } = {}) {
    const result = await queryable.query(
      `SELECT a.id, a.staff_id, a.display_name, a.role, a.business_role, a.calendar_scope,
              a.service_scope, a.permissions, a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id = a.staff_id
        WHERE a.id = $1
        LIMIT 1${forUpdate ? '\n        FOR UPDATE OF a' : ''}`,
      [Number(adminId)]
    );
    const evaluated = evaluateBootstrapPrincipal(result.rows);
    return evaluated.eligible ? evaluated.admin : null;
  }

  async function issueBootstrap({ whatsapp } = {}) {
    const currentPolicy = policy();
    if (!currentPolicy.operational) {
      return { ok: false, handled: false, code: currentPolicy.enabled ? 'STAFF_PASSKEY_BOOTSTRAP_UNAVAILABLE' : 'STAFF_PASSKEY_BOOTSTRAP_DISABLED' };
    }
    const normalized = normalizeWhatsapp(whatsapp);
    if (!normalized) return { ok: true, handled: false };
    const current = now();
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const evaluated = evaluateBootstrapPrincipal(await identityRows(client, normalized, { forUpdate: true }));
      if (!evaluated.matched) { await client.query('ROLLBACK'); return { ok: true, handled: false }; }
      if (!evaluated.eligible) { await client.query('ROLLBACK'); return { ok: true, handled: true, eligible: false, code: evaluated.code }; }
      const admin = evaluated.admin;
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-passkey-bootstrap:' || $1::text, 0))`, [admin.id]);
      const since = new Date(current.getTime() - ISSUE_WINDOW_MS);
      const issueCount = await client.query(
        `SELECT COUNT(*)::int AS count FROM staff_auth_passkey_bootstraps WHERE admin_id = $1 AND issued_at >= $2`,
        [admin.id, since]
      );
      if (Number(issueCount.rows[0]?.count || 0) >= ISSUE_LIMIT) {
        await audit(client, 'passkey_bootstrap_rate_limited', admin.id, null, { source: 'whatsapp_self' });
        await client.query('COMMIT');
        return { ok: true, handled: true, eligible: true, rateLimited: true, displayName: admin.display_name };
      }
      await client.query(
        `UPDATE staff_auth_passkey_bootstraps SET revoked_at = $2
          WHERE admin_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`,
        [admin.id, current]
      );
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(current.getTime() + BOOTSTRAP_TTL_MS);
      await client.query(
        `INSERT INTO staff_auth_passkey_bootstraps (admin_id, token_hash, issued_at, expires_at, source)
         VALUES ($1, $2, $3, $4, 'whatsapp_self')`,
        [admin.id, sha256(token), current, expiresAt]
      );
      await audit(client, 'passkey_bootstrap_issued', admin.id, null, { source: 'whatsapp_self' });
      await client.query('COMMIT');
      return {
        ok: true,
        handled: true,
        eligible: true,
        displayName: admin.display_name,
        expiresAt,
        token,
        url: setupUrl(token, env),
      };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function startRegistration({ token, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    if (!currentPolicy.operational) return { ok: false, code: currentPolicy.enabled ? 'STAFF_PASSKEY_BOOTSTRAP_UNAVAILABLE' : 'STAFF_PASSKEY_BOOTSTRAP_DISABLED' };
    if (!/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
    const current = now();
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const bootstrapResult = await client.query(
        `SELECT id, admin_id, expires_at, consumed_at, revoked_at
           FROM staff_auth_passkey_bootstraps
          WHERE token_hash = $1
          LIMIT 1
          FOR UPDATE`,
        [sha256(token)]
      );
      const bootstrap = bootstrapResult.rows[0];
      if (!bootstrap || bootstrap.consumed_at || bootstrap.revoked_at) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
      }
      if (new Date(bootstrap.expires_at).getTime() <= current.getTime()) {
        await client.query(`UPDATE staff_auth_passkey_bootstraps SET revoked_at = $2 WHERE id = $1`, [bootstrap.id, current]);
        await audit(client, 'passkey_bootstrap_expired', bootstrap.admin_id, requestFingerprintHash, { source: 'whatsapp_self' });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
      }
      const admin = await resolveAdmin(client, bootstrap.admin_id, { forUpdate: true });
      if (!admin) {
        await client.query(`UPDATE staff_auth_passkey_bootstraps SET revoked_at = $2 WHERE id = $1`, [bootstrap.id, current]);
        await audit(client, 'passkey_bootstrap_rejected', bootstrap.admin_id, requestFingerprintHash, { reason: 'inactive_or_access_removed' });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
      }
      await client.query(`UPDATE staff_auth_passkey_bootstraps SET consumed_at = $2 WHERE id = $1`, [bootstrap.id, current]);
      await client.query(
        `UPDATE staff_auth_webauthn_challenges SET consumed_at = $2
          WHERE admin_id = $1 AND purpose = 'bootstrap_registration' AND consumed_at IS NULL`,
        [admin.id, current]
      );
      const existing = await client.query(
        `SELECT credential_id FROM staff_auth_passkey_credentials WHERE admin_id = $1 AND revoked_at IS NULL`,
        [admin.id]
      );
      const challenge = randomBytes(32).toString('base64url');
      const expiresAt = new Date(current.getTime() + CHALLENGE_TTL_MS);
      await client.query(
        `INSERT INTO staff_auth_webauthn_challenges
           (challenge_hash, purpose, admin_id, session_id, request_fingerprint_hash, expires_at)
         VALUES ($1, 'bootstrap_registration', $2, NULL, $3, $4)`,
        [sha256(challenge), admin.id, requestFingerprintHash, expiresAt]
      );
      await audit(client, 'passkey_bootstrap_consumed', admin.id, requestFingerprintHash, { source: 'whatsapp_self' });
      await client.query('COMMIT');
      return {
        ok: true,
        displayName: admin.display_name,
        expiresAt,
        options: {
          challenge,
          rp: { name: 'Shiloh', id: currentPolicy.rpId },
          user: { id: opaqueUserId(admin.id), name: `staff-${admin.id}`, displayName: admin.display_name },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -8 },
            { type: 'public-key', alg: -257 },
          ],
          timeout: CHALLENGE_TTL_MS,
          attestation: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'discouraged',
            requireResidentKey: false,
            userVerification: 'required',
          },
          excludeCredentials: existing.rows.map((row) => ({ type: 'public-key', id: row.credential_id })),
        },
      };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function finishRegistration({ response, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    if (!currentPolicy.operational) return { ok: false, code: currentPolicy.enabled ? 'STAFF_PASSKEY_BOOTSTRAP_UNAVAILABLE' : 'STAFF_PASSKEY_BOOTSTRAP_DISABLED' };
    const challengeValue = parseRegistrationChallenge(response, currentPolicy.origin);
    if (!challengeValue) return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
    const current = now();
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const challengeResult = await client.query(
        `SELECT id, admin_id, expires_at
           FROM staff_auth_webauthn_challenges
          WHERE challenge_hash = $1 AND purpose = 'bootstrap_registration' AND consumed_at IS NULL
          LIMIT 1
          FOR UPDATE`,
        [sha256(challengeValue)]
      );
      const challenge = challengeResult.rows[0];
      if (!challenge || new Date(challenge.expires_at).getTime() <= current.getTime()) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
      }
      const admin = await resolveAdmin(client, challenge.admin_id, { forUpdate: true });
      if (!admin) {
        await client.query(`UPDATE staff_auth_webauthn_challenges SET consumed_at = $2 WHERE id = $1`, [challenge.id, current]);
        await audit(client, 'passkey_bootstrap_rejected', challenge.admin_id, requestFingerprintHash, { reason: 'inactive_or_access_removed_at_finish' });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
      }
      await client.query(`UPDATE staff_auth_webauthn_challenges SET consumed_at = $2 WHERE id = $1`, [challenge.id, current]);
      let verified;
      try {
        verified = verifyRegistrationResponse(response, {
          expectedChallenge: challengeValue,
          origin: currentPolicy.origin,
          rpId: currentPolicy.rpId,
        });
      } catch (_) {
        await audit(client, 'passkey_bootstrap_failed', admin.id, requestFingerprintHash, { reason: 'invalid_registration' });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
      }
      const duplicate = await client.query(
        `SELECT id FROM staff_auth_passkey_credentials WHERE credential_id = $1 LIMIT 1 FOR UPDATE`,
        [verified.credentialId]
      );
      if (duplicate.rows[0]) {
        await audit(client, 'passkey_bootstrap_failed', admin.id, requestFingerprintHash, { reason: 'credential_exists' });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_PASSKEY_BOOTSTRAP_INVALID' };
      }
      const inserted = await client.query(
        `INSERT INTO staff_auth_passkey_credentials
           (admin_id, credential_id, public_key_spki, algorithm, sign_count, transports, backed_up)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         RETURNING id`,
        [admin.id, verified.credentialId, verified.publicKeySpki, verified.algorithm, verified.signCount, JSON.stringify(verified.transports), verified.backedUp]
      );
      const issued = await issueStaffBrowserSession({
        client,
        admin,
        current,
        randomBytes,
        sessionTtlMs,
        requestFingerprintHash,
        authMethod: 'passkey',
        recoveryRequired: false,
      });
      await audit(client, 'passkey_bootstrap_completed', admin.id, requestFingerprintHash, {
        source: 'whatsapp_self',
        credentialReference: `passkey:${inserted.rows[0].id}`,
        backedUp: verified.backedUp,
      });
      await client.query('COMMIT');
      return { ...issued, credentialHint: verified.credentialId, credentialId: Number(inserted.rows[0].id) };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  return {
    policy,
    resolveIdentity,
    issueBootstrap,
    startRegistration,
    finishRegistration,
  };
}

const service = createStaffWhatsAppPasskeyBootstrapService();

module.exports = {
  FEATURE_FLAG,
  BOOTSTRAP_TTL_MS,
  ISSUE_WINDOW_MS,
  ISSUE_LIMIT,
  bootstrapPolicy,
  cleanDisplayName,
  evaluateBootstrapPrincipal,
  setupUrl,
  parseRegistrationChallenge,
  createStaffWhatsAppPasskeyBootstrapService,
  ...service,
};
