const crypto = require('crypto');
const OTPAuth = require('otpauth');
const QRCode = require('qrcode');
const { normalizeWhatsapp, sha256, issueStaffBrowserSession } = require('./staffBrowserSession');

const FEATURE_FLAG = 'SHILOH_STAFF_TOTP_AUTH_ENABLED';
const PILOT_IDS_FLAG = 'SHILOH_STAFF_TOTP_PILOT_ADMIN_IDS';
const KEYRING_FLAG = 'SHILOH_STAFF_TOTP_ENCRYPTION_KEYS_JSON';
const ACTIVE_KEY_VERSION_FLAG = 'SHILOH_STAFF_TOTP_ACTIVE_KEY_VERSION';
const PUBLIC_ORIGIN_FLAG = 'SHILOH_CALENDAR_PUBLIC_ORIGIN';
const ISSUER = 'Shiloh OS';
const TOTP_ALGORITHM = 'SHA1';
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_WINDOW = 1;
const TOTP_SECRET_BYTES = 20;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 16;
const ENROLLMENT_TTL_MS = 10 * 60 * 1000;
const RECENT_AUTH_TTL_MS = 10 * 60 * 1000;
const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const ACCOUNT_FAILURE_LIMIT = 8;
const SOURCE_FAILURE_LIMIT = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const BREAK_GLASS_TTL_MS = 5 * 60 * 1000;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_BYTES = 32;
const UNKNOWN_SOURCE_HASH = sha256('shiloh-staff-auth:unknown-source');

function isProviderIndependentAuthEnabled(env = process.env) {
  return String(env[FEATURE_FLAG] || '').trim().toLowerCase() === 'true';
}

function parsePilotAdminIds(env = process.env) {
  const raw = String(env[PILOT_IDS_FLAG] || '').trim();
  if (!raw) return { valid: false, ids: new Set() };
  const values = raw.split(',').map((value) => value.trim());
  if (values.some((value) => !/^[1-9]\d*$/.test(value))) return { valid: false, ids: new Set() };
  const ids = new Set(values.map(Number));
  if (!ids.size || [...ids].some((id) => !Number.isSafeInteger(id) || id <= 0)) return { valid: false, ids: new Set() };
  return { valid: true, ids };
}

function parseEncryptionKeyring(env = process.env) {
  const activeVersion = String(env[ACTIVE_KEY_VERSION_FLAG] || '').trim();
  if (!/^[A-Za-z0-9_.-]{1,40}$/.test(activeVersion)) return { valid: false, activeVersion: null, keys: new Map() };
  let parsed;
  try { parsed = JSON.parse(String(env[KEYRING_FLAG] || '')); } catch (_) { return { valid: false, activeVersion: null, keys: new Map() }; }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return { valid: false, activeVersion: null, keys: new Map() };
  const keys = new Map();
  for (const [version, encoded] of Object.entries(parsed)) {
    if (!/^[A-Za-z0-9_.-]{1,40}$/.test(version) || !/^[A-Za-z0-9_-]{43}$/.test(String(encoded || ''))) {
      return { valid: false, activeVersion: null, keys: new Map() };
    }
    const key = Buffer.from(encoded, 'base64url');
    if (key.length !== 32) return { valid: false, activeVersion: null, keys: new Map() };
    keys.set(version, key);
  }
  if (!keys.has(activeVersion)) return { valid: false, activeVersion: null, keys: new Map() };
  return { valid: true, activeVersion, keys };
}

function providerIndependentAuthPolicy(env = process.env) {
  if (!isProviderIndependentAuthEnabled(env)) {
    return { enabled: false, operational: false, pilotIds: new Set(), keyring: null };
  }
  const pilots = parsePilotAdminIds(env);
  const keyring = parseEncryptionKeyring(env);
  return {
    enabled: true,
    operational: pilots.valid && keyring.valid,
    pilotIds: pilots.ids,
    keyring,
  };
}

function isCanonicalAuthorityActive(admin) {
  if (!admin || admin.admin_active !== true) return false;
  return admin.staff_id == null || admin.staff_status === 'active';
}

function sourceFingerprint(value) {
  return /^[0-9a-f]{64}$/.test(String(value || '')) ? String(value) : UNKNOWN_SOURCE_HASH;
}

function cleanReason(value, fallback = 'security_reset') {
  const reason = String(value || '')
    .trim()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/otpauth:\/\/\S+/gi, '[redacted-auth-uri]')
    .replace(/\b(?:[A-Fa-f0-9]{4}[- ]?){7}[A-Fa-f0-9]{4}\b/g, '[redacted-recovery-code]')
    .replace(/\b\d{6}\b/g, '[redacted-otp]')
    .replace(/\b[A-Za-z0-9_-]{43}\b/g, '[redacted-secret]')
    .slice(0, 240);
  return reason || fallback;
}

function isRecentAuthentication(session, current = new Date(), ttlMs = RECENT_AUTH_TTL_MS) {
  if (!session?.ok) return false;
  const authenticatedAt = new Date(session.authenticatedAt || 0).getTime();
  return Number.isFinite(authenticatedAt) && authenticatedAt <= current.getTime() && current.getTime() - authenticatedAt <= ttlMs;
}

function encryptionAad(adminId, keyVersion) {
  return Buffer.from(`shiloh-staff-totp:${Number(adminId)}:${keyVersion}`, 'utf8');
}

function encryptTotpSecret(secret, adminId, keyring, randomBytes = crypto.randomBytes) {
  if (!keyring?.valid || !keyring.keys.has(keyring.activeVersion)) throw new Error('STAFF_TOTP_KEYRING_UNAVAILABLE');
  const nonce = randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyring.keys.get(keyring.activeVersion), nonce);
  cipher.setAAD(encryptionAad(adminId, keyring.activeVersion));
  const ciphertext = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64url'),
    nonce: nonce.toString('base64url'),
    authTag: cipher.getAuthTag().toString('base64url'),
    keyVersion: keyring.activeVersion,
  };
}

function decryptTotpSecret(record, adminId, keyring) {
  const version = String(record?.keyVersion || '');
  const key = keyring?.keys?.get(version);
  if (!key) throw new Error('STAFF_TOTP_KEY_VERSION_UNAVAILABLE');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(String(record.nonce || ''), 'base64url'));
    decipher.setAAD(encryptionAad(adminId, version));
    decipher.setAuthTag(Buffer.from(String(record.authTag || ''), 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(String(record.ciphertext || ''), 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch (_) {
    throw new Error('STAFF_TOTP_DECRYPTION_FAILED');
  }
}

function createTotp(secret, label = 'Staff') {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: String(label || 'Staff').slice(0, 120),
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

function validateTotp(secret, code, timestampMs) {
  const token = String(code || '').trim();
  if (!/^\d{6}$/.test(token)) return null;
  const totp = createTotp(secret);
  const delta = totp.validate({ token, window: TOTP_WINDOW, timestamp: timestampMs });
  if (delta == null) return null;
  return Math.floor(timestampMs / 1000 / TOTP_PERIOD_SECONDS) + delta;
}

function normalizeRecoveryCode(value) {
  const normalized = String(value || '').replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
  return /^[A-F0-9]{32}$/.test(normalized) ? normalized : null;
}

function displayRecoveryCode(normalized) {
  return String(normalized || '').match(/.{1,4}/g)?.join('-') || '';
}

function generateRecoveryCodes(randomBytes = crypto.randomBytes) {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => randomBytes(RECOVERY_CODE_BYTES).toString('hex').toUpperCase());
}

function scrypt(value, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(value, salt, keyLength, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

async function hashRecoveryCode(value, randomBytes = crypto.randomBytes) {
  const normalized = normalizeRecoveryCode(value);
  if (!normalized) throw new Error('STAFF_RECOVERY_CODE_INVALID');
  const salt = randomBytes(16);
  const derived = await scrypt(normalized, salt, SCRYPT_KEY_BYTES, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

async function verifyRecoveryCode(value, encoded) {
  const normalized = normalizeRecoveryCode(value);
  const parts = String(encoded || '').split('$');
  if (!normalized || parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltEncoded, hashEncoded] = parts;
  const expected = Buffer.from(hashEncoded, 'base64url');
  if (!expected.length) return false;
  let actual;
  try {
    actual = await scrypt(normalized, Buffer.from(saltEncoded, 'base64url'), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
  } catch (_) { return false; }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function lockUntilForFailures(count, current, limit) {
  if (count >= limit) return new Date(current.getTime() + LOCKOUT_MS);
  if (count === limit - 1) return new Date(current.getTime() + 30 * 1000);
  if (count === limit - 2) return new Date(current.getTime() + 5 * 1000);
  return null;
}

function isFuture(value, current) {
  return value != null && new Date(value).getTime() > current.getTime();
}

function publicOrigin(env = process.env) {
  const raw = String(env[PUBLIC_ORIGIN_FLAG] || env.RENDER_EXTERNAL_URL || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.origin;
  } catch (_) { return null; }
}

function buildBreakGlassUrl(token, env = process.env) {
  const origin = publicOrigin(env);
  if (!origin || !/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return null;
  return `${origin}/calendar/staff#staff-recovery=${encodeURIComponent(token)}`;
}

function createProviderIndependentStaffAuthService({
  db,
  env = process.env,
  now = () => new Date(),
  randomBytes = crypto.randomBytes,
  qrToDataURL = QRCode.toDataURL,
  sessionTtlMs,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('provider-independent staff auth db is required');

  function policy() { return providerIndependentAuthPolicy(env); }

  async function audit(client, {
    eventType,
    operatorAdminId = null,
    subjectAdminId = null,
    authMethod = null,
    reason = null,
    requestFingerprintHash = null,
    metadata = {},
  }) {
    await client.query(
      `INSERT INTO staff_auth_security_events
         (event_type, operator_admin_id, subject_admin_id, auth_method, reason, request_fingerprint_hash, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [eventType, operatorAdminId, subjectAdminId, authMethod, reason, requestFingerprintHash,
        JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {})]
    );
  }

  async function resolveAdmin(client, { adminId = null, identifier = null, forUpdate = false } = {}) {
    const values = [];
    let predicate;
    if (adminId != null) {
      const id = Number(adminId);
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      values.push(id);
      predicate = 'a.id = $1';
    } else {
      const normalized = normalizeWhatsapp(identifier);
      if (!normalized) return null;
      values.push(normalized);
      predicate = 'a.normalized_whatsapp = $1';
    }
    const result = await client.query(
      `SELECT a.id, a.staff_id, a.display_name, a.role, a.business_role, a.calendar_scope,
              a.service_scope, a.permissions, a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id = a.staff_id
        WHERE ${predicate}
        LIMIT 2${forUpdate ? '\n        FOR UPDATE OF a' : ''}`,
      values
    );
    if (result.rows.length !== 1 || !isCanonicalAuthorityActive(result.rows[0])) return null;
    return result.rows[0];
  }

  function allowed(admin, currentPolicy = policy()) {
    return currentPolicy.operational && admin && currentPolicy.pilotIds.has(Number(admin.id));
  }

  async function loadSourceRate(client, fingerprint) {
    const result = await client.query(
      `SELECT window_started_at, failed_attempt_count, locked_until
         FROM staff_auth_rate_limits
        WHERE source_fingerprint_hash = $1
        FOR UPDATE`,
      [fingerprint]
    );
    return result.rows[0] || null;
  }

  async function lockSource(client, fingerprint) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-auth-source:' || $1::text, 0))`, [fingerprint]);
  }

  function windowFailureCount(startedAt, count, current) {
    if (!startedAt || current.getTime() - new Date(startedAt).getTime() >= FAILURE_WINDOW_MS) return 0;
    return Number(count || 0);
  }

  async function registerSourceFailure(client, sourceRate, fingerprint, current) {
    const sourceCount = windowFailureCount(sourceRate?.window_started_at, sourceRate?.failed_attempt_count, current) + 1;
    const sourceWindow = sourceCount === 1 ? current : sourceRate?.window_started_at;
    const sourceLock = lockUntilForFailures(sourceCount, current, SOURCE_FAILURE_LIMIT);
    await client.query(
      `INSERT INTO staff_auth_rate_limits
         (source_fingerprint_hash, window_started_at, failed_attempt_count, locked_until, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source_fingerprint_hash) DO UPDATE SET
         window_started_at = EXCLUDED.window_started_at,
         failed_attempt_count = EXCLUDED.failed_attempt_count,
         locked_until = EXCLUDED.locked_until,
         updated_at = EXCLUDED.updated_at`,
      [fingerprint, sourceWindow, sourceCount, sourceLock, current]
    );
    return { rateLimited: Boolean(sourceLock), lockedUntil: sourceLock };
  }

  async function registerFailure(client, credential, sourceRate, fingerprint, current, eventType = 'totp_verification_failed') {
    const accountCount = windowFailureCount(credential.failure_window_started_at, credential.failed_attempt_count, current) + 1;
    const accountWindow = accountCount === 1 ? current : credential.failure_window_started_at;
    const accountLock = lockUntilForFailures(accountCount, current, ACCOUNT_FAILURE_LIMIT);
    await client.query(
      `UPDATE staff_totp_credentials
          SET failure_window_started_at = $2,
              failed_attempt_count = $3,
              locked_until = $4,
              updated_at = $5
        WHERE admin_id = $1`,
      [credential.admin_id, accountWindow, accountCount, accountLock, current]
    );
    const sourceFailure = await registerSourceFailure(client, sourceRate, fingerprint, current);
    await audit(client, {
      eventType,
      subjectAdminId: credential.admin_id,
      authMethod: eventType.startsWith('recovery') ? 'recovery_code' : 'totp',
      requestFingerprintHash: fingerprint,
      metadata: { rateLimited: Boolean(accountLock || sourceFailure.rateLimited) },
    });
    if (accountLock || sourceFailure.rateLimited) {
      await audit(client, {
        eventType: 'authentication_rate_limited',
        subjectAdminId: credential.admin_id,
        authMethod: eventType.startsWith('recovery') ? 'recovery_code' : 'totp',
        requestFingerprintHash: fingerprint,
      });
    }
    return { rateLimited: Boolean(accountLock || sourceFailure.rateLimited) };
  }

  async function clearFailures(client, adminId, fingerprint, current) {
    await client.query(
      `UPDATE staff_totp_credentials
          SET failure_window_started_at = NULL, failed_attempt_count = 0,
              locked_until = NULL, updated_at = $2
        WHERE admin_id = $1`,
      [adminId, current]
    );
    await client.query(
      `DELETE FROM staff_auth_rate_limits
        WHERE source_fingerprint_hash = $1`,
      [fingerprint]
    );
  }

  function rateLimited(credential, sourceRate, current) {
    return isFuture(credential?.locked_until, current) || isFuture(sourceRate?.locked_until, current);
  }

  function activeSecretRecord(credential) {
    return {
      ciphertext: credential.secret_ciphertext,
      nonce: credential.secret_nonce,
      authTag: credential.secret_auth_tag,
      keyVersion: credential.secret_key_version,
    };
  }

  function pendingSecretRecord(credential) {
    return {
      ciphertext: credential.pending_secret_ciphertext,
      nonce: credential.pending_secret_nonce,
      authTag: credential.pending_secret_auth_tag,
      keyVersion: credential.pending_secret_key_version,
    };
  }

  async function credentialStatus(adminId) {
    const currentPolicy = policy();
    if (!currentPolicy.operational || !currentPolicy.pilotIds.has(Number(adminId))) {
      return { available: false, enrolled: false, recoveryRequired: false };
    }
    const admin = await resolveAdmin(db, { adminId });
    if (!allowed(admin, currentPolicy)) return { available: false, enrolled: false, recoveryRequired: false };
    const result = await db.query(
      `SELECT status, confirmed_at, replacement_required_at,
              enrollment_expires_at
         FROM staff_totp_credentials
        WHERE admin_id = $1`,
      [admin.id]
    );
    const credential = result.rows[0];
    return {
      available: true,
      adminId: Number(admin.id),
      canResetOther: admin.permissions?.['staff_auth:reset'] === true,
      enrolled: credential?.status === 'active' && credential.confirmed_at != null,
      recoveryRequired: credential?.replacement_required_at != null,
      enrollmentPending: credential?.enrollment_expires_at != null && new Date(credential.enrollment_expires_at).getTime() > now().getTime(),
    };
  }

  async function verifyTotp({ identifier, code, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    if (!currentPolicy.enabled) return { ok: false, code: 'STAFF_TOTP_DISABLED' };
    if (!currentPolicy.operational) return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
    const current = now();
    const fingerprint = sourceFingerprint(requestFingerprintHash);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      await lockSource(client, fingerprint);
      const sourceRate = await loadSourceRate(client, fingerprint);
      if (isFuture(sourceRate?.locked_until, current)) {
        await audit(client, { eventType: 'authentication_rate_limited', authMethod: 'totp', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_AUTH_RATE_LIMITED' };
      }
      const admin = await resolveAdmin(client, { identifier, forUpdate: true });
      if (!allowed(admin, currentPolicy)) {
        const failed = await registerSourceFailure(client, sourceRate, fingerprint, current);
        await audit(client, { eventType: 'totp_verification_failed', authMethod: 'totp', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: failed.rateLimited ? 'STAFF_AUTH_RATE_LIMITED' : 'STAFF_AUTH_INVALID' };
      }
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-totp-auth:' || $1::text, 0))`, [admin.id]);
      const credentialResult = await client.query(
        `SELECT * FROM staff_totp_credentials WHERE admin_id = $1 FOR UPDATE`,
        [admin.id]
      );
      const credential = credentialResult.rows[0];
      if (!credential || credential.status !== 'active' || credential.replacement_required_at) {
        let failed;
        if (credential) failed = await registerFailure(client, credential, sourceRate, fingerprint, current);
        else {
          failed = await registerSourceFailure(client, sourceRate, fingerprint, current);
          await audit(client, { eventType: 'totp_verification_failed', subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint });
        }
        await client.query('COMMIT');
        return { ok: false, code: failed.rateLimited ? 'STAFF_AUTH_RATE_LIMITED' : 'STAFF_AUTH_INVALID' };
      }
      if (rateLimited(credential, sourceRate, current)) {
        await audit(client, { eventType: 'authentication_rate_limited', subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_AUTH_RATE_LIMITED' };
      }
      let timestep;
      try {
        const secret = decryptTotpSecret(activeSecretRecord(credential), admin.id, currentPolicy.keyring);
        timestep = validateTotp(secret, code, current.getTime());
      }
      catch (_) {
        await audit(client, { eventType: 'totp_secret_unavailable', subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
      }
      if (timestep == null || (credential.last_accepted_timestep != null && timestep <= Number(credential.last_accepted_timestep))) {
        const failed = await registerFailure(client, credential, sourceRate, fingerprint, current,
          timestep == null ? 'totp_verification_failed' : 'totp_replay_rejected');
        await client.query('COMMIT');
        return { ok: false, code: failed.rateLimited ? 'STAFF_AUTH_RATE_LIMITED' : 'STAFF_AUTH_INVALID' };
      }
      await client.query(
        `UPDATE staff_totp_credentials
            SET last_accepted_timestep = $2, updated_at = $3
          WHERE admin_id = $1 AND (last_accepted_timestep IS NULL OR last_accepted_timestep < $2)`,
        [admin.id, timestep, current]
      );
      await clearFailures(client, admin.id, fingerprint, current);
      const issued = await issueStaffBrowserSession({
        client, admin, current, randomBytes, sessionTtlMs, requestFingerprintHash: fingerprint,
        authMethod: 'totp', recoveryRequired: false,
      });
      await audit(client, { eventType: 'totp_verification_succeeded', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint });
      await client.query('COMMIT');
      return issued;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function verifyRecovery({ identifier, recoveryCode, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    if (!currentPolicy.enabled) return { ok: false, code: 'STAFF_TOTP_DISABLED' };
    if (!currentPolicy.operational) return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
    const normalizedCode = normalizeRecoveryCode(recoveryCode);
    const current = now();
    const fingerprint = sourceFingerprint(requestFingerprintHash);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      await lockSource(client, fingerprint);
      const sourceRate = await loadSourceRate(client, fingerprint);
      if (isFuture(sourceRate?.locked_until, current)) {
        await audit(client, { eventType: 'authentication_rate_limited', authMethod: 'recovery_code', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_AUTH_RATE_LIMITED' };
      }
      const admin = await resolveAdmin(client, { identifier, forUpdate: true });
      if (!normalizedCode || !allowed(admin, currentPolicy)) {
        const failed = await registerSourceFailure(client, sourceRate, fingerprint, current);
        await audit(client, { eventType: 'recovery_verification_failed', authMethod: 'recovery_code', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: failed.rateLimited ? 'STAFF_AUTH_RATE_LIMITED' : 'STAFF_AUTH_INVALID' };
      }
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-totp-auth:' || $1::text, 0))`, [admin.id]);
      const credentialResult = await client.query(`SELECT * FROM staff_totp_credentials WHERE admin_id = $1 FOR UPDATE`, [admin.id]);
      const credential = credentialResult.rows[0];
      if (!credential || credential.status !== 'active') {
        const failed = credential
          ? await registerFailure(client, credential, sourceRate, fingerprint, current, 'recovery_verification_failed')
          : await registerSourceFailure(client, sourceRate, fingerprint, current);
        await client.query('COMMIT');
        return { ok: false, code: failed.rateLimited ? 'STAFF_AUTH_RATE_LIMITED' : 'STAFF_AUTH_INVALID' };
      }
      if (rateLimited(credential, sourceRate, current)) {
        await audit(client, { eventType: 'authentication_rate_limited', subjectAdminId: admin.id, authMethod: 'recovery_code', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_AUTH_RATE_LIMITED' };
      }
      const codesResult = await client.query(
        `SELECT id, code_hash
           FROM staff_auth_recovery_codes
          WHERE admin_id = $1 AND generation = $2
            AND consumed_at IS NULL AND revoked_at IS NULL
          ORDER BY id
          FOR UPDATE`,
        [admin.id, credential.recovery_generation]
      );
      const recoveryMatches = await Promise.all(codesResult.rows.map((candidate) => verifyRecoveryCode(normalizedCode, candidate.code_hash)));
      const match = codesResult.rows[recoveryMatches.findIndex(Boolean)] || null;
      if (!match) {
        const failed = await registerFailure(client, credential, sourceRate, fingerprint, current, 'recovery_verification_failed');
        await client.query('COMMIT');
        return { ok: false, code: failed.rateLimited ? 'STAFF_AUTH_RATE_LIMITED' : 'STAFF_AUTH_INVALID' };
      }
      const consumed = await client.query(
        `UPDATE staff_auth_recovery_codes
            SET consumed_at = $2
          WHERE id = $1 AND consumed_at IS NULL AND revoked_at IS NULL
        RETURNING id`,
        [match.id, current]
      );
      if (consumed.rowCount !== 1) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_AUTH_INVALID' };
      }
      await client.query(
        `UPDATE staff_totp_credentials
            SET replacement_required_at = COALESCE(replacement_required_at, $2), updated_at = $2
          WHERE admin_id = $1`,
        [admin.id, current]
      );
      await clearFailures(client, admin.id, fingerprint, current);
      const issued = await issueStaffBrowserSession({
        client, admin, current, randomBytes, sessionTtlMs, requestFingerprintHash: fingerprint,
        authMethod: 'recovery_code', recoveryRequired: true,
      });
      await audit(client, { eventType: 'recovery_code_used', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'recovery_code', requestFingerprintHash: fingerprint });
      await client.query('COMMIT');
      return issued;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function startEnrollment({ session, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    const current = now();
    if (!currentPolicy.enabled) return { ok: false, code: 'STAFF_TOTP_DISABLED' };
    if (!currentPolicy.operational) return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
    if (!isRecentAuthentication(session, current)) return { ok: false, code: 'STAFF_RECENT_AUTH_REQUIRED' };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const admin = await resolveAdmin(client, { adminId: session.adminId, forUpdate: true });
      if (!allowed(admin, currentPolicy)) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_AUTH_FORBIDDEN' };
      }
      const existingResult = await client.query(`SELECT * FROM staff_totp_credentials WHERE admin_id = $1 FOR UPDATE`, [admin.id]);
      const existing = existingResult.rows[0] || null;
      if (existing?.enrollment_expires_at && new Date(existing.enrollment_expires_at).getTime() <= current.getTime()) {
        await audit(client, { eventType: 'enrollment_expired', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: sourceFingerprint(requestFingerprintHash) });
      }
      const secretObject = new OTPAuth.Secret({ buffer: randomBytes(TOTP_SECRET_BYTES) });
      const secret = secretObject.base32;
      const encrypted = encryptTotpSecret(secret, admin.id, currentPolicy.keyring, randomBytes);
      const totp = createTotp(secret, admin.display_name);
      const enrollmentUri = totp.toString();
      const qrDataUrl = await qrToDataURL(enrollmentUri, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
      const expiresAt = new Date(current.getTime() + ENROLLMENT_TTL_MS);
      await client.query(
        `INSERT INTO staff_totp_credentials
           (admin_id, status, pending_secret_ciphertext, pending_secret_nonce, pending_secret_auth_tag,
            pending_secret_key_version, enrollment_started_at, enrollment_expires_at, created_at, updated_at)
         VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $6, $6)
         ON CONFLICT (admin_id) DO UPDATE SET
           status = CASE WHEN staff_totp_credentials.status = 'active' THEN 'active' ELSE 'pending' END,
           pending_secret_ciphertext = EXCLUDED.pending_secret_ciphertext,
           pending_secret_nonce = EXCLUDED.pending_secret_nonce,
           pending_secret_auth_tag = EXCLUDED.pending_secret_auth_tag,
           pending_secret_key_version = EXCLUDED.pending_secret_key_version,
           enrollment_started_at = EXCLUDED.enrollment_started_at,
           enrollment_expires_at = EXCLUDED.enrollment_expires_at,
           updated_at = EXCLUDED.updated_at`,
        [admin.id, encrypted.ciphertext, encrypted.nonce, encrypted.authTag, encrypted.keyVersion, current, expiresAt]
      );
      await audit(client, { eventType: 'enrollment_initiated', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: sourceFingerprint(requestFingerprintHash), metadata: { replacement: existing?.status === 'active' } });
      await client.query('COMMIT');
      return {
        ok: true,
        manualKey: secret.match(/.{1,4}/g).join(' '),
        qrDataUrl,
        expiresAt,
        profile: { issuer: ISSUER, algorithm: TOTP_ALGORITHM, digits: TOTP_DIGITS, periodSeconds: TOTP_PERIOD_SECONDS },
      };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function insertRecoveryCodes(client, adminId, generation, codes, current) {
    for (const code of codes) {
      await client.query(
        `INSERT INTO staff_auth_recovery_codes (admin_id, generation, code_hash, created_at)
         VALUES ($1, $2, $3, $4)`,
        [adminId, generation, await hashRecoveryCode(code, randomBytes), current]
      );
    }
  }

  async function confirmEnrollment({ session, code, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    const current = now();
    if (!currentPolicy.enabled) return { ok: false, code: 'STAFF_TOTP_DISABLED' };
    if (!currentPolicy.operational) return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
    if (!isRecentAuthentication(session, current)) return { ok: false, code: 'STAFF_RECENT_AUTH_REQUIRED' };
    const fingerprint = sourceFingerprint(requestFingerprintHash);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      await lockSource(client, fingerprint);
      const sourceRate = await loadSourceRate(client, fingerprint);
      const admin = await resolveAdmin(client, { adminId: session.adminId, forUpdate: true });
      if (!allowed(admin, currentPolicy)) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_AUTH_FORBIDDEN' };
      }
      const credentialResult = await client.query(`SELECT * FROM staff_totp_credentials WHERE admin_id = $1 FOR UPDATE`, [admin.id]);
      const credential = credentialResult.rows[0];
      if (!credential?.pending_secret_ciphertext || !credential.enrollment_expires_at) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_ENROLLMENT_INVALID' };
      }
      if (new Date(credential.enrollment_expires_at).getTime() <= current.getTime()) {
        await client.query(
          `UPDATE staff_totp_credentials SET pending_secret_ciphertext = NULL, pending_secret_nonce = NULL,
             pending_secret_auth_tag = NULL, pending_secret_key_version = NULL,
             enrollment_started_at = NULL, enrollment_expires_at = NULL,
             status = CASE WHEN secret_ciphertext IS NULL THEN 'disabled' ELSE status END, updated_at = $2
           WHERE admin_id = $1`,
          [admin.id, current]
        );
        await audit(client, { eventType: 'enrollment_expired', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_ENROLLMENT_INVALID' };
      }
      if (rateLimited(credential, sourceRate, current)) {
        await audit(client, { eventType: 'authentication_rate_limited', subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_AUTH_RATE_LIMITED' };
      }
      let timestep;
      try {
        const secret = decryptTotpSecret(pendingSecretRecord(credential), admin.id, currentPolicy.keyring);
        timestep = validateTotp(secret, code, current.getTime());
      }
      catch (_) {
        await audit(client, { eventType: 'totp_secret_unavailable', subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint });
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
      }
      if (timestep == null) {
        const failed = await registerFailure(client, credential, sourceRate, fingerprint, current, 'enrollment_verification_failed');
        await client.query('COMMIT');
        return { ok: false, code: failed.rateLimited ? 'STAFF_AUTH_RATE_LIMITED' : 'STAFF_ENROLLMENT_INVALID' };
      }
      const codes = generateRecoveryCodes(randomBytes);
      const generation = Number(credential.recovery_generation || 0) + 1;
      await client.query(
        `UPDATE staff_auth_recovery_codes SET revoked_at = COALESCE(revoked_at, $2)
          WHERE admin_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`,
        [admin.id, current]
      );
      await insertRecoveryCodes(client, admin.id, generation, codes, current);
      await client.query(
        `UPDATE staff_totp_credentials
            SET status = 'active',
                secret_ciphertext = pending_secret_ciphertext,
                secret_nonce = pending_secret_nonce,
                secret_auth_tag = pending_secret_auth_tag,
                secret_key_version = pending_secret_key_version,
                pending_secret_ciphertext = NULL, pending_secret_nonce = NULL,
                pending_secret_auth_tag = NULL, pending_secret_key_version = NULL,
                enrollment_started_at = NULL, enrollment_expires_at = NULL,
                confirmed_at = $2, last_accepted_timestep = $3,
                recovery_generation = $4, replacement_required_at = NULL,
                disabled_at = NULL, disabled_reason = NULL,
                failure_window_started_at = NULL, failed_attempt_count = 0, locked_until = NULL,
                updated_at = $2
          WHERE admin_id = $1`,
        [admin.id, current, timestep, generation]
      );
      await client.query(
        `UPDATE staff_browser_sessions
            SET recovery_required = FALSE, last_used_at = $2
          WHERE id = $1 AND admin_id = $3 AND revoked_at IS NULL AND expires_at > $2`,
        [session.sessionId, current, admin.id]
      );
      await client.query(`DELETE FROM staff_auth_rate_limits WHERE source_fingerprint_hash = $1`, [fingerprint]);
      await audit(client, { eventType: 'enrollment_confirmed', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: fingerprint, metadata: { recoveryCodeCount: RECOVERY_CODE_COUNT } });
      await client.query('COMMIT');
      return { ok: true, recoveryCodes: codes.map(displayRecoveryCode), recoveryCodeCount: RECOVERY_CODE_COUNT };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function cancelEnrollment({ session, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    const current = now();
    if (!currentPolicy.operational) return { ok: false, code: currentPolicy.enabled ? 'STAFF_TOTP_UNAVAILABLE' : 'STAFF_TOTP_DISABLED' };
    if (!isRecentAuthentication(session, current)) return { ok: false, code: 'STAFF_RECENT_AUTH_REQUIRED' };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const admin = await resolveAdmin(client, { adminId: session.adminId, forUpdate: true });
      if (!allowed(admin, currentPolicy)) { await client.query('ROLLBACK'); return { ok: false, code: 'STAFF_AUTH_FORBIDDEN' }; }
      await client.query(
        `UPDATE staff_totp_credentials SET pending_secret_ciphertext = NULL, pending_secret_nonce = NULL,
           pending_secret_auth_tag = NULL, pending_secret_key_version = NULL,
           enrollment_started_at = NULL, enrollment_expires_at = NULL,
           status = CASE WHEN secret_ciphertext IS NULL THEN 'disabled' ELSE status END, updated_at = $2
         WHERE admin_id = $1`,
        [admin.id, current]
      );
      await audit(client, { eventType: 'enrollment_cancelled', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: sourceFingerprint(requestFingerprintHash) });
      await client.query('COMMIT');
      return { ok: true };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function regenerateRecoveryCodes({ session, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    const current = now();
    if (!currentPolicy.operational) return { ok: false, code: currentPolicy.enabled ? 'STAFF_TOTP_UNAVAILABLE' : 'STAFF_TOTP_DISABLED' };
    if (!isRecentAuthentication(session, current) || session?.recoveryRequired === true) return { ok: false, code: 'STAFF_RECENT_AUTH_REQUIRED' };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const admin = await resolveAdmin(client, { adminId: session.adminId, forUpdate: true });
      if (!allowed(admin, currentPolicy)) { await client.query('ROLLBACK'); return { ok: false, code: 'STAFF_AUTH_FORBIDDEN' }; }
      const result = await client.query(`SELECT * FROM staff_totp_credentials WHERE admin_id = $1 FOR UPDATE`, [admin.id]);
      const credential = result.rows[0];
      if (!credential || credential.status !== 'active' || credential.replacement_required_at) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_AUTH_FORBIDDEN' };
      }
      const codes = generateRecoveryCodes(randomBytes);
      const generation = Number(credential.recovery_generation || 0) + 1;
      await client.query(
        `UPDATE staff_auth_recovery_codes SET revoked_at = COALESCE(revoked_at, $2)
          WHERE admin_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`,
        [admin.id, current]
      );
      await insertRecoveryCodes(client, admin.id, generation, codes, current);
      await client.query(
        `UPDATE staff_totp_credentials SET recovery_generation = $2, updated_at = $3 WHERE admin_id = $1`,
        [admin.id, generation, current]
      );
      await audit(client, { eventType: 'recovery_codes_regenerated', operatorAdminId: admin.id, subjectAdminId: admin.id, authMethod: 'totp', requestFingerprintHash: sourceFingerprint(requestFingerprintHash), metadata: { recoveryCodeCount: RECOVERY_CODE_COUNT } });
      await client.query('COMMIT');
      return { ok: true, recoveryCodes: codes.map(displayRecoveryCode), recoveryCodeCount: RECOVERY_CODE_COUNT };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function privilegedReset({ session, subjectAdminId, reason, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    const current = now();
    if (!currentPolicy.operational) return { ok: false, code: currentPolicy.enabled ? 'STAFF_TOTP_UNAVAILABLE' : 'STAFF_TOTP_DISABLED' };
    if (!isRecentAuthentication(session, current) || session?.recoveryRequired === true) return { ok: false, code: 'STAFF_RECENT_AUTH_REQUIRED' };
    const subjectId = Number(subjectAdminId);
    if (!Number.isSafeInteger(subjectId) || subjectId <= 0 || subjectId === Number(session.adminId)) {
      return { ok: false, code: 'STAFF_RESET_FORBIDDEN' };
    }
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const operator = await resolveAdmin(client, { adminId: session.adminId, forUpdate: true });
      const subject = await resolveAdmin(client, { adminId: subjectId, forUpdate: true });
      if (!allowed(operator, currentPolicy) || !subject || operator.permissions?.['staff_auth:reset'] !== true) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_RESET_FORBIDDEN' };
      }
      await client.query(
        `UPDATE staff_totp_credentials
            SET status = 'disabled', secret_ciphertext = NULL, secret_nonce = NULL,
                secret_auth_tag = NULL, secret_key_version = NULL,
                pending_secret_ciphertext = NULL, pending_secret_nonce = NULL,
                pending_secret_auth_tag = NULL, pending_secret_key_version = NULL,
                enrollment_started_at = NULL, enrollment_expires_at = NULL,
                last_accepted_timestep = NULL, replacement_required_at = $2,
                disabled_at = $2, disabled_reason = $3,
                failure_window_started_at = NULL, failed_attempt_count = 0, locked_until = NULL,
                updated_at = $2
          WHERE admin_id = $1`,
        [subject.id, current, cleanReason(reason)]
      );
      await client.query(
        `UPDATE staff_auth_recovery_codes SET revoked_at = COALESCE(revoked_at, $2)
          WHERE admin_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`,
        [subject.id, current]
      );
      const revoked = await client.query(
        `UPDATE staff_browser_sessions
            SET revoked_at = COALESCE(revoked_at, $2),
                revoke_reason = CASE WHEN revoked_at IS NULL THEN 'credential_reset' ELSE revoke_reason END
          WHERE admin_id = $1 AND revoked_at IS NULL`,
        [subject.id, current]
      );
      await audit(client, { eventType: 'credential_reset', operatorAdminId: operator.id, subjectAdminId: subject.id, authMethod: 'totp', reason: cleanReason(reason), requestFingerprintHash: sourceFingerprint(requestFingerprintHash), metadata: { revokedSessionCount: revoked.rowCount } });
      await audit(client, { eventType: 'sessions_revoked', operatorAdminId: operator.id, subjectAdminId: subject.id, authMethod: 'totp', reason: 'credential_reset', metadata: { revokedSessionCount: revoked.rowCount } });
      await client.query('COMMIT');
      return { ok: true, subjectAdminId: subject.id, revokedSessionCount: revoked.rowCount };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function issueBreakGlass({ adminId, operatorReference, controlReference } = {}) {
    const currentPolicy = policy();
    if (!currentPolicy.operational) return { ok: false, code: currentPolicy.enabled ? 'STAFF_TOTP_UNAVAILABLE' : 'STAFF_TOTP_DISABLED' };
    const operator = cleanReason(operatorReference, '');
    const control = cleanReason(controlReference, '');
    if (operator.length < 2 || control.length < 2) return { ok: false, code: 'STAFF_BREAK_GLASS_CONTROL_REQUIRED' };
    const current = now();
    const expiresAt = new Date(current.getTime() + BREAK_GLASS_TTL_MS);
    const token = randomBytes(32).toString('base64url');
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const admin = await resolveAdmin(client, { adminId, forUpdate: true });
      if (!allowed(admin, currentPolicy)) { await client.query('ROLLBACK'); return { ok: false, code: 'STAFF_BREAK_GLASS_FORBIDDEN' }; }
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-break-glass:' || $1::text, 0))`, [admin.id]);
      await client.query(
        `UPDATE staff_auth_break_glass_bootstraps SET revoked_at = $2
          WHERE admin_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`,
        [admin.id, current]
      );
      await client.query(
        `INSERT INTO staff_auth_break_glass_bootstraps
           (admin_id, token_hash, issued_at, expires_at, operator_reference, control_reference)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [admin.id, sha256(token), current, expiresAt, operator, control]
      );
      await client.query(
        `UPDATE staff_totp_credentials SET replacement_required_at = COALESCE(replacement_required_at, $2), updated_at = $2
          WHERE admin_id = $1`,
        [admin.id, current]
      );
      const revoked = await client.query(
        `UPDATE staff_browser_sessions SET revoked_at = COALESCE(revoked_at, $2),
           revoke_reason = CASE WHEN revoked_at IS NULL THEN 'break_glass' ELSE revoke_reason END
         WHERE admin_id = $1 AND revoked_at IS NULL`,
        [admin.id, current]
      );
      await audit(client, { eventType: 'break_glass_issued', subjectAdminId: admin.id, authMethod: 'break_glass', reason: control, metadata: { operatorReference: operator, controlReference: control, revokedSessionCount: revoked.rowCount } });
      await client.query('COMMIT');
      return { ok: true, token, expiresAt, url: buildBreakGlassUrl(token, env), subjectAdminId: admin.id };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function exchangeBreakGlass({ token, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    if (!currentPolicy.operational) return { ok: false, code: currentPolicy.enabled ? 'STAFF_TOTP_UNAVAILABLE' : 'STAFF_TOTP_DISABLED' };
    if (!/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return { ok: false, code: 'STAFF_BREAK_GLASS_INVALID' };
    const current = now();
    const fingerprint = sourceFingerprint(requestFingerprintHash);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const bootstrapResult = await client.query(
        `SELECT id, admin_id, expires_at, consumed_at, revoked_at, operator_reference, control_reference
           FROM staff_auth_break_glass_bootstraps WHERE token_hash = $1 LIMIT 1 FOR UPDATE`,
        [sha256(token)]
      );
      const bootstrap = bootstrapResult.rows[0];
      if (!bootstrap || bootstrap.consumed_at || bootstrap.revoked_at || new Date(bootstrap.expires_at).getTime() <= current.getTime()) {
        if (bootstrap && !bootstrap.consumed_at && !bootstrap.revoked_at) {
          await client.query(`UPDATE staff_auth_break_glass_bootstraps SET revoked_at = $2 WHERE id = $1`, [bootstrap.id, current]);
          await audit(client, { eventType: 'break_glass_expired', subjectAdminId: bootstrap.admin_id, authMethod: 'break_glass', requestFingerprintHash: fingerprint });
          await client.query('COMMIT');
        } else {
          await client.query('ROLLBACK');
        }
        return { ok: false, code: 'STAFF_BREAK_GLASS_INVALID' };
      }
      const admin = await resolveAdmin(client, { adminId: bootstrap.admin_id, forUpdate: true });
      if (!allowed(admin, currentPolicy)) {
        await client.query(`UPDATE staff_auth_break_glass_bootstraps SET revoked_at = $2 WHERE id = $1`, [bootstrap.id, current]);
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_BREAK_GLASS_INVALID' };
      }
      await client.query(`UPDATE staff_auth_break_glass_bootstraps SET consumed_at = $2 WHERE id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`, [bootstrap.id, current]);
      const issued = await issueStaffBrowserSession({
        client, admin, current, randomBytes, sessionTtlMs, requestFingerprintHash: fingerprint,
        authMethod: 'break_glass', recoveryRequired: true,
      });
      await audit(client, { eventType: 'break_glass_consumed', subjectAdminId: admin.id, authMethod: 'break_glass', reason: bootstrap.control_reference, requestFingerprintHash: fingerprint, metadata: { operatorReference: bootstrap.operator_reference, controlReference: bootstrap.control_reference } });
      await client.query('COMMIT');
      return issued;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function recordRollback({ operatorReference, controlReference, reason } = {}) {
    const operator = cleanReason(operatorReference, '');
    const control = cleanReason(controlReference, '');
    if (operator.length < 2 || control.length < 2) return { ok: false, code: 'STAFF_AUTH_CONTROL_REFERENCE_REQUIRED' };
    await audit(db, { eventType: 'rollback', authMethod: 'control', reason: cleanReason(reason, 'provider_independent_auth_disabled'), metadata: { operatorReference: operator, controlReference: control } });
    return { ok: true };
  }

  return {
    credentialStatus,
    verifyTotp,
    verifyRecovery,
    startEnrollment,
    confirmEnrollment,
    cancelEnrollment,
    regenerateRecoveryCodes,
    privilegedReset,
    issueBreakGlass,
    exchangeBreakGlass,
    recordRollback,
  };
}

module.exports = {
  FEATURE_FLAG,
  PILOT_IDS_FLAG,
  KEYRING_FLAG,
  ACTIVE_KEY_VERSION_FLAG,
  TOTP_ALGORITHM,
  TOTP_DIGITS,
  TOTP_PERIOD_SECONDS,
  TOTP_WINDOW,
  TOTP_SECRET_BYTES,
  RECOVERY_CODE_COUNT,
  RECOVERY_CODE_BYTES,
  ENROLLMENT_TTL_MS,
  RECENT_AUTH_TTL_MS,
  FAILURE_WINDOW_MS,
  ACCOUNT_FAILURE_LIMIT,
  SOURCE_FAILURE_LIMIT,
  LOCKOUT_MS,
  BREAK_GLASS_TTL_MS,
  isProviderIndependentAuthEnabled,
  parsePilotAdminIds,
  parseEncryptionKeyring,
  providerIndependentAuthPolicy,
  isCanonicalAuthorityActive,
  isRecentAuthentication,
  encryptTotpSecret,
  decryptTotpSecret,
  createTotp,
  validateTotp,
  normalizeRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  buildBreakGlassUrl,
  createProviderIndependentStaffAuthService,
};
