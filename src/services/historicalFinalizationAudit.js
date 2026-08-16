const { pool } = require('../db/pool');

const WINDOW_START = '2026-08-01';
const WINDOW_END = '2026-08-15';
const FINAL_STATUSES = new Set(['completed', 'no_show', 'cancelled']);
const CHRISTEL_POOL = new Set(['christel', 'abigail']);

function normalizedName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function classifyAppointment(row) {
  const status = normalizedName(row.status);
  const staff = Array.isArray(row.staff) ? row.staff : [];
  const names = [...new Set(staff.map((item) => normalizedName(item.name || item.snapshot)).filter(Boolean))];
  const hasMissingCanonicalStaff = staff.some((item) => !item.staffId || !item.name);

  if (FINAL_STATUSES.has(status)) {
    return { classification: status === 'cancelled' ? 'cancelled' : 'already_finalized', finalizer: null, reason: null };
  }

  if (!staff.length || !names.length || hasMissingCanonicalStaff) {
    return { classification: 'fail_closed', finalizer: null, reason: 'missing_or_orphaned_practitioner' };
  }

  if (names.every((name) => CHRISTEL_POOL.has(name))) {
    return { classification: 'awaiting_finalization', finalizer: 'Christel', reason: null };
  }

  if (names.every((name) => name === 'marietjie')) {
    return { classification: 'awaiting_finalization', finalizer: 'Marietjie', reason: null };
  }

  return { classification: 'fail_closed', finalizer: null, reason: 'mixed_or_unsupported_practitioner_scope' };
}

async function getHistoricalFinalizationAudit(db = pool) {
  const result = await db.query(
    `SELECT a.id,
            (a.starts_at AT TIME ZONE 'Africa/Johannesburg')::date::text AS clinic_date,
            a.status,
            COALESCE(
              jsonb_agg(
                DISTINCT jsonb_build_object(
                  'staffId', ast.staff_id,
                  'name', s.display_name,
                  'snapshot', ast.staff_name_snapshot
                )
              ) FILTER (WHERE ast.appointment_id IS NOT NULL),
              '[]'::jsonb
            ) AS staff
       FROM appointments a
       LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
       LEFT JOIN staff s ON s.id=ast.staff_id
      WHERE (a.starts_at AT TIME ZONE 'Africa/Johannesburg')::date BETWEEN $1::date AND $2::date
      GROUP BY a.id, clinic_date, a.status
      ORDER BY clinic_date, a.id`,
    [WINDOW_START, WINDOW_END]
  );

  const appointments = result.rows.map((row) => {
    const decision = classifyAppointment(row);
    const practitionerNames = [...new Set((row.staff || []).map((item) => item.name || item.snapshot).filter(Boolean))];
    return {
      appointmentId: Number(row.id),
      clinicDate: row.clinic_date,
      status: row.status,
      practitioners: practitionerNames,
      ...decision,
    };
  });

  const counts = appointments.reduce((acc, item) => {
    acc.total += 1;
    if (item.classification === 'awaiting_finalization' && item.finalizer === 'Christel') acc.christelAwaiting += 1;
    if (item.classification === 'awaiting_finalization' && item.finalizer === 'Marietjie') acc.marietjieAwaiting += 1;
    if (item.classification === 'already_finalized') acc.alreadyFinalized += 1;
    if (item.classification === 'cancelled') acc.cancelled += 1;
    if (item.classification === 'fail_closed') acc.failClosed += 1;
    return acc;
  }, { total: 0, christelAwaiting: 0, marietjieAwaiting: 0, alreadyFinalized: 0, cancelled: 0, failClosed: 0 });

  return {
    safety: 'read_only_sanitized',
    window: { start: WINDOW_START, end: WINDOW_END, timeZone: 'Africa/Johannesburg' },
    counts,
    complete: counts.failClosed === 0,
    appointments,
  };
}

module.exports = { WINDOW_START, WINDOW_END, FINAL_STATUSES, classifyAppointment, getHistoricalFinalizationAudit };
