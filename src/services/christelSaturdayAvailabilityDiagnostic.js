const { pool } = require('../db/pool');
const logger = require('../lib/logger');
const { listAvailableSlots } = require('./availabilityService');

const TARGET_DATE = '2026-08-29';
const TARGET_STAFF = 'Christel';
const TARGET_SERVICE = 'Full Body Swedish';

function count(value) {
  return Number(value || 0);
}

async function resolveTarget() {
  const result = await pool.query(
    `SELECT st.id AS staff_id, st.scheduling_type,
            s.id AS service_id,
            s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
            COALESCE((SELECT id FROM locations WHERE status = 'active' ORDER BY id LIMIT 1), 0) AS location_id
       FROM staff st
       CROSS JOIN services s
      WHERE LOWER(st.display_name) = LOWER($1)
        AND LOWER(s.name) = LOWER($2)
        AND st.status = 'active'
        AND s.status = 'active'
      ORDER BY st.id, s.id`,
    [TARGET_STAFF, TARGET_SERVICE]
  );
  if (result.rows.length !== 1) {
    return { ok: false, reason: 'target_resolution', matchCount: result.rows.length };
  }
  return { ok: true, row: result.rows[0] };
}

async function gateCounts(staffId, locationId, totalMinutes) {
  const result = await pool.query(
    `WITH requested AS (
       SELECT $1::date AS local_date,
              EXTRACT(DOW FROM $1::date)::int AS dow,
              NULLIF($3::bigint, 0) AS location_id
     ),
     holiday AS (
       SELECT ph.holiday_date
         FROM public_holidays ph, requested r
        WHERE ph.country_code = 'ZA' AND ph.holiday_date = r.local_date
     ),
     clinic_override AS (
       SELECT lhe.exception_type, lhe.starts_local, lhe.ends_local
         FROM location_hours_exceptions lhe, requested r
        WHERE lhe.location_id = r.location_id AND lhe.exception_date = r.local_date
     ),
     clinic_windows AS (
       SELECT co.starts_local, co.ends_local
         FROM clinic_override co
        WHERE co.exception_type = 'open'
       UNION ALL
       SELECT lwh.starts_local, lwh.ends_local
         FROM location_working_hours lwh, requested r
        WHERE lwh.location_id = r.location_id
          AND lwh.day_of_week = r.dow
          AND lwh.active = TRUE
          AND NOT EXISTS (SELECT 1 FROM clinic_override)
          AND NOT EXISTS (SELECT 1 FROM holiday)
     ),
     base_windows AS (
       SELECT wh.starts_local, wh.ends_local
         FROM staff_working_hours wh, requested r
        WHERE wh.staff_id = $2
          AND wh.day_of_week = r.dow
          AND wh.active = TRUE
          AND (wh.location_id IS NULL OR wh.location_id = r.location_id)
     ),
     recurring_closed AS (
       SELECT 1
         FROM staff_recurring_day_closures c, requested r
        WHERE c.staff_id = $2
          AND c.day_of_week = r.dow
          AND (c.location_id IS NULL OR c.location_id = r.location_id)
     ),
     exception_windows AS (
       SELECT ex.exception_type, ex.starts_local, ex.ends_local
         FROM staff_schedule_exceptions ex, requested r
        WHERE ex.staff_id = $2
          AND ex.exception_date = r.local_date
          AND (ex.location_id IS NULL OR ex.location_id = r.location_id)
     ),
     inherited_windows AS (
       SELECT cw.starts_local, cw.ends_local
         FROM clinic_windows cw
         JOIN staff st ON st.id = $2
        WHERE st.scheduling_type = 'regular'
          AND NOT EXISTS (SELECT 1 FROM base_windows)
          AND NOT EXISTS (SELECT 1 FROM recurring_closed)
     ),
     staff_windows AS (
       SELECT starts_local, ends_local FROM base_windows
        WHERE NOT EXISTS (
          SELECT 1 FROM exception_windows ex
           WHERE ex.exception_type = 'unavailable'
             AND ex.starts_local IS NULL AND ex.ends_local IS NULL
        )
       UNION ALL
       SELECT starts_local, ends_local FROM inherited_windows
        WHERE NOT EXISTS (
          SELECT 1 FROM exception_windows ex
           WHERE ex.exception_type = 'unavailable'
             AND ex.starts_local IS NULL AND ex.ends_local IS NULL
        )
       UNION ALL
       SELECT starts_local, ends_local FROM exception_windows
        WHERE exception_type = 'available'
          AND starts_local IS NOT NULL AND ends_local IS NOT NULL
     ),
     effective_windows AS (
       SELECT GREATEST(sw.starts_local, cw.starts_local) AS starts_local,
              LEAST(sw.ends_local, cw.ends_local) AS ends_local
         FROM staff_windows sw
         JOIN clinic_windows cw
           ON sw.starts_local < cw.ends_local
          AND sw.ends_local > cw.starts_local
     ),
     candidates AS (
       SELECT (r.local_date + ew.starts_local + (gs.n * interval '15 minutes')) AS local_start,
              (r.local_date + ew.starts_local + (gs.n * interval '15 minutes') + ($4::text || ' minutes')::interval) AS local_end
         FROM requested r
         JOIN effective_windows ew ON ew.ends_local > ew.starts_local
         CROSS JOIN LATERAL generate_series(
           0,
           GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (ew.ends_local - ew.starts_local)) / 60 / 15)::int)
         ) AS gs(n)
        WHERE r.local_date + ew.starts_local + (gs.n * interval '15 minutes') + ($4::text || ' minutes')::interval
              <= r.local_date + ew.ends_local
     ),
     after_exceptions AS (
       SELECT c.* FROM candidates c
        WHERE NOT EXISTS (
          SELECT 1 FROM exception_windows ex
           WHERE ex.exception_type = 'unavailable'
             AND ex.starts_local IS NOT NULL AND ex.ends_local IS NOT NULL
             AND c.local_start < ($1::date + ex.ends_local)
             AND c.local_end > ($1::date + ex.starts_local)
        )
     ),
     after_appointments AS (
       SELECT c.* FROM after_exceptions c
        WHERE NOT EXISTS (
          SELECT 1
            FROM appointment_staff ast
            JOIN appointments a ON a.id = ast.appointment_id
           WHERE ast.staff_id = $2
             AND a.status <> 'cancelled'
             AND a.starts_at < (c.local_end AT TIME ZONE 'Africa/Johannesburg')
             AND a.ends_at > (c.local_start AT TIME ZONE 'Africa/Johannesburg')
        )
     ),
     after_blocks AS (
       SELECT c.* FROM after_appointments c
        WHERE NOT EXISTS (
          SELECT 1 FROM calendar_blocks cb
           WHERE cb.staff_id = $2
             AND cb.starts_at < (c.local_end AT TIME ZONE 'Africa/Johannesburg')
             AND cb.ends_at > (c.local_start AT TIME ZONE 'Africa/Johannesburg')
        )
     )
     SELECT
       (SELECT COUNT(*) FROM holiday) AS holiday_count,
       (SELECT COUNT(*) FROM clinic_override) AS clinic_override_count,
       (SELECT COUNT(*) FROM clinic_windows) AS clinic_window_count,
       (SELECT COUNT(*) FROM base_windows) AS base_window_count,
       (SELECT COUNT(*) FROM recurring_closed) AS recurring_closure_count,
       (SELECT COUNT(*) FROM exception_windows) AS schedule_exception_count,
       (SELECT COUNT(*) FROM exception_windows WHERE exception_type = 'unavailable' AND starts_local IS NULL AND ends_local IS NULL) AS full_day_unavailable_count,
       (SELECT COUNT(*) FROM inherited_windows) AS inherited_window_count,
       (SELECT COUNT(*) FROM staff_windows) AS staff_window_count,
       (SELECT COUNT(*) FROM effective_windows) AS effective_window_count,
       (SELECT COUNT(*) FROM candidates) AS raw_candidate_count,
       (SELECT COUNT(*) FROM after_exceptions) AS after_exception_count,
       (SELECT COUNT(*) FROM after_appointments) AS after_appointment_count,
       (SELECT COUNT(*) FROM after_blocks) AS after_block_count,
       (SELECT COUNT(*) FROM appointments a JOIN appointment_staff ast ON ast.appointment_id = a.id
          WHERE ast.staff_id = $2 AND a.status <> 'cancelled'
            AND a.starts_at < (($1::date + time '14:00') AT TIME ZONE 'Africa/Johannesburg')
            AND a.ends_at > (($1::date + time '08:00') AT TIME ZONE 'Africa/Johannesburg')) AS overlapping_appointment_count,
       (SELECT COUNT(*) FROM calendar_blocks cb
          WHERE cb.staff_id = $2
            AND cb.starts_at < (($1::date + time '14:00') AT TIME ZONE 'Africa/Johannesburg')
            AND cb.ends_at > (($1::date + time '08:00') AT TIME ZONE 'Africa/Johannesburg')) AS overlapping_block_count`,
    [TARGET_DATE, staffId, locationId, totalMinutes]
  );
  const row = result.rows[0] || {};
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, count(value)]));
}

async function runChristelSaturdayAvailabilityDiagnostic() {
  const target = await resolveTarget();
  if (!target.ok) {
    logger.warn({ availabilityDiagnostic: { targetDate: TARGET_DATE, ...target } }, 'Christel Saturday availability diagnostic completed');
    return target;
  }

  const row = target.row;
  const totalMinutes = Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0);
  const gates = await gateCounts(Number(row.staff_id), Number(row.location_id), totalMinutes);
  let canonical = null;
  try {
    const result = await listAvailableSlots({
      staffId: Number(row.staff_id),
      serviceId: Number(row.service_id),
      date: TARGET_DATE,
      locationId: Number(row.location_id) || null,
      intervalMinutes: 15,
    });
    canonical = {
      status: result.status,
      slotCount: (result.slots || []).length,
      calendarEnabled: result.calendarEnabled === true,
      calendarConflictCount: Number(result.calendarConflictCount || 0),
    };
  } catch (error) {
    canonical = { status: 'error', errorClass: error?.name || 'Error' };
  }

  const report = {
    targetDate: TARGET_DATE,
    staff: TARGET_STAFF,
    service: TARGET_SERVICE,
    schedulingType: row.scheduling_type,
    totalMinutes,
    gates,
    canonical,
  };
  logger.info({ availabilityDiagnostic: report }, 'Christel Saturday availability diagnostic completed');
  return report;
}

module.exports = { runChristelSaturdayAvailabilityDiagnostic };
