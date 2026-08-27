const { pool } = require('../db/pool');
const { deriveCalendarViewer } = require('./staffBrowserSession');
const { pilotPolicy, isAdminAllowedByPilot } = require('./staffBrowserPilotGate');
const { isEmergencyCalendarBookingEnabled } = require('./emergencyCalendarBootstrap');

const GOVERNED_PRINCIPALS = ['christel', 'jean-pierre', 'abigail', 'marietjie'];

function flagEnabled(env, key) {
  return String(env?.[key] || '').trim().toLowerCase() === 'true';
}

function sanitizeAuthority(row, env) {
  const viewer = deriveCalendarViewer(row);
  return {
    principal: String(row.display_name || ''),
    adminActive: row.admin_active === true,
    staffLinked: row.staff_id != null,
    staffActive: row.staff_id == null ? null : row.staff_status === 'active',
    businessRole: String(row.business_role || ''),
    calendarScope: String(row.calendar_scope || ''),
    serviceScope: String(row.service_scope || ''),
    pilotAllowed: isAdminAllowedByPilot(Number(row.id), env),
    viewerScope: viewer?.calendarScope || null,
  };
}

async function runCalendarAccessDiagnostic({ db = pool, env = process.env } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Calendar access diagnostic db is required');

  const result = await db.query(
    `SELECT a.id, a.staff_id, a.display_name, a.business_role, a.calendar_scope, a.service_scope,
            a.active AS admin_active, s.status AS staff_status
       FROM staff_admin_accounts a
       LEFT JOIN staff s ON s.id = a.staff_id
      WHERE LOWER(a.display_name) = ANY($1::text[])
      ORDER BY array_position($1::text[], LOWER(a.display_name)), a.id`,
    [GOVERNED_PRINCIPALS]
  );

  const policy = pilotPolicy(env);
  const authorities = (result.rows || []).map((row) => sanitizeAuthority(row, env));
  return {
    calendarReadOnlyUxEnabled: flagEnabled(env, 'SHILOH_CALENDAR_READONLY_UX_ENABLED'),
    staffBrowserCalendarBridgeEnabled: flagEnabled(env, 'SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED'),
    calendarHandoffEnabled: isEmergencyCalendarBookingEnabled(env),
    pilotModeEnabled: policy.enabled,
    pilotConfigValid: policy.valid,
    expectedPrincipalCount: GOVERNED_PRINCIPALS.length,
    matchedPrincipalCount: authorities.length,
    authorities,
  };
}

module.exports = {
  GOVERNED_PRINCIPALS,
  flagEnabled,
  sanitizeAuthority,
  runCalendarAccessDiagnostic,
};