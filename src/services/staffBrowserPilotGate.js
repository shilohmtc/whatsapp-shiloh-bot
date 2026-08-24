const { normalizeWhatsapp } = require('./staffBrowserSession');

const PILOT_MODE_FLAG = 'SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED';
const PILOT_ADMIN_IDS_FLAG = 'SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS';

function isPilotModeEnabled(env = process.env) {
  return String(env[PILOT_MODE_FLAG] || '').trim().toLowerCase() === 'true';
}

function parsePilotAdminIds(env = process.env) {
  const raw = String(env[PILOT_ADMIN_IDS_FLAG] || '').trim();
  if (!raw) return { valid: false, ids: new Set() };

  const pieces = raw.split(',').map((value) => value.trim());
  if (!pieces.length || pieces.some((value) => !/^[1-9]\d*$/.test(value))) {
    return { valid: false, ids: new Set() };
  }

  const ids = new Set(pieces.map((value) => Number(value)));
  if (!ids.size || [...ids].some((value) => !Number.isSafeInteger(value) || value <= 0)) {
    return { valid: false, ids: new Set() };
  }
  return { valid: true, ids };
}

function pilotPolicy(env = process.env) {
  if (!isPilotModeEnabled(env)) {
    return { enabled: false, valid: true, ids: new Set() };
  }
  const parsed = parsePilotAdminIds(env);
  return { enabled: true, valid: parsed.valid, ids: parsed.ids };
}

function isAdminAllowedByPilot(adminId, env = process.env) {
  const policy = pilotPolicy(env);
  if (!policy.enabled) return true;
  if (!policy.valid) return false;
  const id = Number(adminId);
  return Number.isSafeInteger(id) && id > 0 && policy.ids.has(id);
}

async function resolveActiveCanonicalAdminId(db, whatsapp) {
  const normalized = normalizeWhatsapp(whatsapp);
  if (!normalized) return null;
  const result = await db.query(
    `SELECT id
       FROM staff_admin_accounts
      WHERE normalized_whatsapp = $1
        AND active = TRUE
      LIMIT 1`,
    [normalized]
  );
  const id = Number(result.rows[0]?.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function createPilotGuardedStaffBrowserSessionService({ service, db, env = process.env } = {}) {
  if (!service) throw new Error('staff browser session service is required');
  if (!db || typeof db.query !== 'function') throw new Error('staff browser pilot db is required');

  async function beginChallenge(input = {}) {
    const policy = pilotPolicy(env);
    if (!policy.enabled) return service.beginChallenge(input);
    if (!policy.valid) return { ok: true, accepted: true, delivered: false };

    const adminId = await resolveActiveCanonicalAdminId(db, input.whatsapp);
    if (!adminId || !policy.ids.has(adminId)) {
      return { ok: true, accepted: true, delivered: false };
    }
    return service.beginChallenge(input);
  }

  async function verifyChallenge(input = {}) {
    const policy = pilotPolicy(env);
    if (!policy.enabled) return service.verifyChallenge(input);
    if (!policy.valid) return { ok: false, code: 'STAFF_AUTH_INVALID_CHALLENGE' };

    const adminId = await resolveActiveCanonicalAdminId(db, input.whatsapp);
    if (!adminId || !policy.ids.has(adminId)) {
      return { ok: false, code: 'STAFF_AUTH_INVALID_CHALLENGE' };
    }
    return service.verifyChallenge(input);
  }

  async function validateSessionToken(token) {
    const policy = pilotPolicy(env);
    if (policy.enabled && !policy.valid) {
      return { ok: false, code: 'STAFF_SESSION_INVALID' };
    }

    const session = await service.validateSessionToken(token);
    if (!session?.ok) return session;
    if (policy.enabled && !policy.ids.has(Number(session.adminId))) {
      return { ok: false, code: 'STAFF_SESSION_INVALID' };
    }
    return session;
  }

  return {
    beginChallenge,
    verifyChallenge,
    validateSessionToken,
    rotateCsrfToken: (...args) => service.rotateCsrfToken(...args),
    revokeSession: (...args) => service.revokeSession(...args),
    revokeAllForAdmin: (...args) => service.revokeAllForAdmin(...args),
    validateCsrfToken: (...args) => service.validateCsrfToken(...args),
  };
}

module.exports = {
  PILOT_MODE_FLAG,
  PILOT_ADMIN_IDS_FLAG,
  isPilotModeEnabled,
  parsePilotAdminIds,
  pilotPolicy,
  isAdminAllowedByPilot,
  resolveActiveCanonicalAdminId,
  createPilotGuardedStaffBrowserSessionService,
};
