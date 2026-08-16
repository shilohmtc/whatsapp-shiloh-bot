const { pool } = require('../db/pool');
const { checkClinicHours } = require('./clinicHours');
const { checkAuthoritativeSchedule, getConflicts } = require('./adminAvailability');

const TZ = 'Africa/Johannesburg';

function formatLocalDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

async function getSingleActiveLocation(db = pool) {
  const result = await db.query(`SELECT id, name, timezone FROM locations WHERE status='active' ORDER BY id LIMIT 2`);
  return result.rowCount === 1 ? result.rows[0] : null;
}

async function historicalWindow({ db = pool, date, time, totalMinutes }) {
  const result = await db.query(
    `SELECT (($1::date + $2::time) AT TIME ZONE 'Africa/Johannesburg') AS starts_at,
            ((($1::date + $2::time) + ($3::text || ' minutes')::interval) AT TIME ZONE 'Africa/Johannesburg') AS ends_at`,
    [date, time, totalMinutes]
  );
  return result.rows[0];
}

async function validateHistoricalState({ db = pool, clientId, staffId, serviceId, date, time, locationId = null }) {
  const records = await db.query(
    `SELECT c.id client_id,c.display_name client_name,c.status client_status,
            st.id staff_id,st.display_name staff_name,st.status staff_status,
            s.id service_id,s.name service_name,s.status service_status,
            s.duration_minutes,s.processing_time_minutes,s.extra_time_minutes,s.price,s.variable_price
       FROM clients c, staff st, services s
      WHERE c.id=$1 AND st.id=$2 AND s.id=$3`,
    [clientId, staffId, serviceId]
  );
  const row = records.rows[0];
  if (!row) return { status: 'not_found', reply: 'The client, practitioner, or service could not be resolved from the canonical CRM.' };
  if (row.client_status !== 'active' || row.staff_status !== 'active' || row.service_status !== 'active') return { status: 'inactive', reply: 'The client, practitioner, and service must all still be active before a historical booking can be recorded.' };

  const eligibility = await db.query(`SELECT 1 FROM staff_services WHERE staff_id=$1 AND service_id=$2 LIMIT 1`, [staffId, serviceId]);
  if (!eligibility.rowCount) return { status: 'not_eligible', reply: `${row.staff_name} is not mapped as eligible for ${row.service_name}. Nothing was written.` };

  const totalMinutes = Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0);
  if (totalMinutes <= 0) return { status: 'invalid_duration', reply: `${row.service_name} does not have a usable duration. Nothing was written.` };

  const location = locationId ? (await db.query(`SELECT id,name,timezone,status FROM locations WHERE id=$1`, [locationId])).rows[0] : await getSingleActiveLocation(db);
  if (!location || location.status === 'inactive') return { status: 'location_ambiguous', reply: 'I cannot safely resolve the clinic location for this historical booking.' };

  const window = await historicalWindow({ db, date, time, totalMinutes });
  if (!window?.starts_at || new Date(window.starts_at).getTime() >= Date.now()) return { status: 'not_historical', reply: 'Historical manual entry is only for a time that has already passed.' };

  const clinic = await checkClinicHours({ db, locationId: location.id, startsAt: window.starts_at, endsAt: window.ends_at });
  if (!clinic.covered) return { status: 'outside_clinic_hours', reply: 'That historical time falls outside the clinic’s authoritative operating hours. Nothing was written.' };

  const schedule = await checkAuthoritativeSchedule({ db, staffId, locationId: location.id, startsAt: window.starts_at, endsAt: window.ends_at });
  if (schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException) || !schedule.covered) return { status: 'outside_staff_schedule', reply: `That historical time falls outside ${row.staff_name}’s authoritative schedule. Nothing was written.` };

  const conflicts = await getConflicts({ db, staffId, startsAt: window.starts_at, endsAt: window.ends_at });
  if (conflicts.length) return { status: 'conflict', reply: `A canonical CRM appointment or staff block already overlaps that historical time. Nothing was written; check for a duplicate before continuing.` };

  return { status: 'valid', ...row, location, startsAt: window.starts_at, endsAt: window.ends_at, totalMinutes };
}

async function prepareHistoricalAdminBooking({ adminId, clientId, staffId, serviceId, date, time }) {
  const state = await validateHistoricalState({ clientId, staffId, serviceId, date, time });
  if (state.status !== 'valid') return state;

  await pool.query(
    `INSERT INTO admin_booking_sessions
       (admin_id,client_id,staff_id,service_id,location_id,starts_at,ends_at,state,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'confirm',NOW())
     ON CONFLICT (admin_id) DO UPDATE SET
       client_id=EXCLUDED.client_id,staff_id=EXCLUDED.staff_id,service_id=EXCLUDED.service_id,
       location_id=EXCLUDED.location_id,starts_at=EXCLUDED.starts_at,ends_at=EXCLUDED.ends_at,
       state='confirm',updated_at=NOW()`,
    [adminId, clientId, staffId, serviceId, state.location.id, state.startsAt, state.endsAt]
  );

  const price = state.variable_price ? (state.price == null ? 'variable' : `from R${Number(state.price).toFixed(2)} (variable)`) : (state.price == null ? 'not set' : `R${Number(state.price).toFixed(2)}`);
  return {
    status: 'pending_confirmation',
    reply: [
      '*Historical booking ready for confirmation*',
      `• Client: ${state.client_name} — CRM #${state.client_id}`,
      `• Service: ${state.service_name}`,
      `• Staff: ${state.staff_name}`,
      `• Time: ${formatLocalDateTime(state.startsAt)}`,
      `• Price: ${price}`,
      '',
      'This records a past appointment in Shiloh CRM for reconciliation.',
      'No Google Calendar event or client message will be created for this historical entry.',
      'Nothing has been written yet.',
    ].join('\n'),
  };
}

async function confirmHistoricalAdminBooking(admin) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const sessionResult = await db.query(
      `SELECT abs.admin_id,abs.client_id,abs.staff_id,abs.service_id,abs.location_id,abs.starts_at,abs.ends_at,abs.state,
              c.display_name client_name,c.status client_status,
              st.display_name staff_name,st.status staff_status,
              s.name service_name,s.status service_status,s.duration_minutes,s.processing_time_minutes,s.extra_time_minutes,s.price,s.variable_price,
              l.name location_name,l.status location_status
         FROM admin_booking_sessions abs
         JOIN clients c ON c.id=abs.client_id
         JOIN staff st ON st.id=abs.staff_id
         JOIN services s ON s.id=abs.service_id
         JOIN locations l ON l.id=abs.location_id
        WHERE abs.admin_id=$1
        FOR UPDATE OF abs`,
      [admin.id]
    );
    const session = sessionResult.rows[0];
    if (!session) { await db.query('ROLLBACK'); return { status: 'no_pending', reply: 'There is no pending historical booking to confirm.' }; }

    await db.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [session.staff_id]);
    if (session.state !== 'confirm' || session.client_status !== 'active' || session.staff_status !== 'active' || session.service_status !== 'active' || session.location_status !== 'active') {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id=$1`, [admin.id]); await db.query('COMMIT');
      return { status: 'stale', reply: 'The historical booking became stale because canonical CRM data changed. Nothing was created.' };
    }
    if (new Date(session.starts_at).getTime() >= Date.now()) {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id=$1`, [admin.id]); await db.query('COMMIT');
      return { status: 'not_historical', reply: 'That time is not in the past. Use the normal booking flow instead.' };
    }

    const eligibility = await db.query(`SELECT 1 FROM staff_services WHERE staff_id=$1 AND service_id=$2 LIMIT 1`, [session.staff_id, session.service_id]);
    if (!eligibility.rowCount) { await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id=$1`, [admin.id]); await db.query('COMMIT'); return { status: 'eligibility_changed', reply: 'Practitioner/service eligibility changed. Nothing was created.' }; }

    const clinic = await checkClinicHours({ db, locationId: session.location_id, startsAt: session.starts_at, endsAt: session.ends_at });
    const schedule = await checkAuthoritativeSchedule({ db, staffId: session.staff_id, locationId: session.location_id, startsAt: session.starts_at, endsAt: session.ends_at });
    const conflicts = await getConflicts({ db, staffId: session.staff_id, startsAt: session.starts_at, endsAt: session.ends_at });
    if (!clinic.covered || schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException) || !schedule.covered || conflicts.length) {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id=$1`, [admin.id]); await db.query('COMMIT');
      return { status: conflicts.length ? 'conflict' : 'schedule_changed', reply: conflicts.length ? 'A CRM conflict appeared before confirmation. Nothing was created.' : 'Clinic or practitioner schedule rules no longer permit this historical time. Nothing was created.' };
    }

    const totalPrice = session.variable_price ? null : session.price;
    const appointmentResult = await db.query(
      `INSERT INTO appointments (client_id,location_id,starts_at,ends_at,status,title,total_price,currency,source)
       VALUES ($1,$2,$3,$4,'scheduled',$5,$6,'ZAR','shiloh_admin_historical_manual')
       RETURNING id,starts_at,ends_at,status`,
      [session.client_id, session.location_id, session.starts_at, session.ends_at, session.service_name, totalPrice]
    );
    const appointment = appointmentResult.rows[0];
    await db.query(`INSERT INTO appointment_services (appointment_id,service_id,position,service_name_snapshot,price_snapshot,duration_minutes_snapshot) VALUES ($1,$2,1,$3,$4,$5)`, [appointment.id, session.service_id, session.service_name, session.price, session.duration_minutes]);
    await db.query(`INSERT INTO appointment_staff (appointment_id,staff_id,position,staff_name_snapshot) VALUES ($1,$2,1,$3)`, [appointment.id, session.staff_id, session.staff_name]);
    await db.query(`INSERT INTO appointment_status_history (appointment_id,from_status,to_status,changed_by,reason) VALUES ($1,NULL,'scheduled',$2,'Historical manual booking entered for reconciliation')`, [appointment.id, `admin:${admin.id}:${admin.display_name}`]);
    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'admin.historical_booking_created','appointment',$2,$3::jsonb)`,
      [admin.id, appointment.id, JSON.stringify({ historicalManualEntry: true, source: 'shiloh_admin_historical_manual', clientId: session.client_id, staffId: session.staff_id, serviceId: session.service_id, locationId: session.location_id, startsAt: session.starts_at, endsAt: session.ends_at, authoritativeClinicHoursChecked: true, authoritativeScheduleChecked: true, crmConflictChecked: true, sharedGoogleCalendarChecked: false, practitionerGoogleCalendarChecked: false, customerMessageSent: false })]
    );
    await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id=$1`, [admin.id]);
    await db.query('COMMIT');
    return {
      status: 'created',
      appointmentId: appointment.id,
      reply: [
        `✅ Historical booking recorded — appointment #${appointment.id}.`,
        `• Client: ${session.client_name}`,
        `• Service: ${session.service_name}`,
        `• Staff: ${session.staff_name}`,
        `• Time: ${formatLocalDateTime(session.starts_at)}`,
        '',
        'No Google Calendar event or client message was created.',
        'The appointment is unresolved/scheduled and can now be finalized from Finalize past visits.',
      ].join('\n'),
    };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

module.exports = { prepareHistoricalAdminBooking, confirmHistoricalAdminBooking, validateHistoricalState };
