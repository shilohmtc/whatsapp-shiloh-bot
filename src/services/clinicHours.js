const { pool } = require('../db/pool');

async function getDefaultActiveLocation(db = pool) {
  const result = await db.query(`
    SELECT id, name, timezone
      FROM locations
     WHERE status = 'active'
     ORDER BY id
     LIMIT 2
  `);
  return result.rowCount === 1 ? result.rows[0] : null;
}

async function checkClinicHours({ db = pool, locationId = null, startsAt, endsAt }) {
  let resolvedLocationId = locationId;
  if (!resolvedLocationId) {
    const location = await getDefaultActiveLocation(db);
    if (!location) return { covered: false, reason: 'location_unresolved', locationId: null };
    resolvedLocationId = location.id;
  }

  const result = await db.query(`
    WITH requested AS (
      SELECT ($2::timestamptz AT TIME ZONE 'Africa/Johannesburg')::date AS local_date,
             ($2::timestamptz AT TIME ZONE 'Africa/Johannesburg')::time AS local_start,
             ($3::timestamptz AT TIME ZONE 'Africa/Johannesburg')::time AS local_end,
             EXTRACT(DOW FROM ($2::timestamptz AT TIME ZONE 'Africa/Johannesburg')::date)::int AS dow,
             ($3::timestamptz AT TIME ZONE 'Africa/Johannesburg')::date AS local_end_date
    )
    SELECT EXISTS (
      SELECT 1
        FROM location_working_hours lwh, requested r
       WHERE lwh.location_id = $1
         AND lwh.day_of_week = r.dow
         AND lwh.active = TRUE
         AND r.local_date = r.local_end_date
         AND lwh.starts_local <= r.local_start
         AND lwh.ends_local >= r.local_end
    ) AS covered
  `, [resolvedLocationId, startsAt, endsAt]);

  return {
    covered: result.rows[0]?.covered === true,
    locationId: resolvedLocationId,
    reason: result.rows[0]?.covered === true ? null : 'outside_clinic_hours',
  };
}

module.exports = { checkClinicHours, getDefaultActiveLocation };
