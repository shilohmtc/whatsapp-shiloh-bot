const { createHash } = require('crypto');
const { pool } = require('../db/pool');

const STAFF_VIEW_CAPABILITY = 'staff:view';
const STAFF_MANAGE_CAPABILITY = 'staff:manage';
const STAFF_LIST_PAGE_SIZE = 30;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const REVISION_PATTERN = /^[a-f0-9]{64}$/i;

class WorkspaceStaffError extends Error {
  constructor(code, message, httpStatus) {
    super(message);
    this.name = 'WorkspaceStaffError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function permissionSet(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function evaluateStaffAuthority(rows = [], capability = STAFF_VIEW_CAPABILITY, key = 'workspace_staff_view_v1') {
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const principal = rows[0];
  const adminId = positiveId(principal.id);
  if (!adminId || principal.admin_active !== true) return null;
  if (principal.staff_id != null && principal.staff_status !== 'active') return null;
  if (permissionSet(principal.permissions)[capability] !== true) return null;
  return {
    key,
    operatorAdminId: adminId,
    staffId: positiveId(principal.staff_id),
    displayName: String(principal.display_name || 'Staff').trim() || 'Staff',
    capability,
  };
}

function evaluateStaffReadAuthority(rows = []) {
  return evaluateStaffAuthority(rows, STAFF_VIEW_CAPABILITY, 'workspace_staff_view_v1');
}

function evaluateStaffManageAuthority(rows = []) {
  return evaluateStaffAuthority(rows, STAFF_MANAGE_CAPABILITY, 'workspace_staff_manage_v1');
}

function normalizeSearch(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function normalizeStatus(value) {
  const status = String(value || 'active').trim().toLowerCase();
  if (status === 'all') return null;
  if (status === 'active' || status === 'inactive') return status;
  throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_STATUS', 'Staff status filter is invalid.', 400);
}

function normalizeWritableStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'active' || status === 'inactive') return status;
  throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_STATUS', 'Staff status is invalid.', 400);
}

function normalizeOffset(value) {
  const offset = Number.parseInt(value, 10);
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(offset, 100000);
}

function normalizeDisplayName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 120) {
    throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_NAME', 'Staff display name is required and must be 120 characters or fewer.', 400);
  }
  return name;
}

function normalizeResourceType(value) {
  const resourceType = String(value || '').trim().toLowerCase();
  if (resourceType === 'practitioner' || resourceType === 'business_resource') return resourceType;
  throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_RESOURCE_TYPE', 'Staff resource type is invalid.', 400);
}

function normalizeBoolean(value, label = 'Value') {
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0 || value == null || value === '') return false;
  throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_BOOLEAN', `${label} must be true or false.`, 400);
}

function normalizeSchedulingType(value, resourceType) {
  const raw = String(value || '').trim().toLowerCase();
  if (resourceType === 'business_resource') {
    if (!raw || raw === 'system') return 'system';
    throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_SCHEDULING', 'Business resources must use system scheduling.', 400);
  }
  const schedulingType = raw || 'regular';
  if (schedulingType === 'regular' || schedulingType === 'freelance') return schedulingType;
  throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_SCHEDULING', 'Practitioner scheduling must be regular or freelance.', 400);
}

function requireRequestId(value) {
  const requestId = String(value || '').trim();
  if (!REQUEST_ID_PATTERN.test(requestId)) {
    throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_REQUEST', 'A valid operation request identifier is required.', 400);
  }
  return requestId;
}

function requireExpectedRevision(value) {
  const revision = String(value || '').trim();
  if (!REVISION_PATTERN.test(revision)) {
    throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_REVISION', 'A valid current Staff revision is required.', 400);
  }
  return revision.toLowerCase();
}

function staffRevision(row) {
  if (!row) return null;
  const canonical = {
    id: positiveId(row.id),
    displayName: String(row.display_name || ''),
    resourceType: String(row.resource_type || ''),
    status: String(row.status || ''),
    schedulingType: String(row.scheduling_type || ''),
    clientBookable: row.client_bookable === true,
    businessRole: String(row.business_role || ''),
    calendarScope: String(row.calendar_scope || ''),
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function staffAuditProjection(row) {
  return {
    displayName: String(row.display_name || ''),
    resourceType: String(row.resource_type || ''),
    status: String(row.status || ''),
    schedulingType: String(row.scheduling_type || ''),
    clientBookable: row.client_bookable === true,
    businessRole: String(row.business_role || ''),
    calendarScope: String(row.calendar_scope || ''),
  };
}

function accessProjection(row) {
  if (!row) return null;
  const permissions = permissionSet(row.permissions);
  return {
    businessRole: row.business_role || null,
    calendarScope: row.calendar_scope || null,
    serviceScope: row.service_scope || null,
    capabilities: Object.keys(permissions).filter(key => permissions[key] === true).sort(),
  };
}

function createWorkspaceStaffService({ db = pool } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Workspace Staff database is required');

  async function principalRows(adminId, queryable = db) {
    const id = positiveId(adminId);
    if (!id) return [];
    const result = await queryable.query(
      `/* workspaceStaff:principal */
       SELECT a.id, a.staff_id, a.display_name, a.permissions,
              a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id=a.staff_id
        WHERE a.id=$1
          AND a.active=TRUE
        LIMIT 2`,
      [id]
    );
    return result.rows;
  }

  async function resolveAccess(adminId, queryable = db) {
    return evaluateStaffReadAuthority(await principalRows(adminId, queryable));
  }

  async function resolveManageAccess(adminId, queryable = db) {
    return evaluateStaffManageAuthority(await principalRows(adminId, queryable));
  }

  async function requireAccess(adminId, queryable = db) {
    const authority = await resolveAccess(adminId, queryable);
    if (!authority) {
      throw new WorkspaceStaffError(
        'WORKSPACE_STAFF_FORBIDDEN',
        'Current staff authority does not permit Staff access.',
        403
      );
    }
    return authority;
  }

  async function requireManageAccess(adminId, queryable = db) {
    const authority = await resolveManageAccess(adminId, queryable);
    if (!authority) {
      throw new WorkspaceStaffError(
        'WORKSPACE_STAFF_MANAGE_FORBIDDEN',
        'Current staff authority does not permit Staff changes.',
        403
      );
    }
    return authority;
  }

  async function listStaff({ adminId, q, status, offset } = {}) {
    const authority = await requireAccess(adminId);
    const manageAllowed = Boolean(await resolveManageAccess(adminId));
    const search = normalizeSearch(q);
    const staffStatus = normalizeStatus(status);
    const safeOffset = normalizeOffset(offset);
    const values = [];
    const where = [];
    if (staffStatus) {
      values.push(staffStatus);
      where.push(`s.status=$${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      where.push(`s.display_name ILIKE $${values.length}`);
    }
    values.push(STAFF_LIST_PAGE_SIZE + 1);
    const limitParam = `$${values.length}`;
    values.push(safeOffset);
    const offsetParam = `$${values.length}`;
    const result = await db.query(
      `/* workspaceStaff:list */
       SELECT s.id, s.display_name, s.resource_type, s.status,
              s.scheduling_type, s.client_bookable,
              (SELECT COUNT(*)::int
                 FROM staff_services ss
                 JOIN services svc ON svc.id=ss.service_id AND svc.status='active'
                WHERE ss.staff_id=s.id) AS service_count,
              (SELECT COUNT(*)::int
                 FROM staff_admin_accounts a
                WHERE a.staff_id=s.id AND a.active=TRUE) AS active_admin_count,
              (SELECT a.business_role
                 FROM staff_admin_accounts a
                WHERE a.staff_id=s.id AND a.active=TRUE
                ORDER BY a.id
                LIMIT 1) AS business_role
         FROM staff s
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY CASE WHEN s.status='active' THEN 0 ELSE 1 END, LOWER(s.display_name), s.id
        LIMIT ${limitParam} OFFSET ${offsetParam}`,
      values
    );
    return {
      authority,
      manageAllowed,
      staff: result.rows.slice(0, STAFF_LIST_PAGE_SIZE),
      hasMore: result.rows.length > STAFF_LIST_PAGE_SIZE,
      offset: safeOffset,
      pageSize: STAFF_LIST_PAGE_SIZE,
      query: search,
      status: staffStatus,
    };
  }

  async function getStaffDetail({ adminId, staffId } = {}) {
    const authority = await requireAccess(adminId);
    const manageAllowed = Boolean(await resolveManageAccess(adminId));
    const id = positiveId(staffId);
    if (!id) throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_ID', 'Staff reference is invalid.', 400);

    const staffResult = await db.query(
      `/* workspaceStaff:detail */
       SELECT id, display_name, resource_type, status, scheduling_type, client_bookable,
              business_role, calendar_scope
         FROM staff
        WHERE id=$1
        LIMIT 1`,
      [id]
    );
    const staff = staffResult.rows[0];
    if (!staff) throw new WorkspaceStaffError('WORKSPACE_STAFF_NOT_FOUND', 'Staff member was not found.', 404);
    staff.revision = staffRevision(staff);

    const servicesResult = await db.query(
      `/* workspaceStaff:services */
       SELECT svc.name, svc.duration_minutes, svc.status
         FROM staff_services ss
         JOIN services svc ON svc.id=ss.service_id
        WHERE ss.staff_id=$1
        ORDER BY CASE WHEN svc.status='active' THEN 0 ELSE 1 END, LOWER(svc.name), svc.id`,
      [id]
    );

    const accessResult = await db.query(
      `/* workspaceStaff:linked_access */
       SELECT a.business_role, a.calendar_scope, a.service_scope, a.permissions
         FROM staff_admin_accounts a
        WHERE a.staff_id=$1
          AND a.active=TRUE
        ORDER BY a.id
        LIMIT 2`,
      [id]
    );
    if (accessResult.rows.length > 1) {
      throw new WorkspaceStaffError(
        'WORKSPACE_STAFF_ACCESS_AMBIGUOUS',
        'Canonical staff access is ambiguous.',
        409
      );
    }

    return {
      authority,
      manageAllowed,
      staff,
      services: servicesResult.rows,
      access: accessProjection(accessResult.rows[0] || null),
    };
  }

  async function lockStaff(client, staffId) {
    const id = positiveId(staffId);
    if (!id) throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_ID', 'Staff reference is invalid.', 400);
    await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [624000000000 + id]);
    const result = await client.query(
      `/* workspaceStaff:mutation-staff */
       SELECT s.id, s.display_name, s.resource_type, s.status, s.scheduling_type,
              s.client_bookable, s.business_role, s.calendar_scope,
              (SELECT COUNT(*)::int FROM staff_admin_accounts a WHERE a.staff_id=s.id AND a.active=TRUE) AS active_admin_count
         FROM staff s
        WHERE s.id=$1
        FOR UPDATE`,
      [id]
    );
    const staff = result.rows[0];
    if (!staff) throw new WorkspaceStaffError('WORKSPACE_STAFF_NOT_FOUND', 'Staff member was not found.', 404);
    if (Number(staff.active_admin_count || 0) > 1) {
      throw new WorkspaceStaffError('WORKSPACE_STAFF_ACCESS_AMBIGUOUS', 'Canonical staff access is ambiguous.', 409);
    }
    return staff;
  }

  function requireCurrentRevision(staff, expectedRevision) {
    const expected = requireExpectedRevision(expectedRevision);
    const current = staffRevision(staff);
    if (expected !== current) {
      throw new WorkspaceStaffError('WORKSPACE_STAFF_STALE_REVISION', 'Staff changed since this view was loaded.', 409);
    }
    return current;
  }

  async function requireUniqueDisplayName(client, displayName, excludeId = null) {
    const result = await client.query(
      `/* workspaceStaff:unique-name */
       SELECT id
         FROM staff
        WHERE LOWER(TRIM(display_name))=LOWER(TRIM($1))
          AND ($2::bigint IS NULL OR id<>$2::bigint)
        LIMIT 1`,
      [displayName, positiveId(excludeId)]
    );
    if (result.rows.length) {
      throw new WorkspaceStaffError('WORKSPACE_STAFF_NAME_CONFLICT', 'A canonical staff profile with that display name already exists.', 409);
    }
  }

  async function audit(client, operator, action, staffId, metadata) {
    await client.query(
      `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES($1,$2,'staff',$3,$4::jsonb)`,
      [operator.operatorAdminId, action, staffId, JSON.stringify(metadata)]
    );
  }

  async function createStaff({ adminId, requestId: rawRequestId, displayName, resourceType, schedulingType, clientBookable } = {}) {
    if (typeof db.connect !== 'function') throw new Error('Workspace Staff mutations require a transactional database.');
    const requestId = requireRequestId(rawRequestId);
    const normalizedResourceType = normalizeResourceType(resourceType);
    const name = normalizeDisplayName(displayName);
    const scheduling = normalizeSchedulingType(schedulingType, normalizedResourceType);
    const requestedBookable = normalizeBoolean(clientBookable, 'Client-bookable');
    if (normalizedResourceType === 'business_resource' && requestedBookable) {
      throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_BOOKING_POLICY', 'Business resources cannot be client-bookable.', 400);
    }
    const bookable = normalizedResourceType === 'practitioner' ? requestedBookable : false;
    const businessRole = normalizedResourceType === 'practitioner' ? 'employee_practitioner' : 'business_resource';
    const calendarScope = normalizedResourceType === 'practitioner' ? 'own_appointments' : 'none';
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const operator = await requireManageAccess(adminId, client);
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [624000000000]);
      await requireUniqueDisplayName(client, name, null);
      const inserted = await client.query(
        `INSERT INTO staff(display_name,resource_type,status,scheduling_type,client_bookable,business_role,calendar_scope,source_name)
         VALUES($1,$2,'active',$3,$4,$5,$6,NULL)
         RETURNING id,display_name,resource_type,status,scheduling_type,client_bookable,business_role,calendar_scope`,
        [name, normalizedResourceType, scheduling, bookable, businessRole, calendarScope]
      );
      const staff = inserted.rows[0];
      await audit(client, operator, 'workspace.staff_created', staff.id, {
        requestId,
        after: staffAuditProjection(staff),
        adminAccountCreated: false,
        credentialMaterialCreated: false,
        serviceAssignmentsCreated: false,
      });
      await client.query('COMMIT');
      return { status: 'created', staffId: positiveId(staff.id), revision: staffRevision(staff) };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  async function inExistingStaffMutation({ adminId, staffId, requestId: rawRequestId, expectedRevision, action, execute }) {
    if (typeof db.connect !== 'function') throw new Error('Workspace Staff mutations require a transactional database.');
    const id = positiveId(staffId);
    if (!id) throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_ID', 'Staff reference is invalid.', 400);
    const requestId = requireRequestId(rawRequestId);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const operator = await requireManageAccess(adminId, client);
      const current = await lockStaff(client, id);
      requireCurrentRevision(current, expectedRevision);
      const result = await execute(client, operator, current);
      if (result.auditMetadata) {
        await audit(client, operator, action, id, { requestId, ...result.auditMetadata });
      }
      await client.query('COMMIT');
      return { status: result.status || 'updated', staffId: id, revision: result.revision || staffRevision(current) };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  async function updateStaff({ adminId, staffId, expectedRevision, requestId, displayName, schedulingType, clientBookable } = {}) {
    const name = normalizeDisplayName(displayName);
    return inExistingStaffMutation({
      adminId,
      staffId,
      expectedRevision,
      requestId,
      action: 'workspace.staff_updated',
      execute: async (client, _operator, current) => {
        const scheduling = normalizeSchedulingType(schedulingType, current.resource_type);
        const requestedBookable = normalizeBoolean(clientBookable, 'Client-bookable');
        if (current.resource_type === 'business_resource' && requestedBookable) {
          throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_BOOKING_POLICY', 'Business resources cannot be client-bookable.', 400);
        }
        const bookable = current.resource_type === 'practitioner' ? requestedBookable : false;
        await requireUniqueDisplayName(client, name, current.id);
        const before = staffAuditProjection(current);
        if (before.displayName === name && before.schedulingType === scheduling && before.clientBookable === bookable) {
          return { status: 'unchanged', revision: staffRevision(current), auditMetadata: null };
        }
        const updated = await client.query(
          `UPDATE staff
              SET display_name=$2, scheduling_type=$3, client_bookable=$4, updated_at=NOW()
            WHERE id=$1
            RETURNING id,display_name,resource_type,status,scheduling_type,client_bookable,business_role,calendar_scope`,
          [current.id, name, scheduling, bookable]
        );
        const after = updated.rows[0];
        return {
          status: 'updated',
          revision: staffRevision(after),
          auditMetadata: {
            before,
            after: staffAuditProjection(after),
            immutableResourceTypePreserved: true,
            accessAuthorityUntouched: true,
            serviceAssignmentsUntouched: true,
          },
        };
      },
    });
  }

  async function setStaffStatus({ adminId, staffId, expectedRevision, requestId, status } = {}) {
    const nextStatus = normalizeWritableStatus(status);
    return inExistingStaffMutation({
      adminId,
      staffId,
      expectedRevision,
      requestId,
      action: 'workspace.staff_status_changed',
      execute: async (client, operator, current) => {
        if (nextStatus === 'inactive' && operator.staffId === positiveId(current.id)) {
          throw new WorkspaceStaffError('WORKSPACE_STAFF_SELF_DEACTIVATION_BLOCKED', 'You cannot deactivate the staff profile backing your current signed-in principal.', 409);
        }
        if (current.status === nextStatus) {
          return { status: 'unchanged', revision: staffRevision(current), auditMetadata: null };
        }
        const before = staffAuditProjection(current);
        const updated = await client.query(
          `UPDATE staff
              SET status=$2, updated_at=NOW()
            WHERE id=$1
            RETURNING id,display_name,resource_type,status,scheduling_type,client_bookable,business_role,calendar_scope`,
          [current.id, nextStatus]
        );
        const after = updated.rows[0];
        return {
          status: 'updated',
          revision: staffRevision(after),
          auditMetadata: {
            before,
            after: staffAuditProjection(after),
            statusOnly: true,
            serviceMappingsPreserved: true,
            linkedAccessRecordsPreserved: true,
            appointmentHistoryPreserved: true,
            futureAppointmentsUntouched: true,
            newBookingEligibilityRequiresActiveStatus: true,
          },
        };
      },
    });
  }

  return {
    resolveAccess,
    resolveManageAccess,
    requireAccess,
    requireManageAccess,
    listStaff,
    getStaffDetail,
    createStaff,
    updateStaff,
    setStaffStatus,
  };
}

const service = createWorkspaceStaffService();

module.exports = {
  STAFF_VIEW_CAPABILITY,
  STAFF_MANAGE_CAPABILITY,
  STAFF_LIST_PAGE_SIZE,
  WorkspaceStaffError,
  positiveId,
  permissionSet,
  evaluateStaffAuthority,
  evaluateStaffReadAuthority,
  evaluateStaffManageAuthority,
  normalizeSearch,
  normalizeStatus,
  normalizeWritableStatus,
  normalizeOffset,
  normalizeDisplayName,
  normalizeResourceType,
  normalizeBoolean,
  normalizeSchedulingType,
  requireRequestId,
  requireExpectedRevision,
  staffRevision,
  staffAuditProjection,
  accessProjection,
  createWorkspaceStaffService,
  ...service,
};
