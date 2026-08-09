const { pool } = require('../db/pool');

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_MAP = new Map(DAYS.flatMap((day, i) => [[day.toLowerCase(), i], [day.slice(0,3).toLowerCase(), i]]));

function clean(value = '') { return String(value).trim().replace(/\s+/g, ' '); }
function validTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')); }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')); }
function dayNumber(value) {
  if (/^[0-6]$/.test(String(value))) return Number(value);
  return DAY_MAP.get(clean(value).toLowerCase());
}

async function resolveStaff(nameOrId) {
  const value = clean(nameOrId);
  if (/^\d+$/.test(value)) {
    const byId = await pool.query(`SELECT id, display_name, status FROM staff WHERE id=$1`, [value]);
    return { matches: byId.rows, exact: byId.rows[0] || null };
  }
  const result = await pool.query(
    `SELECT id, display_name, status FROM staff
      WHERE status='active' AND display_name ILIKE $1
      ORDER BY CASE WHEN LOWER(display_name)=LOWER($2) THEN 0 ELSE 1 END, display_name, id
      LIMIT 10`,
    [`%${value}%`, value]
  );
  const exact = result.rows.find((r) => r.display_name.toLowerCase() === value.toLowerCase()) || null;
  return { matches: result.rows, exact: exact || (result.rows.length === 1 ? result.rows[0] : null) };
}

function validateWindows(windows) {
  if (!Array.isArray(windows)) return { ok: false, message: 'windows must be an array.' };
  const normalized = windows.map((w) => ({ startsLocal: clean(w.startsLocal), endsLocal: clean(w.endsLocal) }));
  for (const w of normalized) {
    if (!validTime(w.startsLocal) || !validTime(w.endsLocal) || w.endsLocal <= w.startsLocal) return { ok: false, message: 'Each window must use HH:MM and end after it starts.' };
  }
  normalized.sort((a,b) => a.startsLocal.localeCompare(b.startsLocal));
  for (let i=1;i<normalized.length;i++) if (normalized[i].startsLocal < normalized[i-1].endsLocal) return { ok:false, message:'Working-hour windows may not overlap.' };
  return { ok:true, windows:normalized };
}

async function getWorkingHours(staffId) {
  const staff = await pool.query(`SELECT id, display_name, status FROM staff WHERE id=$1`, [staffId]);
  if (!staff.rowCount) return null;
  const hours = await pool.query(
    `SELECT id, staff_id, location_id, day_of_week, starts_local::text AS starts_local, ends_local::text AS ends_local, active
       FROM staff_working_hours WHERE staff_id=$1 AND active=TRUE
       ORDER BY day_of_week, starts_local, id`, [staffId]
  );
  const exceptions = await pool.query(
    `SELECT id, staff_id, location_id, exception_date, exception_type,
            starts_local::text AS starts_local, ends_local::text AS ends_local, reason
       FROM staff_schedule_exceptions WHERE staff_id=$1 AND exception_date >= CURRENT_DATE
       ORDER BY exception_date, starts_local NULLS FIRST, id LIMIT 30`, [staffId]
  );
  return { staff: staff.rows[0], hours: hours.rows, exceptions: exceptions.rows };
}

async function replaceWorkingHoursDay({ staffId, dayOfWeek, windows, locationId = null, actorAdminId = null }) {
  const day = dayNumber(dayOfWeek);
  if (day === undefined) return { status:'invalid_day', reply:'Use a weekday name such as Monday, or day number 0–6.' };
  const validated = validateWindows(windows);
  if (!validated.ok) return { status:'invalid_windows', reply:validated.message };
  const staffResult = await pool.query(`SELECT id, display_name, status FROM staff WHERE id=$1`, [staffId]);
  if (!staffResult.rowCount || staffResult.rows[0].status !== 'active') return { status:'staff_not_found', reply:'Active staff member not found.' };
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query(`DELETE FROM staff_working_hours WHERE staff_id=$1 AND day_of_week=$2 AND (($3::bigint IS NULL AND location_id IS NULL) OR location_id=$3)`, [staffId, day, locationId]);
    for (const w of validated.windows) {
      await db.query(`INSERT INTO staff_working_hours (staff_id, location_id, day_of_week, starts_local, ends_local) VALUES ($1,$2,$3,$4::time,$5::time)`, [staffId, locationId, day, w.startsLocal, w.endsLocal]);
    }
    await db.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1,'schedule.working_hours_replaced','staff',$2,$3::jsonb)`, [actorAdminId, staffId, JSON.stringify({ dayOfWeek:day, day:DAYS[day], locationId, windows:validated.windows })]);
    await db.query('COMMIT');
    return { status:'updated', staff:staffResult.rows[0], day, windows:validated.windows };
  } catch (e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }
}

async function addScheduleException({ staffId, date, type, startsLocal = null, endsLocal = null, reason = null, locationId = null, actorAdminId = null }) {
  if (!validDate(date)) return { status:'invalid_date', reply:'Use YYYY-MM-DD for the exception date.' };
  if (!['available','unavailable'].includes(type)) return { status:'invalid_type', reply:'Exception type must be available or unavailable.' };
  const hasTimes = startsLocal != null || endsLocal != null;
  if (hasTimes && (!validTime(startsLocal) || !validTime(endsLocal) || endsLocal <= startsLocal)) return { status:'invalid_time', reply:'Use a valid HH:MM-HH:MM range, or all-day.' };
  const staffResult = await pool.query(`SELECT id, display_name, status FROM staff WHERE id=$1`, [staffId]);
  if (!staffResult.rowCount || staffResult.rows[0].status !== 'active') return { status:'staff_not_found', reply:'Active staff member not found.' };
  const inserted = await pool.query(
    `INSERT INTO staff_schedule_exceptions (staff_id, location_id, exception_date, exception_type, starts_local, ends_local, reason)
     VALUES ($1,$2,$3,$4,$5::time,$6::time,$7) RETURNING id, exception_date, exception_type, starts_local::text, ends_local::text, reason`,
    [staffId, locationId, date, type, startsLocal, endsLocal, reason ? clean(reason).slice(0,250) : null]
  );
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1,'schedule.exception_created','staff',$2,$3::jsonb)`, [actorAdminId, staffId, JSON.stringify({ exceptionId: inserted.rows[0].id, date, type, startsLocal, endsLocal, reason })]);
  return { status:'created', staff:staffResult.rows[0], exception:inserted.rows[0] };
}

async function removeScheduleException({ staffId, exceptionId, actorAdminId = null }) {
  const result = await pool.query(`DELETE FROM staff_schedule_exceptions WHERE id=$1 AND staff_id=$2 RETURNING id`, [exceptionId, staffId]);
  if (!result.rowCount) return { status:'not_found' };
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1,'schedule.exception_removed','staff',$2,$3::jsonb)`, [actorAdminId, staffId, JSON.stringify({ exceptionId:Number(exceptionId) })]);
  return { status:'removed' };
}

function formatWorkingHours(data) {
  const lines = [`Working hours — ${data.staff.display_name}`];
  if (!data.hours.length) lines.push('', 'No recurring working hours are configured yet.');
  else {
    for (let d=0; d<7; d++) {
      const rows = data.hours.filter((r) => Number(r.day_of_week) === d);
      if (rows.length) lines.push(`• ${DAYS[d]}: ${rows.map((r)=>`${r.starts_local.slice(0,5)}-${r.ends_local.slice(0,5)}`).join(', ')}`);
    }
  }
  if (data.exceptions.length) {
    lines.push('', 'Upcoming exceptions:');
    for (const ex of data.exceptions.slice(0,10)) lines.push(`• #${ex.id} ${String(ex.exception_date).slice(0,10)} — ${ex.exception_type} — ${ex.starts_local ? `${ex.starts_local.slice(0,5)}-${ex.ends_local.slice(0,5)}` : 'all-day'}${ex.reason ? ` — ${ex.reason}` : ''}`);
  }
  return lines.join('\n');
}

module.exports = { DAYS, dayNumber, resolveStaff, getWorkingHours, replaceWorkingHoursDay, addScheduleException, removeScheduleException, formatWorkingHours };
