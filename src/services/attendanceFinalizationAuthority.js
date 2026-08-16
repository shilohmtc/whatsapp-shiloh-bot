const { pool } = require('../db/pool');

function normalizedName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function certificationStaffIds(admin, db = pool) {
  const name = normalizedName(admin?.display_name);
  if (!admin) return [];

  // Christel is the sole attendance-finalization authority for both
  // Christel and Abigail appointments.
  if (name === 'christel') {
    const result = await db.query(
      `SELECT id
         FROM staff
        WHERE status='active'
          AND lower(trim(display_name)) IN ('christel','abigail')
        ORDER BY id`
    );
    return result.rows.map((row) => Number(row.id));
  }

  // Marietjie is the sole attendance-finalization authority for her own
  // appointments. Abigail deliberately has no certification authority.
  if (name === 'marietjie') {
    return admin.staff_id ? [Number(admin.staff_id)] : [];
  }

  return [];
}

async function canCertifyAppointment(admin, appointmentId, db = pool) {
  const allowed = await certificationStaffIds(admin, db);
  if (!allowed.length) return false;

  const assigned = await db.query(
    `SELECT DISTINCT staff_id
       FROM appointment_staff
      WHERE appointment_id=$1
        AND staff_id IS NOT NULL
      ORDER BY staff_id`,
    [appointmentId]
  );
  const staffIds = assigned.rows.map((row) => Number(row.staff_id));
  if (!staffIds.length) return false;
  return staffIds.every((staffId) => allowed.includes(staffId));
}

function authorityDescription(admin) {
  const name = normalizedName(admin?.display_name);
  if (name === 'christel') return 'Christel and Abigail appointments';
  if (name === 'marietjie') return 'Marietjie appointments';
  return 'review only';
}

module.exports = {
  normalizedName,
  certificationStaffIds,
  canCertifyAppointment,
  authorityDescription,
};
