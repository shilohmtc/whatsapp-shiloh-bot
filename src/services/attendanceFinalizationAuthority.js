const { pool } = require('../db/pool');

function normalizedName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const OWN_APPOINTMENT_FINALIZERS = new Set(['christel', 'abigail', 'marietjie']);

function canAccessOwnFinalization(admin) {
  const staffId = Number(admin?.staff_id);
  return OWN_APPOINTMENT_FINALIZERS.has(normalizedName(admin?.display_name))
    && Number.isInteger(staffId)
    && staffId > 0;
}

async function certificationStaffIds(admin, db = pool) {
  const name = normalizedName(admin?.display_name);
  if (!canAccessOwnFinalization(admin)) return [];

  // Finalization is own-practitioner-only. The Admin link and the active
  // canonical staff identity must agree exactly; missing or conflicting
  // identity evidence fails closed instead of falling back to name inference.
  const result = await db.query(
    `SELECT id
       FROM staff
      WHERE id=$1
        AND status='active'
        AND lower(trim(display_name))=$2
      ORDER BY id
      LIMIT 2`,
    [Number(admin.staff_id), name]
  );
  if (result.rows.length !== 1) return [];
  return [Number(result.rows[0].id)];
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
  if (canAccessOwnFinalization(admin)) return `${String(admin.display_name).trim()} appointments`;
  return 'review only';
}

module.exports = {
  normalizedName,
  canAccessOwnFinalization,
  certificationStaffIds,
  canCertifyAppointment,
  authorityDescription,
};
