const { pool } = require('../db/pool');

const STAFF_VIEW_CAPABILITY = 'staff:view';
const STAFF_LIST_PAGE_SIZE = 30;

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

function evaluateStaffReadAuthority(rows = []) {
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const principal = rows[0];
  const adminId = positiveId(principal.id);
  if (!adminId || principal.admin_active !== true) return null;
  if (principal.staff_id != null && principal.staff_status !== 'active') return null;
  if (permissionSet(principal.permissions)[STAFF_VIEW_CAPABILITY] !== true) return null;
  return {
    key: 'workspace_staff_view_v1',
    operatorAdminId: adminId,
    displayName: String(principal.display_name || 'Staff').trim() || 'Staff',
    capability: STAFF_VIEW_CAPABILITY,
  };
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

function normalizeOffset(value) {
  const offset = Number.parseInt(value, 10);
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(offset, 100000);
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

  async function resolveAccess(adminId) {
    const id = positiveId(adminId);
    if (!id) return null;
    const result = await db.query(
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
    return evaluateStaffReadAuthority(result.rows);
  }

  async function requireAccess(adminId) {
    const authority = await resolveAccess(adminId);
    if (!authority) {
      throw new WorkspaceStaffError(
        'WORKSPACE_STAFF_FORBIDDEN',
        'Current staff authority does not permit Staff access.',
        403
      );
    }
    return authority;
  }

  async function listStaff({ adminId, q, status, offset } = {}) {
    const authority = await requireAccess(adminId);
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
    const id = positiveId(staffId);
    if (!id) throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_ID', 'Staff reference is invalid.', 400);

    const staffResult = await db.query(
      `/* workspaceStaff:detail */
       SELECT id, display_name, resource_type, status, scheduling_type, client_bookable
         FROM staff
        WHERE id=$1
        LIMIT 1`,
      [id]
    );
    const staff = staffResult.rows[0];
    if (!staff) throw new WorkspaceStaffError('WORKSPACE_STAFF_NOT_FOUND', 'Staff member was not found.', 404);

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
      staff,
      services: servicesResult.rows,
      access: accessProjection(accessResult.rows[0] || null),
    };
  }

  return { resolveAccess, requireAccess, listStaff, getStaffDetail };
}

const service = createWorkspaceStaffService();

module.exports = {
  STAFF_VIEW_CAPABILITY,
  STAFF_LIST_PAGE_SIZE,
  WorkspaceStaffError,
  positiveId,
  permissionSet,
  evaluateStaffReadAuthority,
  normalizeSearch,
  normalizeStatus,
  normalizeOffset,
  accessProjection,
  createWorkspaceStaffService,
  ...service,
};
