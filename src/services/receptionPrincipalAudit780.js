'use strict';

const logger = require('../lib/logger');
const { pool } = require('../db/pool');

const AUDIT_KEY = 'SHILOH_780_RECEPTION_AUDIT_ON_START';
const TARGET_NAME = 'Shiloh Reception';

function permissionSet(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function enabledCapabilities(value) {
  const permissions = permissionSet(value);
  return Object.keys(permissions).filter((key) => permissions[key] === true).sort();
}

function sanitizePrincipal(row, { includeDisplayName = false } = {}) {
  if (!row) return null;
  const result = {
    adminId: Number(row.id),
    staffId: row.staff_id == null ? null : Number(row.staff_id),
    active: row.active === true,
    role: String(row.role || ''),
    businessRole: String(row.business_role || ''),
    calendarScope: String(row.calendar_scope || ''),
    serviceScope: String(row.service_scope || ''),
    linkedStaffStatus: row.staff_status == null ? null : String(row.staff_status),
    linkedStaffResourceType: row.staff_resource_type == null ? null : String(row.staff_resource_type),
    capabilities: enabledCapabilities(row.permissions),
  };
  if (includeDisplayName) result.displayName = String(row.display_name || '');
  return result;
}

async function loadAudit({ db = pool } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('#780 queryable database is required');
  const targetResult = await db.query(
    `/* receptionPrincipalAudit780:target */
     SELECT a.id,a.staff_id,a.display_name,a.active,a.role,a.permissions,
            a.business_role,a.calendar_scope,a.service_scope,
            s.status AS staff_status,s.resource_type AS staff_resource_type
       FROM staff_admin_accounts a
       LEFT JOIN staff s ON s.id=a.staff_id
      WHERE LOWER(TRIM(a.display_name))=LOWER(TRIM($1))
      ORDER BY a.id
      LIMIT 3`,
    [TARGET_NAME]
  );
  const cohortResult = await db.query(
    `/* receptionPrincipalAudit780:booking-operator-cohort */
     SELECT a.id,a.staff_id,a.display_name,a.active,a.role,a.permissions,
            a.business_role,a.calendar_scope,a.service_scope,
            s.status AS staff_status,s.resource_type AS staff_resource_type
       FROM staff_admin_accounts a
       LEFT JOIN staff s ON s.id=a.staff_id
      WHERE a.business_role='booking_operator'
      ORDER BY a.id
      LIMIT 20`
  );
  const staffResult = await db.query(
    `/* receptionPrincipalAudit780:staff-name-collision */
     SELECT id,resource_type,status,business_role,calendar_scope
       FROM staff
      WHERE LOWER(TRIM(display_name))=LOWER(TRIM($1))
      ORDER BY id
      LIMIT 3`,
    [TARGET_NAME]
  );

  return {
    targetName: TARGET_NAME,
    targetCount: targetResult.rows.length,
    target: targetResult.rows.map((row) => sanitizePrincipal(row, { includeDisplayName: true })),
    bookingOperatorCount: cohortResult.rows.length,
    bookingOperators: cohortResult.rows.map((row) => sanitizePrincipal(row)),
    staffNameCollisionCount: staffResult.rows.length,
    staffNameCollisions: staffResult.rows.map((row) => ({
      staffId: Number(row.id),
      resourceType: String(row.resource_type || ''),
      status: String(row.status || ''),
      businessRole: String(row.business_role || ''),
      calendarScope: String(row.calendar_scope || ''),
    })),
    staffScopeColumnPresent: false,
    secretsExposed: false,
    mutationPerformed: false,
  };
}

async function runConfiguredAudit({ db = pool, env = process.env, log = logger } = {}) {
  if (String(env?.[AUDIT_KEY] || '').trim().toLowerCase() !== 'true') return { status: 'disabled' };
  const audit = await loadAudit({ db });
  const result = { status: 'audited', audit };
  log.info(result, '#780 sanitized Reception principal audit');
  return result;
}

if (require.main !== module && String(process.env?.[AUDIT_KEY] || '').trim().toLowerCase() === 'true') {
  setImmediate(() => runConfiguredAudit().catch((error) => logger.error({ err: error }, '#780 Reception principal audit failed closed')));
}

module.exports = { AUDIT_KEY, TARGET_NAME, permissionSet, enabledCapabilities, sanitizePrincipal, loadAudit, runConfiguredAudit };
