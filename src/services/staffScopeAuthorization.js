const { pool } = require('../db/pool');

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function hasAllServiceScope(admin) {
  return admin?.service_scope === 'all_services';
}

async function canAccessStaffService(admin, staffId, serviceId, db = pool) {
  if (hasAllServiceScope(admin)) return true;
  if (!admin?.staff_id) return false;
  if (Number(admin.staff_id) !== Number(staffId)) return false;

  const mapped = await db.query(
    `SELECT 1
       FROM staff_services
      WHERE staff_id = $1 AND service_id = $2
      LIMIT 1`,
    [admin.staff_id, serviceId]
  );
  return mapped.rowCount > 0;
}

async function authorizeRequestedStaffService(admin, staffName, serviceName, db = pool) {
  if (hasAllServiceScope(admin)) return { allowed: true };
  if (!admin?.staff_id) {
    return { allowed: false, reply: 'Your admin account is not linked to a staff profile, so staff-scoped booking access is unavailable.' };
  }

  const ownStaff = await db.query(
    `SELECT id, display_name
       FROM staff
      WHERE id = $1 AND status = 'active'`,
    [admin.staff_id]
  );
  const staff = ownStaff.rows[0];
  if (!staff) {
    return { allowed: false, reply: 'Your linked staff profile is not active, so staff-scoped booking access is unavailable.' };
  }

  if (clean(staffName).toLowerCase() !== clean(staff.display_name).toLowerCase()) {
    return { allowed: false, reply: `Your admin account is scoped to ${staff.display_name}. You can only view availability or create bookings for your own staff profile.` };
  }

  const service = await db.query(
    `SELECT s.id, s.name
       FROM services s
       JOIN staff_services ss ON ss.service_id = s.id
      WHERE ss.staff_id = $1
        AND s.status = 'active'
        AND LOWER(s.name) = LOWER($2)
      ORDER BY s.id
      LIMIT 1`,
    [admin.staff_id, clean(serviceName)]
  );

  if (!service.rowCount) {
    return { allowed: false, reply: `That service is not assigned to ${staff.display_name} in the canonical CRM catalogue, so it cannot be viewed or booked from this admin account.` };
  }

  return { allowed: true, staff, service: service.rows[0] };
}

module.exports = {
  hasAllServiceScope,
  canAccessStaffService,
  authorizeRequestedStaffService,
};
