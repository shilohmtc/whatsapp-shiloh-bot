'use strict';

const logger = require('../lib/logger');
const { pool } = require('../db/pool');

const MODE_KEY = 'SHILOH_779_PRACTITIONER_ALIGNMENT_MODE';
const SOURCE_KEY = 'SHILOH_779_SOURCE_DISPLAY_NAME';
const TARGET_KEY = 'SHILOH_779_TARGET_DISPLAY_NAME';
const ALLOWED_MODES = new Set(['audit', 'apply']);
const FORBIDDEN_CAPABILITIES = new Set([
  'appointment:create', 'appointment:record_past', 'booking:update',
  'calendar:booking:create', 'calendar:booking:reschedule', 'calendar:booking:cancel', 'calendar:booking:reassign',
  'schedule:manage', 'services:manage', 'staff:manage', 'staff_access:manage',
  'client:manage', 'client:notify', 'client:delete', 'reports:view',
]);

function enabledCapabilities(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.keys(value).filter((key) => value[key] === true).sort();
}

function normalizeName(value, label) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 120) throw new Error(`#779 ${label} display name is required`);
  return name;
}

function sanitizeStaff(row) {
  if (!row) return null;
  return {
    id: Number(row.id), displayName: String(row.display_name || ''),
    resourceType: String(row.resource_type || ''), status: String(row.status || ''),
    schedulingType: String(row.scheduling_type || ''), clientBookable: row.client_bookable === true,
    businessRole: String(row.business_role || ''), calendarScope: String(row.calendar_scope || ''),
  };
}

function sanitizeAccess(row) {
  if (!row) return null;
  return {
    adminId: Number(row.id), staffId: row.staff_id == null ? null : Number(row.staff_id), active: row.active === true,
    role: String(row.role || ''), businessRole: String(row.business_role || ''),
    calendarScope: String(row.calendar_scope || ''), serviceScope: String(row.service_scope || ''),
    staffScope: String(row.staff_scope || ''), capabilities: enabledCapabilities(row.permissions),
  };
}

function sanitizeServices(rows = []) {
  return rows.map((row) => ({ serviceId: Number(row.service_id), name: String(row.name || ''), status: String(row.status || '') }));
}

function assertOne(rows, label) {
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error(`#779 expected exactly one ${label}; found ${Array.isArray(rows) ? rows.length : 0}`);
  }
  return rows[0];
}

function assertSourcePractitioner(staff, access) {
  if (!staff || !access) throw new Error('#779 source practitioner configuration is incomplete');
  if (staff.status !== 'active' || staff.resource_type !== 'practitioner') throw new Error('#779 source is not an active canonical practitioner');
  if (access.active !== true || Number(access.staff_id) !== Number(staff.id)) throw new Error('#779 source access is not actively linked to source Staff');
  if (access.role !== 'practitioner' || access.business_role !== 'employee_practitioner') throw new Error('#779 source access is not the normal employee practitioner preset');
  if (access.calendar_scope !== 'own_appointments' || access.service_scope !== 'own_services' || access.staff_scope !== 'own_staff') {
    throw new Error('#779 source access is not own-scope practitioner authority');
  }
  const forbidden = enabledCapabilities(access.permissions).filter((capability) => FORBIDDEN_CAPABILITIES.has(capability));
  if (forbidden.length) throw new Error(`#779 source practitioner unexpectedly has broadened capabilities: ${forbidden.join(',')}`);
}

async function loadNamedRows(queryable, table, name, { lock = false } = {}) {
  const suffix = lock ? ' FOR UPDATE' : '';
  const result = await queryable.query(`SELECT * FROM ${table} WHERE LOWER(TRIM(display_name))=LOWER(TRIM($1)) ORDER BY id LIMIT 3${suffix}`, [name]);
  return result.rows || [];
}

async function loadServices(queryable, staffId) {
  const result = await queryable.query(
    `SELECT ss.service_id, svc.name, svc.status
       FROM staff_services ss JOIN services svc ON svc.id=ss.service_id
      WHERE ss.staff_id=$1 ORDER BY ss.service_id`, [staffId]
  );
  return result.rows || [];
}

async function loadSnapshot(queryable, sourceName, targetName, { lock = false, validateSource = true } = {}) {
  const sourceStaff = assertOne(await loadNamedRows(queryable, 'staff', sourceName, { lock }), 'source Staff row');
  const sourceAccess = assertOne(await loadNamedRows(queryable, 'staff_admin_accounts', sourceName, { lock }), 'source access principal');
  const targetAccess = assertOne(await loadNamedRows(queryable, 'staff_admin_accounts', targetName, { lock }), 'target access principal');
  const targetStaffRows = await loadNamedRows(queryable, 'staff', targetName, { lock });
  if (targetStaffRows.length > 1) throw new Error(`#779 expected zero or one target Staff row; found ${targetStaffRows.length}`);
  const targetStaff = targetStaffRows[0] || null;
  if (validateSource) assertSourcePractitioner(sourceStaff, sourceAccess);
  if (targetStaff && targetAccess.staff_id != null && Number(targetAccess.staff_id) !== Number(targetStaff.id)) {
    throw new Error('#779 target access is linked to a different Staff row');
  }
  return {
    sourceStaff, sourceAccess, sourceServices: await loadServices(queryable, sourceStaff.id),
    targetStaff, targetAccess, targetServices: targetStaff ? await loadServices(queryable, targetStaff.id) : [],
  };
}

function sanitizedSnapshot(snapshot) {
  return {
    source: { staff: sanitizeStaff(snapshot.sourceStaff), access: sanitizeAccess(snapshot.sourceAccess), services: sanitizeServices(snapshot.sourceServices) },
    target: { staff: sanitizeStaff(snapshot.targetStaff), access: sanitizeAccess(snapshot.targetAccess), services: sanitizeServices(snapshot.targetServices) },
  };
}

function sameServiceIds(a = [], b = []) {
  const aa = a.map((row) => Number(row.service_id)).sort((x, y) => x - y);
  const bb = b.map((row) => Number(row.service_id)).sort((x, y) => x - y);
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
}

function alreadyAligned(snapshot) {
  const s = snapshot.sourceStaff; const t = snapshot.targetStaff;
  const sa = snapshot.sourceAccess; const ta = snapshot.targetAccess;
  if (!t) return false;
  return t.resource_type === s.resource_type && t.status === s.status && t.scheduling_type === s.scheduling_type
    && t.client_bookable === s.client_bookable && t.business_role === s.business_role && t.calendar_scope === s.calendar_scope
    && Number(ta.staff_id) === Number(t.id) && ta.active === true && ta.role === sa.role
    && ta.business_role === sa.business_role && ta.calendar_scope === sa.calendar_scope
    && ta.service_scope === sa.service_scope && ta.staff_scope === sa.staff_scope
    && JSON.stringify(enabledCapabilities(ta.permissions)) === JSON.stringify(enabledCapabilities(sa.permissions))
    && sameServiceIds(snapshot.sourceServices, snapshot.targetServices);
}

async function applyAlignment({ db = pool, sourceName, targetName } = {}) {
  if (!db || typeof db.connect !== 'function') throw new Error('#779 transactional database is required');
  const source = normalizeName(sourceName, 'source'); const target = normalizeName(targetName, 'target');
  if (source.toLowerCase() === target.toLowerCase()) throw new Error('#779 source and target must differ');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [779000001]);
    const before = await loadSnapshot(client, source, target, { lock: true });
    if (alreadyAligned(before)) { await client.query('COMMIT'); return { status: 'unchanged', before: sanitizedSnapshot(before), after: sanitizedSnapshot(before) }; }

    let targetStaff = before.targetStaff;
    if (!targetStaff) {
      const inserted = await client.query(
        `INSERT INTO staff(display_name,resource_type,status,scheduling_type,client_bookable,business_role,calendar_scope,source_name)
         VALUES($1,$2,$3,$4,$5,$6,$7,NULL) RETURNING *`,
        [before.targetAccess.display_name, before.sourceStaff.resource_type, before.sourceStaff.status, before.sourceStaff.scheduling_type,
          before.sourceStaff.client_bookable, before.sourceStaff.business_role, before.sourceStaff.calendar_scope]
      );
      targetStaff = assertOne(inserted.rows, 'inserted target Staff row');
    } else {
      const updated = await client.query(
        `UPDATE staff SET resource_type=$2,status=$3,scheduling_type=$4,client_bookable=$5,business_role=$6,calendar_scope=$7,updated_at=NOW()
          WHERE id=$1 RETURNING *`,
        [targetStaff.id, before.sourceStaff.resource_type, before.sourceStaff.status, before.sourceStaff.scheduling_type,
          before.sourceStaff.client_bookable, before.sourceStaff.business_role, before.sourceStaff.calendar_scope]
      );
      targetStaff = assertOne(updated.rows, 'updated target Staff row');
    }

    await client.query(
      `UPDATE staff_admin_accounts
          SET staff_id=$2,role=$3,active=TRUE,permissions=$4::jsonb,business_role=$5,calendar_scope=$6,service_scope=$7,staff_scope=$8,updated_at=NOW()
        WHERE id=$1`,
      [before.targetAccess.id, targetStaff.id, before.sourceAccess.role, JSON.stringify(before.sourceAccess.permissions || {}),
        before.sourceAccess.business_role, before.sourceAccess.calendar_scope, before.sourceAccess.service_scope, before.sourceAccess.staff_scope]
    );

    await client.query(
      `DELETE FROM staff_services target WHERE target.staff_id=$1
        AND NOT EXISTS (SELECT 1 FROM staff_services source WHERE source.staff_id=$2 AND source.service_id=target.service_id)`,
      [targetStaff.id, before.sourceStaff.id]
    );
    await client.query(
      `INSERT INTO staff_services(staff_id,service_id)
       SELECT $1, source.service_id FROM staff_services source WHERE source.staff_id=$2
       AND NOT EXISTS (SELECT 1 FROM staff_services target WHERE target.staff_id=$1 AND target.service_id=source.service_id)`,
      [targetStaff.id, before.sourceStaff.id]
    );

    const after = await loadSnapshot(client, source, target);
    if (!alreadyAligned(after)) throw new Error('#779 post-write verification did not match source practitioner configuration');
    const beforeTarget = sanitizedSnapshot(before).target; const afterTarget = sanitizedSnapshot(after).target;
    await client.query(
      `INSERT INTO staff_auth_security_events(event_type,operator_admin_id,subject_admin_id,auth_method,reason,metadata)
       VALUES('practitioner_alignment',NULL,$1,'control','Control issue #779',$2::jsonb)`,
      [before.targetAccess.id, JSON.stringify({
        issue: 779, sourceStaffId: Number(before.sourceStaff.id), targetStaffId: Number(targetStaff.id),
        sourceAdminId: Number(before.sourceAccess.id), targetAdminId: Number(before.targetAccess.id),
        identityMaterialCopied: false, authenticationMaterialChanged: false, providerSend: false, teamRoutingAuthorityChanged: false,
        before: beforeTarget, after: afterTarget,
      })]
    );
    await client.query('COMMIT');
    return { status: 'aligned', before: sanitizedSnapshot(before), after: sanitizedSnapshot(after) };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally { client.release(); }
}

async function runConfiguredAlignment({ db = pool, env = process.env, log = logger } = {}) {
  const mode = String(env?.[MODE_KEY] || '').trim().toLowerCase();
  if (!mode) return { status: 'disabled' };
  if (!ALLOWED_MODES.has(mode)) throw new Error(`#779 unsupported mode: ${mode}`);
  const sourceName = normalizeName(env?.[SOURCE_KEY], 'source'); const targetName = normalizeName(env?.[TARGET_KEY], 'target');
  if (mode === 'audit') {
    const snapshot = await loadSnapshot(db, sourceName, targetName, { validateSource: false });
    let sourceValidationError = null;
    try { assertSourcePractitioner(snapshot.sourceStaff, snapshot.sourceAccess); } catch (error) { sourceValidationError = String(error?.message || error); }
    const result = {
      status: 'audited', snapshot: sanitizedSnapshot(snapshot), sourceValidationError,
      alreadyAligned: sourceValidationError ? false : alreadyAligned(snapshot),
    };
    log.info(result, '#779 sanitized practitioner alignment audit'); return result;
  }
  const result = await applyAlignment({ db, sourceName, targetName });
  log.info(result, '#779 practitioner alignment applied and verified'); return result;
}

if (require.main !== module && String(process.env?.[MODE_KEY] || '').trim()) {
  setImmediate(() => runConfiguredAlignment().catch((error) => logger.error({ err: error }, '#779 practitioner alignment control failed closed')));
}

module.exports = {
  MODE_KEY, SOURCE_KEY, TARGET_KEY, FORBIDDEN_CAPABILITIES, enabledCapabilities,
  sanitizeStaff, sanitizeAccess, sanitizeServices, assertSourcePractitioner,
  sanitizedSnapshot, sameServiceIds, alreadyAligned, loadSnapshot, applyAlignment, runConfiguredAlignment,
};
