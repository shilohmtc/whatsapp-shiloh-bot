const { createHash } = require('crypto');
const { pool } = require('../db/pool');
const workspaceStaffAccess = require('./workspaceStaffAccess');
const { RETROSPECTIVE_CLIENT_IDS_KEY, evaluateCalendarAuthority } = require('./calendarAuthorization');
const {
  WorkspaceStaffError,
  positiveId,
  permissionSet,
  requireRequestId,
  requireExpectedRevision,
} = require('./workspaceStaff');

const STAFF_ACCESS_POLICY_VERSION = 'workspace_staff_access_policy_v1';
const STAFF_ACCESS_LOCK_BASE = 749000000000;
const PRACTITIONER_POLICY_CAPABILITIES = Object.freeze([
  'appointment:view',
  'booking:update',
]);
const PRACTITIONER_POLICY_CAPABILITY_SET = new Set(PRACTITIONER_POLICY_CAPABILITIES);
const RECORD_PAST = 'appointment:record_past';
const ADJUST_END = 'appointment:adjust_end';
const CALENDAR_OPERATIONAL_ACCESS_CAPABILITIES = Object.freeze([RECORD_PAST, ADJUST_END]);
const CALENDAR_OPERATIONAL_ACCESS_CAPABILITY_SET = new Set(CALENDAR_OPERATIONAL_ACCESS_CAPABILITIES);
const MANDATORY_PRACTITIONER_CAPABILITIES = Object.freeze(['appointment:view']);
const PRACTITIONER_POLICY_DEFINITIONS = Object.freeze([
  Object.freeze({
    key: 'appointment:view',
    label: 'Workspace & Calendar',
    description: 'See your own Workspace Dashboard and permitted appointments.',
    mandatory: true,
  }),
  Object.freeze({
    key: 'booking:update',
    label: 'Complete / No-show visits',
    description: 'Record Completed or No-show only for visits whose canonical assignments resolve entirely to you.',
    mandatory: false,
  }),
]);

function enabledCapabilities(permissions) {
  const source = permissionSet(permissions);
  return Object.keys(source).filter(key => source[key] === true).sort();
}

function accessPolicyRevision(row) {
  if (!row) return null;
  const canonical = {
    id: positiveId(row.id),
    staffId: positiveId(row.staff_id),
    active: row.active === true,
    role: String(row.role || ''),
    businessRole: String(row.business_role || ''),
    calendarScope: String(row.calendar_scope || ''),
    serviceScope: String(row.service_scope || ''),
    capabilities: enabledCapabilities(row.permissions),
    retrospectiveClientIds: normalizedRetrospectiveClientIds(row.permissions),
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function normalizedRetrospectiveClientIds(permissions) {
  const source=permissionSet(permissions);
  if (!Object.prototype.hasOwnProperty.call(source,RETROSPECTIVE_CLIENT_IDS_KEY)) return null;
  if (!Array.isArray(source[RETROSPECTIVE_CLIENT_IDS_KEY])) return false;
  const ids=source[RETROSPECTIVE_CLIENT_IDS_KEY].map(Number);
  if (ids.some(id=>!Number.isSafeInteger(id)||id<=0)) return false;
  return [...new Set(ids)].sort((a,b)=>a-b);
}

function retrospectivePolicy(staff, rows=[]) {
  if (!staff || staff.status!=='active' || rows.length!==1) return null;
  const row=rows[0], permissions=permissionSet(row.permissions);
  if (row.active!==true || positiveId(row.staff_id)!==positiveId(staff.id) || permissions['appointment:create']!==true) return null;
  if (!evaluateCalendarAuthority({ ...row, admin_active:true, staff_status:staff.status })) return null;
  const ids=normalizedRetrospectiveClientIds(permissions);
  if (ids===false) return { supported:false, reason:'The retrospective client condition is malformed and must be reconciled before editing.' };
  return { supported:true, row, ids };
}

function normalizeRequestedCapabilities(value) {
  if (!Array.isArray(value)) {
    throw new WorkspaceStaffError(
      'WORKSPACE_STAFF_ACCESS_POLICY_INVALID',
      'Choose access capabilities from the supported practitioner controls.',
      400
    );
  }
  const requested = new Set();
  for (const raw of value) {
    const key = String(raw || '').trim();
    if (!PRACTITIONER_POLICY_CAPABILITY_SET.has(key)) {
      throw new WorkspaceStaffError(
        'WORKSPACE_STAFF_ACCESS_POLICY_CAPABILITY_FORBIDDEN',
        'The requested capability is not editable through practitioner Staff Access.',
        400
      );
    }
    requested.add(key);
  }
  for (const key of MANDATORY_PRACTITIONER_CAPABILITIES) requested.add(key);
  return PRACTITIONER_POLICY_CAPABILITIES.filter(key => requested.has(key));
}

function incompatibleReason(staff, rows = []) {
  if (!staff || staff.status !== 'active') {
    return 'Access policy can only be edited for an active canonical staff member.';
  }
  if (staff.resource_type !== 'practitioner' || staff.business_role !== 'employee_practitioner') {
    return 'This bounded editor is only available for employee-practitioner access.';
  }
  if (!Array.isArray(rows) || rows.length !== 1) {
    return rows.length > 1
      ? 'Canonical Workspace access is ambiguous and must be reconciled before policy changes.'
      : 'No active linked Workspace access principal is available to edit.';
  }
  const row = rows[0];
  if (row.active !== true
      || row.role !== 'practitioner'
      || row.business_role !== 'employee_practitioner'
      || row.calendar_scope !== 'own_appointments'
      || row.service_scope !== 'own_services'
      || positiveId(row.staff_id) !== positiveId(staff.id)) {
    return 'Existing access has a different role or scope and remains read-only in this bounded editor.';
  }
  const unsupported = enabledCapabilities(row.permissions)
    .filter(key => !PRACTITIONER_POLICY_CAPABILITY_SET.has(key));
  if (unsupported.length) {
    return 'Existing access contains protected or broader authority and remains read-only until separately reconciled.';
  }
  if (permissionSet(row.permissions)['appointment:view'] !== true) {
    return 'Complete view-only Workspace access before editing practitioner capabilities.';
  }
  return null;
}

function policyProjection(staff, rows = []) {
  const row = Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
  const retrospective=retrospectivePolicy(staff,rows);
  if (retrospective) return {
    key:'workspace_retrospective_access_v1',
    supported:retrospective.supported,
    reason:retrospective.reason||null,
    staffId:positiveId(staff?.id),
    role:row?.role||null,
    businessRole:row?.business_role||null,
    calendarScope:row?.calendar_scope||null,
    serviceScope:row?.service_scope||null,
    capabilities:CALENDAR_OPERATIONAL_ACCESS_CAPABILITIES.filter(key=>row?.permissions?.[key]===true),
    definitions:[
      {key:RECORD_PAST,label:'Record past appointments',description:'Record fully ended appointments silently within existing booking scopes.',mandatory:false},
      {key:ADJUST_END,label:'Adjust appointment end time',description:'Correct an appointment’s effective end time within existing Calendar and service scopes.',mandatory:false},
    ],
    retrospectiveClientIds:retrospective.ids,
    revision:row?accessPolicyRevision(row):null,
  };
  const reason = incompatibleReason(staff, rows);
  const current = row
    ? PRACTITIONER_POLICY_CAPABILITIES.filter(key => permissionSet(row.permissions)[key] === true)
    : [];
  return {
    key: STAFF_ACCESS_POLICY_VERSION,
    supported: reason == null,
    reason,
    staffId: positiveId(staff?.id),
    role: row?.role || null,
    businessRole: row?.business_role || null,
    calendarScope: row?.calendar_scope || null,
    serviceScope: row?.service_scope || null,
    capabilities: current,
    definitions: PRACTITIONER_POLICY_DEFINITIONS.map(item => ({
      key: item.key,
      label: item.label,
      description: item.description,
      mandatory: item.mandatory === true,
    })),
    revision: row ? accessPolicyRevision(row) : null,
  };
}

function createWorkspaceStaffAccessPolicyService({
  db = pool,
  accessService = workspaceStaffAccess,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Workspace Staff Access policy database is required');
  if (!accessService || typeof accessService.requireManageAccess !== 'function') {
    throw new Error('Workspace Staff Access policy requires canonical access-management authority');
  }

  async function targetStaff(staffId, queryable = db, { lock = false } = {}) {
    const result = await queryable.query(
      `/* workspaceStaffAccessPolicy:target */
       SELECT id, display_name, resource_type, status, business_role
         FROM staff
        WHERE id=$1
        ${lock ? 'FOR UPDATE' : ''}`,
      [staffId]
    );
    return result.rows[0] || null;
  }

  async function linkedAccess(staffId, queryable = db, { lock = false } = {}) {
    const result = await queryable.query(
      `/* workspaceStaffAccessPolicy:linked */
       SELECT id, staff_id, role, active, permissions, business_role, calendar_scope, service_scope
         FROM staff_admin_accounts
        WHERE staff_id=$1
          AND active=TRUE
        ORDER BY id
        LIMIT 3
        ${lock ? 'FOR UPDATE' : ''}`,
      [staffId]
    );
    return result.rows;
  }

  async function getPolicy(adminId, staffId) {
    const id = positiveId(staffId);
    if (!id) throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_ID', 'Staff reference is invalid.', 400);
    await accessService.requireManageAccess(adminId, db);
    const staff = await targetStaff(id, db);
    if (!staff) throw new WorkspaceStaffError('WORKSPACE_STAFF_NOT_FOUND', 'Staff member was not found.', 404);
    return policyProjection(staff, await linkedAccess(id, db));
  }

  async function updatePolicy({
    adminId,
    staffId,
    expectedAccessRevision,
    capabilities,
    retrospectiveClientIds,
    requestId: rawRequestId,
  } = {}) {
    if (typeof db.connect !== 'function') throw new Error('Workspace Staff Access policy mutations require a transactional database.');
    const id = positiveId(staffId);
    if (!id) throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_ID', 'Staff reference is invalid.', 400);
    const requestId = requireRequestId(rawRequestId);
    const expected = requireExpectedRevision(expectedAccessRevision);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const operator = await accessService.requireManageAccess(adminId, client);
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [STAFF_ACCESS_LOCK_BASE + id]);
      const staff = await targetStaff(id, client, { lock: true });
      if (!staff) throw new WorkspaceStaffError('WORKSPACE_STAFF_NOT_FOUND', 'Staff member was not found.', 404);
      const rows = await linkedAccess(id, client, { lock: true });
      if (rows.length !== 1) {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_POLICY_AMBIGUOUS',
          incompatibleReason(staff, rows),
          409
        );
      }
      const row = rows[0];
      if (accessPolicyRevision(row) !== expected) {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_POLICY_STALE',
          'Staff access changed since this view was loaded. Reload before saving.',
          409
        );
      }
      const projected=policyProjection(staff,rows);
      const reason = projected.reason;
      if (reason) {
        throw new WorkspaceStaffError('WORKSPACE_STAFF_ACCESS_POLICY_UNSUPPORTED', reason, 409);
      }

      let managed=PRACTITIONER_POLICY_CAPABILITIES, normalized;
      let condition=undefined;
      if(projected.key==='workspace_retrospective_access_v1'){
        managed=[...CALENDAR_OPERATIONAL_ACCESS_CAPABILITIES];
        if(!Array.isArray(capabilities)||capabilities.some(key=>!CALENDAR_OPERATIONAL_ACCESS_CAPABILITY_SET.has(key)))throw new WorkspaceStaffError('WORKSPACE_STAFF_ACCESS_POLICY_CAPABILITY_FORBIDDEN','Only bounded Calendar operational capabilities are editable here.',400);
        normalized=managed.filter(key=>capabilities.includes(key));
        if(retrospectiveClientIds===null)condition=null;
        else if(retrospectiveClientIds!==undefined){if(!Array.isArray(retrospectiveClientIds)||retrospectiveClientIds.some(id=>!positiveId(id)))throw new WorkspaceStaffError('WORKSPACE_STAFF_ACCESS_POLICY_INVALID','Canonical client IDs must be positive integers.',400);condition=[...new Set(retrospectiveClientIds.map(Number))].sort((a,b)=>a-b);}
      } else normalized=normalizeRequestedCapabilities(capabilities);
      const before = managed
        .filter(key => permissionSet(row.permissions)[key] === true);
      const sameCondition=condition===undefined||(condition===null?projected.retrospectiveClientIds===null:JSON.stringify(condition)===JSON.stringify(projected.retrospectiveClientIds));
      if (before.length === normalized.length && before.every((key, index) => key === normalized[index]) && sameCondition) {
        await client.query('COMMIT');
        return { status: 'unchanged', staffId: id, policy: policyProjection(staff, rows) };
      }

      const patch = Object.fromEntries(
        managed.map(key => [key, normalized.includes(key)])
      );
      if(projected.key==='workspace_retrospective_access_v1'&&Array.isArray(condition))patch[RETROSPECTIVE_CLIENT_IDS_KEY]=condition;
      await client.query(
        `UPDATE staff_admin_accounts
            SET permissions=(COALESCE(permissions,'{}'::jsonb) || $2::jsonb) ${condition===null?`- '${RETROSPECTIVE_CLIENT_IDS_KEY}'`:''},
                updated_at=NOW()
          WHERE id=$1`,
        [row.id, JSON.stringify(patch)]
      );
      const updatedRow = {
        ...row,
        permissions: { ...permissionSet(row.permissions), ...patch },
      };
      if(condition===null)delete updatedRow.permissions[RETROSPECTIVE_CLIENT_IDS_KEY];
      await client.query(
        `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES($1,'workspace.staff_access_policy_updated','staff',$2,$3::jsonb)`,
        [operator.operatorAdminId, id, JSON.stringify({
          requestId,
          accessPrincipalId: positiveId(row.id),
          policyVersion: STAFF_ACCESS_POLICY_VERSION,
          beforeCapabilities: before,
          afterCapabilities: normalized,
          ...(projected.key==='workspace_retrospective_access_v1'?{retrospectiveClientIds:condition===undefined?projected.retrospectiveClientIds:condition}:{}),
          businessRole: row.business_role,
          calendarScope: row.calendar_scope,
          serviceScope: row.service_scope,
          whatsappIdentityChanged: false,
          credentialMaterialChanged: false,
        })]
      );
      await client.query('COMMIT');
      return {
        status: 'updated',
        staffId: id,
        policy: policyProjection(staff, [updatedRow]),
      };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  return { getPolicy, updatePolicy };
}

const service = createWorkspaceStaffAccessPolicyService();

module.exports = {
  STAFF_ACCESS_POLICY_VERSION,
  STAFF_ACCESS_LOCK_BASE,
  PRACTITIONER_POLICY_CAPABILITIES,
  MANDATORY_PRACTITIONER_CAPABILITIES,
  PRACTITIONER_POLICY_DEFINITIONS,
  CALENDAR_OPERATIONAL_ACCESS_CAPABILITIES,
  enabledCapabilities,
  accessPolicyRevision,
  normalizeRequestedCapabilities,
  normalizedRetrospectiveClientIds,
  retrospectivePolicy,
  incompatibleReason,
  policyProjection,
  createWorkspaceStaffAccessPolicyService,
  ...service,
};
