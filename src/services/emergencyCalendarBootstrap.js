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
const { isAdminAllowedByPilot } = require('./staffBrowserPilotGate');

const EMERGENCY_ADMIN_ID = 2;
const BOOTSTRAP_TOKEN_BYTES = 32;
const DEFAULT_BOOTSTRAP_TTL_MS = 2 * 60 * 1000;
const FEATURE_FLAG = 'SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED';
const PUBLIC_ORIGIN_FLAG = 'SHILOH_CALENDAR_PUBLIC_ORIGIN';

function isEmergencyCalendarBookingEnabled(env = process.env) {
  return String(env[FEATURE_FLAG] || '').trim().toLowerCase() === 'true';
}

function hasPermission(admin, permission) {
  return admin?.permissions && admin.permissions[permission] === true;
}

function isCalendarHandoffAuthority(admin, env = process.env) {
  const adminId = Number(admin?.id);
  if (!Number.isSafeInteger(adminId) || adminId <= 0 || admin?.admin_active !== true) return false;
  if (!isAdminAllowedByPilot(adminId, env)) return false;
  if (!admin.staff_id || admin.staff_status !== 'active') return false;
  return Boolean(deriveCalendarViewer(admin));
}

function isEmergencyChristelAuthority(admin, env = process.env) {
  if (!admin || Number(admin.id) !== EMERGENCY_ADMIN_ID || admin.admin_active !== true) return false;
  if (!isAdminAllowedByPilot(EMERGENCY_ADMIN_ID, env)) return false;
  if (admin.staff_status !== 'active') return false;
  if (admin.calendar_scope !== 'all_business' || admin.service_scope !== 'all_services') return false;
  if (!hasPermission(admin, 'appointment:create') || !hasPermission(admin, 'client:lookup')) return false;
  const viewer = deriveCalendarViewer(admin);
  return viewer?.calendarScope === 'business_all_staff';
}

function emergencyCalendarPublicOrigin(env = process.env) {
  const raw = String(env[PUBLIC_ORIGIN_FLAG] || env.RENDER_EXTERNAL_URL || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.origin;
  } catch (_) {
    return null;
  }
}

function buildEmergencyCalendarUrl(token, env = process.env) {
  const origin = emergencyCalendarPublicOrigin(env);
  if (!origin || !/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return null;
  return `${origin}/calendar/staff#bootstrap=${encodeURIComponent(token)}`;
}

function createEmergencyCalendarBootstrapService({
  db = pool,
  env = process.env,
  now = () => new Date(),
  randomBytes = crypto.randomBytes,
  bootstrapTtlMs = DEFAULT_BOOTSTRAP_TTL_MS,
  sessionTtlMs = DEFAULT_SESSION_TTL_MS,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('emergency Calendar bootstrap db is required');

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
              a.service_scope, a.permissions, a.active AS admin_active,
              s.status AS staff_status, s.client_bookable
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
    return isCalendarHandoffAuthority(admin, env) ? admin : null;
  }

  async function issueForWhatsapp({ whatsapp } = {}) {
    if (!isEmergencyCalendarBookingEnabled(env)) return { ok: false, code: 'EMERGENCY_CALENDAR_DISABLED' };
    const normalized = normalizeWhatsapp(whatsapp);
    if (!normalized) return { ok: false, code: 'EMERGENCY_CALENDAR_FORBIDDEN' };

    const current = now();
    const expiresAt = new Date(current.getTime() + bootstrapTtlMs);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const admin = await resolveAuthority(client, { whatsapp: normalized, forUpdate: true });
      if (!admin) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'EMERGENCY_CALENDAR_FORBIDDEN' };
      }
      const adminId = Number(admin.id);
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('emergency-calendar-bootstrap:' || $1::text, 0))`, [adminId]);
      const token = randomOpaqueToken(randomBytes, BOOTSTRAP_TOKEN_BYTES);
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
    if (!isEmergencyCalendarBookingEnabled(env)) return { ok: false, code: 'EMERGENCY_CALENDAR_DISABLED' };
    if (!/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return { ok: false, code: 'EMERGENCY_CALENDAR_INVALID_BOOTSTRAP' };

    const current = now();
    const tokenHash = sha256(token);
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const bootstrapResult = await client.query(
        `SELECT id, admin_id, expires_at, consumed_at, revoked_at
           FROM staff_browser_emergency_bootstraps
          WHERE token_hash = $1
          LIMIT 1
          FOR UPDATE`,
        [tokenHash]
      );
      const bootstrap = bootstrapResult.rows[0] || null;
      const adminId = Number(bootstrap?.admin_id);
      if (!bootstrap || bootstrap.consumed_at || bootstrap.revoked_at || !Number.isSafeInteger(adminId) || adminId <= 0) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'EMERGENCY_CALENDAR_INVALID_BOOTSTRAP' };
      }
      if (new Date(bootstrap.expires_at).getTime() <= current.getTime()) {
        await client.query(
          `UPDATE staff_browser_emergency_bootstraps SET revoked_at = $2 WHERE id = $1`,
          [bootstrap.id, current]
        );
        await client.query('COMMIT');
        return { ok: false, code: 'EMERGENCY_CALENDAR_INVALID_BOOTSTRAP' };
      }

      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-browser-auth:' || $1::text, 0))`, [adminId]);
      const admin = await resolveAuthority(client, { adminId, forUpdate: true });
      if (!admin || Number(admin.id) !== adminId) {
        await client.query(
          `UPDATE staff_browser_emergency_bootstraps SET revoked_at = $2 WHERE id = $1`,
          [bootstrap.id, current]
        );
        await client.query('COMMIT');
        return { ok: false, code: 'EMERGENCY_CALENDAR_INVALID_BOOTSTRAP' };
      }

      const consumed = await client.query(
        `UPDATE staff_browser_emergency_bootstraps
            SET consumed_at = $2
          WHERE id = $1
            AND consumed_at IS NULL
            AND revoked_at IS NULL
         RETURNING id`,
        [bootstrap.id, current]
      );
      if (consumed.rows.length !== 1) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'EMERGENCY_CALENDAR_INVALID_BOOTSTRAP' };
      }

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
  EMERGENCY_ADMIN_ID,
  BOOTSTRAP_TOKEN_BYTES,
  DEFAULT_BOOTSTRAP_TTL_MS,
  FEATURE_FLAG,
  PUBLIC_ORIGIN_FLAG,
  isEmergencyCalendarBookingEnabled,
  isCalendarHandoffAuthority,
  isEmergencyChristelAuthority,
  emergencyCalendarPublicOrigin,
  buildEmergencyCalendarUrl,
  createEmergencyCalendarBootstrapService,
};