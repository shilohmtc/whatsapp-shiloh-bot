const { pool } = require('../db/pool');

const CALENDAR_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_ADMIN: 'operations_admin',
  READ_ONLY: 'read_only',
});

const MUTATION_CAPABILITIES = new Set([
  'calendar:create',
  'calendar:edit',
  'calendar:reschedule',
  'calendar:cancel',
  'calendar:sync_retry',
]);

function accessError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  return Object.values(CALENDAR_ROLES).includes(role) ? role : CALENDAR_ROLES.READ_ONLY;
}

function deriveCalendarCapabilities(admin = {}) {
  const role = normalizeRole(admin.calendar_role);
  const active = admin.admin_active === true && (!admin.staff_id || admin.staff_status === 'active');
  const permissions = admin.permissions && typeof admin.permissions === 'object' && !Array.isArray(admin.permissions)
    ? admin.permissions
    : {};
  if (!active) return Object.freeze({ role, read: false, create: false, edit: false, reschedule: false, cancel: false, syncRetry: false });
  const canMutateByRole = role === CALENDAR_ROLES.SUPER_ADMIN || role === CALENDAR_ROLES.OPERATIONS_ADMIN;
  return Object.freeze({
    role,
    read: permissions['calendar:read'] === true,
    create: canMutateByRole && permissions['calendar:create'] === true,
    edit: canMutateByRole && permissions['calendar:edit'] === true,
    reschedule: canMutateByRole && permissions['calendar:reschedule'] === true,
    cancel: canMutateByRole && permissions['calendar:cancel'] === true,
    syncRetry: canMutateByRole && permissions['calendar:sync_retry'] === true,
  });
}

function capabilityAllowed(capabilities, capability) {
  const map = {
    'calendar:read': 'read',
    'calendar:create': 'create',
    'calendar:edit': 'edit',
    'calendar:reschedule': 'reschedule',
    'calendar:cancel': 'cancel',
    'calendar:sync_retry': 'syncRetry',
  };
  const key = map[capability];
  return Boolean(key && capabilities?.[key]);
}

async function resolveCalendarOperator(adminId, capability = 'calendar:read', { db = pool } = {}) {
  const id = Number(adminId);
  if (!Number.isSafeInteger(id) || id <= 0) throw accessError('CALENDAR_ACCESS_FORBIDDEN', 'Authenticated Calendar operator is required.');
  const result = await db.query(
    `SELECT a.id, a.staff_id, a.display_name, a.role, a.business_role, a.calendar_role,
            a.calendar_scope, a.service_scope, a.permissions, a.active AS admin_active,
            s.status AS staff_status
       FROM staff_admin_accounts a
       LEFT JOIN staff s ON s.id = a.staff_id
      WHERE a.id = $1
      LIMIT 1`,
    [id]
  );
  const admin = result.rows[0] || null;
  const capabilities = deriveCalendarCapabilities(admin || {});
  if (!admin || !capabilityAllowed(capabilities, capability)) {
    throw accessError('CALENDAR_ACCESS_FORBIDDEN', `Calendar capability ${capability} is not permitted for this authenticated operator.`);
  }
  return Object.freeze({
    adminId: Number(admin.id),
    staffId: admin.staff_id == null ? null : Number(admin.staff_id),
    displayName: admin.display_name || `Admin ${admin.id}`,
    calendarRole: capabilities.role,
    capabilities,
    source: 'shiloh_calendar',
  });
}

function requireCalendarCapability(capability, { db = pool } = {}) {
  if (capability !== 'calendar:read' && !MUTATION_CAPABILITIES.has(capability)) {
    throw new Error(`Unknown Calendar capability: ${capability}`);
  }
  return async function calendarCapabilityGuard(req, res, next) {
    try {
      req.calendarOperator = await resolveCalendarOperator(req.staffBrowserSession?.adminId, capability, { db });
      return next();
    } catch (error) {
      if (error?.code === 'CALENDAR_ACCESS_FORBIDDEN') {
        return res.status(403).json({ error: 'Calendar action is not authorized', code: error.code, requestId: req.id });
      }
      return next(error);
    }
  };
}

module.exports = {
  CALENDAR_ROLES,
  MUTATION_CAPABILITIES,
  accessError,
  normalizeRole,
  deriveCalendarCapabilities,
  capabilityAllowed,
  resolveCalendarOperator,
  requireCalendarCapability,
};
