const { pool } = require('../db/pool');
const { deriveCalendarViewer } = require('./staffBrowserSession');
const { CALENDAR_CAPABILITIES } = require('./calendarAuthorization');

function flagEnabled(env, key) {
  return String(env?.[key] || '').trim().toLowerCase() === 'true';
}

function sanitizeAuthority(row) {
  const viewer = deriveCalendarViewer({
    ...row,
    permissions: { [CALENDAR_CAPABILITIES.VIEW]: row.calendar_view === true },
  });
  return {
    principal: String(row.display_name || ''),
    adminActive: row.admin_active === true,
    staffLinked: row.staff_id != null,
    staffActive: row.staff_id == null ? null : row.staff_status === 'active',
    businessRole: String(row.business_role || ''),
    calendarScope: String(row.calendar_scope || ''),
    serviceScope: String(row.service_scope || ''),
    viewerScope: viewer?.calendarScope || null,
  };
}

async function runCalendarAccessDiagnostic({ db = pool, env = process.env } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Calendar access diagnostic db is required');

  const result = await db.query(
    `SELECT a.id, a.staff_id, a.display_name, a.business_role, a.calendar_scope, a.service_scope,
            a.active AS admin_active, s.status AS staff_status,
            (a.permissions ->> 'appointment:view' = 'true') AS calendar_view
       FROM staff_admin_accounts a
       LEFT JOIN staff s ON s.id = a.staff_id
      WHERE a.permissions ?| $1::text[]
      ORDER BY a.id`,
    [Object.values(CALENDAR_CAPABILITIES)]
  );

  const authorities = (result.rows || []).map((row) => sanitizeAuthority(row));
  return {
    calendarReadOnlyUxEnabled: flagEnabled(env, 'SHILOH_CALENDAR_READONLY_UX_ENABLED'),
    staffBrowserCalendarBridgeEnabled: flagEnabled(env, 'SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED'),
    expectedPrincipalCount: authorities.length,
    matchedPrincipalCount: authorities.length,
    authorities,
  };
}

module.exports = {
  flagEnabled,
  sanitizeAuthority,
  runCalendarAccessDiagnostic,
};
