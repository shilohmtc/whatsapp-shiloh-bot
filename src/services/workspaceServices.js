const { pool } = require('../db/pool');

const SERVICES_VIEW_CAPABILITY = 'services:view';
const SERVICES_LIST_PAGE_SIZE = 30;

class WorkspaceServicesError extends Error {
  constructor(code, message, httpStatus) {
    super(message);
    this.name = 'WorkspaceServicesError';
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

function evaluateServicesReadAuthority(rows = []) {
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const principal = rows[0];
  const adminId = positiveId(principal.id);
  if (!adminId || principal.admin_active !== true) return null;
  if (principal.staff_id != null && principal.staff_status !== 'active') return null;
  if (permissionSet(principal.permissions)[SERVICES_VIEW_CAPABILITY] !== true) return null;
  return {
    key: 'workspace_services_view_v1',
    operatorAdminId: adminId,
    displayName: String(principal.display_name || 'Staff').trim() || 'Staff',
    capability: SERVICES_VIEW_CAPABILITY,
  };
}

function normalizeSearch(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function normalizeStatus(value) {
  const status = String(value || 'active').trim().toLowerCase();
  if (status === 'all') return null;
  if (status === 'active' || status === 'inactive') return status;
  throw new WorkspaceServicesError('WORKSPACE_SERVICES_INVALID_STATUS', 'Service status filter is invalid.', 400);
}

function normalizeOffset(value) {
  const offset = Number.parseInt(value, 10);
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(offset, 100000);
}

function totalServiceMinutes(service) {
  return Number(service?.duration_minutes || 0)
    + Number(service?.processing_time_minutes || 0)
    + Number(service?.extra_time_minutes || 0);
}

function projectBookingEligibility(service, assignedStaff = null) {
  const count = Array.isArray(assignedStaff)
    ? assignedStaff.filter(item => item.status === 'active' && item.client_bookable === true).length
    : Number(service?.client_bookable_staff_count || 0);
  return {
    serviceActive: service?.status === 'active',
    clientBookableStaffCount: count,
    eligible: service?.status === 'active' && count > 0,
    authority: 'read_projection_only',
  };
}

function createWorkspaceServicesService({ db = pool } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Workspace Services database is required');

  async function resolveAccess(adminId) {
    const id = positiveId(adminId);
    if (!id) return null;
    const result = await db.query(
      `/* workspaceServices:principal */
       SELECT a.id, a.staff_id, a.display_name, a.permissions,
              a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id=a.staff_id
        WHERE a.id=$1
          AND a.active=TRUE
        LIMIT 2`,
      [id]
    );
    return evaluateServicesReadAuthority(result.rows);
  }

  async function requireAccess(adminId) {
    const authority = await resolveAccess(adminId);
    if (!authority) {
      throw new WorkspaceServicesError(
        'WORKSPACE_SERVICES_FORBIDDEN',
        'Current staff authority does not permit Services access.',
        403
      );
    }
    return authority;
  }

  async function listServices({ adminId, q, status, offset } = {}) {
    const authority = await requireAccess(adminId);
    const search = normalizeSearch(q);
    const serviceStatus = normalizeStatus(status);
    const safeOffset = normalizeOffset(offset);
    const values = [];
    const where = [];
    if (serviceStatus) {
      values.push(serviceStatus);
      where.push(`svc.status=$${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      where.push(`svc.name ILIKE $${values.length}`);
    }
    values.push(SERVICES_LIST_PAGE_SIZE + 1);
    const limitParam = `$${values.length}`;
    values.push(safeOffset);
    const offsetParam = `$${values.length}`;
    const result = await db.query(
      `/* workspaceServices:list */
       SELECT svc.id, svc.name, svc.duration_minutes,
              svc.processing_time_minutes, svc.extra_time_minutes,
              svc.variable_price, svc.price, svc.display_price, svc.status,
              sc.name AS category_name,
              (SELECT COUNT(*)::int
                 FROM staff_services ss
                 JOIN staff st ON st.id=ss.staff_id
                WHERE ss.service_id=svc.id) AS assigned_staff_count,
              (SELECT COUNT(*)::int
                 FROM staff_services ss
                 JOIN staff st ON st.id=ss.staff_id
                WHERE ss.service_id=svc.id
                  AND st.status='active'
                  AND st.client_bookable=TRUE) AS client_bookable_staff_count
         FROM services svc
         LEFT JOIN service_categories sc ON sc.id=svc.category_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY CASE WHEN svc.status='active' THEN 0 ELSE 1 END,
                 sc.display_order NULLS LAST,
                 svc.display_order,
                 LOWER(svc.name), svc.id
        LIMIT ${limitParam} OFFSET ${offsetParam}`,
      values
    );
    const rows = result.rows.slice(0, SERVICES_LIST_PAGE_SIZE).map(service => ({
      ...service,
      total_minutes: totalServiceMinutes(service),
      booking_eligibility: projectBookingEligibility(service),
    }));
    return {
      authority,
      services: rows,
      hasMore: result.rows.length > SERVICES_LIST_PAGE_SIZE,
      offset: safeOffset,
      pageSize: SERVICES_LIST_PAGE_SIZE,
      query: search,
      status: serviceStatus,
    };
  }

  async function getServiceDetail({ adminId, serviceId } = {}) {
    const authority = await requireAccess(adminId);
    const id = positiveId(serviceId);
    if (!id) throw new WorkspaceServicesError('WORKSPACE_SERVICES_INVALID_ID', 'Service reference is invalid.', 400);

    const serviceResult = await db.query(
      `/* workspaceServices:detail */
       SELECT svc.id, svc.name, svc.duration_minutes,
              svc.processing_time_minutes, svc.extra_time_minutes,
              svc.variable_price, svc.price, svc.display_price, svc.status,
              svc.customer_description, svc.booking_note,
              sc.name AS category_name
         FROM services svc
         LEFT JOIN service_categories sc ON sc.id=svc.category_id
        WHERE svc.id=$1
        LIMIT 1`,
      [id]
    );
    const service = serviceResult.rows[0];
    if (!service) throw new WorkspaceServicesError('WORKSPACE_SERVICE_NOT_FOUND', 'Service was not found.', 404);

    const staffResult = await db.query(
      `/* workspaceServices:staff */
       SELECT st.display_name, st.resource_type, st.status, st.client_bookable
         FROM staff_services ss
         JOIN staff st ON st.id=ss.staff_id
        WHERE ss.service_id=$1
        ORDER BY CASE WHEN st.status='active' THEN 0 ELSE 1 END,
                 CASE WHEN st.client_bookable=TRUE THEN 0 ELSE 1 END,
                 LOWER(st.display_name), st.id`,
      [id]
    );

    return {
      authority,
      service: {
        ...service,
        total_minutes: totalServiceMinutes(service),
      },
      assignedStaff: staffResult.rows,
      bookingEligibility: projectBookingEligibility(service, staffResult.rows),
    };
  }

  return { resolveAccess, requireAccess, listServices, getServiceDetail };
}

const service = createWorkspaceServicesService();

module.exports = {
  SERVICES_VIEW_CAPABILITY,
  SERVICES_LIST_PAGE_SIZE,
  WorkspaceServicesError,
  positiveId,
  permissionSet,
  evaluateServicesReadAuthority,
  normalizeSearch,
  normalizeStatus,
  normalizeOffset,
  totalServiceMinutes,
  projectBookingEligibility,
  createWorkspaceServicesService,
  ...service,
};
