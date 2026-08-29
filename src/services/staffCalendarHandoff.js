const crypto = require('crypto');
const { pool } = require('../db/pool');
const {
  DEFAULT_SESSION_TTL_MS,
  normalizeWhatsapp,
  sha256,
  randomOpaqueToken,
  deriveCalendarViewer,
  issueStaffBrowserSession,
} = require('./staffBrowserSession');

const HANDOFF_TOKEN_BYTES = 32;
const DEFAULT_HANDOFF_TTL_MS = 2 * 60 * 1000;

function calendarHandoffPublicOrigin(env = process.env) {
  const raw = String(env.SHILOH_CALENDAR_PUBLIC_ORIGIN || env.RENDER_EXTERNAL_URL || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.origin;
  } catch (_) {
    return null;
  }
}

function buildCalendarHandoffUrl(token, env = process.env) {
  const origin = calendarHandoffPublicOrigin(env);
  if (!origin || !/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return null;
  return `${origin}/calendar/staff/handoff#handoff=${encodeURIComponent(token)}`;
}

function isCalendarHandoffAuthority(admin) {
  return Boolean(deriveCalendarViewer(admin));
}

function createStaffCalendarHandoffService({
  db = pool,
  now = () => new Date(),
  randomBytes = crypto.randomBytes,
  handoffTtlMs = DEFAULT_HANDOFF_TTL_MS,
  sessionTtlMs = DEFAULT_SESSION_TTL_MS,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('staff Calendar handoff db is required');

  async function resolveAuthority(client, { whatsapp = null, adminId = null, forUpdate = false } = {}) {
    const values = [];
    let predicate;
    if (whatsapp != null) {
      const normalized = normalizeWhatsapp(whatsapp);
      if (!normalized) return null;
      values.push(normalized);
      predicate = 'a.normalized_whatsapp = $1';
    } else {
      const id = Number(adminId);
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      values.push(id);
      predicate = 'a.id = $1';
    }

    const result = await client.query(
      `SELECT a.id, a.staff_id, a.display_name, a.role, a.business_role, a.calendar_scope,
              a.service_scope, a.permissions, a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id = a.staff_id
        WHERE ${predicate}
          AND a.active = TRUE
        ORDER BY a.id ASC
        LIMIT 2${forUpdate ? '\n        FOR UPDATE OF a' : ''}`,
      values
    );
    if (result.rows.length !== 1) return null;
    const admin = result.rows[0];
    return isCalendarHandoffAuthority(admin) ? admin : null;
  }

  async function issueForWhatsapp({ whatsapp } = {}) {
    const normalized = normalizeWhatsapp(whatsapp);
    if (!normalized) return { ok: false, code: 'STAFF_CALENDAR_HANDOFF_FORBIDDEN' };

    const current = now();
    const expiresAt = new Date(current.getTime() + handoffTtlMs);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-calendar-handoff-whatsapp:' || $1::text, 0))`, [normalized]);
      const admin = await resolveAuthority(client, { whatsapp: normalized, forUpdate: true });
      if (!admin) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_CALENDAR_HANDOFF_FORBIDDEN' };
      }

      const adminId = Number(admin.id);
      const token = randomOpaqueToken(randomBytes, HANDOFF_TOKEN_BYTES);
      const tokenHash = sha256(token);
      await client.query(
        `UPDATE staff_browser_emergency_bootstraps
            SET revoked_at = $2
          WHERE admin_id = $1
            AND consumed_at IS NULL
            AND revoked_at IS NULL`,
        [adminId, current]
      );
      await client.query(
        `INSERT INTO staff_browser_emergency_bootstraps
           (admin_id, token_hash, issued_at, expires_at, issued_via)
         VALUES ($1, $2, $3, $4, 'whatsapp_admin')`,
        [adminId, tokenHash, current, expiresAt]
      );
      await client.query('COMMIT');
      return { ok: true, token, expiresAt, adminId, viewer: deriveCalendarViewer(admin) };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function exchange({ token, requestFingerprintHash = null } = {}) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) {
      return { ok: false, code: 'STAFF_CALENDAR_HANDOFF_INVALID' };
    }

    const current = now();
    const tokenHash = sha256(token);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const handoffResult = await client.query(
        `SELECT id, admin_id, expires_at, consumed_at, revoked_at
           FROM staff_browser_emergency_bootstraps
          WHERE token_hash = $1
          LIMIT 1
          FOR UPDATE`,
        [tokenHash]
      );
      const handoff = handoffResult.rows[0] || null;
      const adminId = Number(handoff?.admin_id);
      if (!handoff || handoff.consumed_at || handoff.revoked_at || !Number.isSafeInteger(adminId) || adminId <= 0) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_CALENDAR_HANDOFF_INVALID' };
      }
      if (new Date(handoff.expires_at).getTime() <= current.getTime()) {
        await client.query(
          `UPDATE staff_browser_emergency_bootstraps SET revoked_at = $2 WHERE id = $1`,
          [handoff.id, current]
        );
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_CALENDAR_HANDOFF_INVALID' };
      }

      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-browser-auth:' || $1::text, 0))`, [adminId]);
      const admin = await resolveAuthority(client, { adminId, forUpdate: true });
      if (!admin || Number(admin.id) !== adminId) {
        await client.query(
          `UPDATE staff_browser_emergency_bootstraps SET revoked_at = $2 WHERE id = $1`,
          [handoff.id, current]
        );
        await client.query('COMMIT');
        return { ok: false, code: 'STAFF_CALENDAR_HANDOFF_INVALID' };
      }

      const consumed = await client.query(
        `UPDATE staff_browser_emergency_bootstraps
            SET consumed_at = $2
          WHERE id = $1
            AND consumed_at IS NULL
            AND revoked_at IS NULL
         RETURNING id`,
        [handoff.id, current]
      );
      if (Number(consumed.rowCount ?? consumed.rows.length) !== 1) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_CALENDAR_HANDOFF_INVALID' };
      }

      // `emergency_bootstrap` is the retained schema enum value for this existing
      // session-minting primitive. Authority is now entirely canonical/capability-driven.
      const session = await issueStaffBrowserSession({
        client,
        admin,
        current,
        randomBytes,
        sessionTtlMs,
        requestFingerprintHash,
        authMethod: 'emergency_bootstrap',
        recoveryRequired: false,
      });
      await client.query('COMMIT');
      return { ...session, adminId, viewer: deriveCalendarViewer(admin) };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  return { issueForWhatsapp, exchange, resolveAuthority };
}

module.exports = {
  HANDOFF_TOKEN_BYTES,
  DEFAULT_HANDOFF_TTL_MS,
  calendarHandoffPublicOrigin,
  buildCalendarHandoffUrl,
  isCalendarHandoffAuthority,
  createStaffCalendarHandoffService,
};
