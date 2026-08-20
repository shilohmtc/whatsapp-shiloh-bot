const { pool } = require('../db/pool');
const { calendarEnabled, eventIdForAppointment, cancelBookingEvent } = require('./googleBookingCalendar');
const { cancelPractitionerBookingEvents } = require('./practitionerGoogleCalendar');
const logger = require('../lib/logger');

const DUMMY_TEST_CLIENT_ID = 835;
const CLEANUP_FLAG = 'CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START';
const SYSTEM_ACTOR = 'system:dummy_test_booking_cleanup';
const CLEANUP_REASON = 'Archived Dummy Test CRM cleanup after number reassignment';
const FINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show']);

function enabled(env = process.env) {
  return String(env[CLEANUP_FLAG] || '').trim().toLowerCase() === 'true';
}

function validDummyName(value) {
  return ['dummy test', 'crm dummy test'].includes(String(value || '').trim().toLowerCase());
}

async function tableExists(db, name) {
  const result = await db.query('SELECT to_regclass($1) AS table_name', [`public.${name}`]);
  return Boolean(result.rows[0]?.table_name);
}

function assertResetIdentity(row) {
  if (!row || Number(row.id) !== DUMMY_TEST_CLIENT_ID) {
    throw new Error(`Dummy Test booking cleanup blocked: CRM #${DUMMY_TEST_CLIENT_ID} not found`);
  }
  if (!validDummyName(row.display_name)) {
    throw new Error('Dummy Test booking cleanup blocked: canonical display name drift');
  }
  if (String(row.status || '').toLowerCase() !== 'inactive') {
    throw new Error('Dummy Test booking cleanup blocked: CRM target is not archived/inactive');
  }
  if (row.reset_marker !== true && String(row.reset_marker).toLowerCase() !== 'true') {
    throw new Error('Dummy Test booking cleanup blocked: completed reset marker is missing');
  }
  if (Number(row.bound_contact_count) !== 0) {
    throw new Error('Dummy Test booking cleanup blocked: WhatsApp/mobile contact is still bound to CRM #835');
  }
}

async function loadLockedIdentity(db) {
  const result = await db.query(`
    SELECT c.id,c.display_name,c.status,
           c.custom_attributes->>'test_client_reset' AS reset_marker,
           (SELECT COUNT(*)::int FROM client_contacts cc
             WHERE cc.client_id=c.id AND cc.contact_type IN ('whatsapp','mobile')) AS bound_contact_count
      FROM clients c
     WHERE c.id=$1
     FOR UPDATE`, [DUMMY_TEST_CLIENT_ID]);
  const row = result.rows[0] || null;
  assertResetIdentity(row);
  return row;
}

async function loadAppointmentsForUpdate(db) {
  const result = await db.query(`
    SELECT a.id,a.status,a.starts_at,a.ends_at,
           COALESCE(array_agg(DISTINCT ast.staff_name_snapshot)
             FILTER (WHERE ast.staff_name_snapshot IS NOT NULL), ARRAY[]::text[]) AS staff_names
      FROM appointments a
      LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
     WHERE a.client_id=$1
     GROUP BY a.id,a.status,a.starts_at,a.ends_at
     ORDER BY a.id
     FOR UPDATE OF a`, [DUMMY_TEST_CLIENT_ID]);
  return result.rows;
}

async function terminalizeRelatedState(db, appointmentIds) {
  if (!appointmentIds.length) return { approvals: 0, reschedules: 0, lifecycle: 0, notifications: 0 };
  const counts = { approvals: 0, reschedules: 0, lifecycle: 0, notifications: 0 };

  if (await tableExists(db, 'appointment_booking_approvals')) {
    const result = await db.query(`
      UPDATE appointment_booking_approvals
         SET status='declined',decided_at=COALESCE(decided_at,NOW()),decided_by_admin_id=NULL,
             decision_note=COALESCE(decision_note,$2),updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status='pending'`, [appointmentIds, CLEANUP_REASON]);
    counts.approvals = result.rowCount;
  }

  if (await tableExists(db, 'appointment_reschedule_requests')) {
    const result = await db.query(`
      UPDATE appointment_reschedule_requests
         SET status='superseded',decided_at=COALESCE(decided_at,NOW()),decided_by_admin_id=NULL,
             decision_note=COALESCE(decision_note,$2),updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status IN ('pending','notification_failed')`, [appointmentIds, CLEANUP_REASON]);
    counts.reschedules = result.rowCount;
  }

  if (await tableExists(db, 'appointment_lifecycle')) {
    const result = await db.query(`
      UPDATE appointment_lifecycle
         SET status='cancelled',updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status NOT IN ('cancelled','completed')`, [appointmentIds]);
    counts.lifecycle = result.rowCount;
  }

  if (await tableExists(db, 'customer_change_notifications')) {
    const result = await db.query(`
      UPDATE customer_change_notifications
         SET status='suppressed',suppression_reason='dummy_test_client_archived_cleanup',
             suppressed_at=COALESCE(suppressed_at,NOW()),updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status IN ('pending','failed')`, [appointmentIds]);
    counts.notifications = result.rowCount;
  }

  return counts;
}

async function cancelCanonicalAppointments(db, appointments) {
  const cancelled = [];
  const preserved = [];
  for (const appointment of appointments) {
    const status = String(appointment.status || '').toLowerCase();
    if (FINAL_STATUSES.has(status)) {
      preserved.push({ id: Number(appointment.id), status });
      continue;
    }
    const updated = await db.query(`
      UPDATE appointments SET status='cancelled',updated_at=NOW()
       WHERE id=$1 AND client_id=$2 AND status=$3
       RETURNING id,status`, [appointment.id, DUMMY_TEST_CLIENT_ID, appointment.status]);
    if (!updated.rowCount) throw new Error(`Dummy Test booking cleanup conflict on appointment #${appointment.id}`);
    await db.query(`
      INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
      VALUES($1,$2,'cancelled',$3,$4)`, [appointment.id, appointment.status, SYSTEM_ACTOR, CLEANUP_REASON]);
    await db.query(`
      INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
      VALUES(NULL,'system.dummy_test_appointment_cleanup','appointment',$1,$2::jsonb)`, [
      String(appointment.id),
      JSON.stringify({ clientId: DUMMY_TEST_CLIENT_ID, fromStatus: appointment.status, toStatus: 'cancelled', reason: CLEANUP_REASON, noClientMessage: true }),
    ]);
    cancelled.push({
      id: Number(appointment.id),
      fromStatus: appointment.status,
      staffNames: Array.isArray(appointment.staff_names) ? appointment.staff_names.filter(Boolean) : [],
    });
  }
  return { cancelled, preserved };
}

async function markSharedCalendarMapping(appointmentId, status, error = null, db = pool) {
  if (!(await tableExists(db, 'appointment_calendar_events'))) return;
  await db.query(`
    UPDATE appointment_calendar_events
       SET sync_status=$2,last_error=$3,updated_at=NOW()
     WHERE appointment_id=$1 AND provider='google_calendar'`, [appointmentId, status, error ? String(error).slice(0, 2000) : null]);
}

async function cleanupCalendars(cancelled, deps = {}) {
  const calendarOn = deps.calendarEnabled || calendarEnabled;
  const cancelShared = deps.cancelBookingEvent || cancelBookingEvent;
  const cancelPractitioner = deps.cancelPractitionerBookingEvents || cancelPractitionerBookingEvents;
  const markMapping = deps.markSharedCalendarMapping || markSharedCalendarMapping;
  const results = [];
  if (!calendarOn()) return cancelled.map((item) => ({ appointmentId: item.id, status: 'disabled' }));

  for (const item of cancelled) {
    const eventId = eventIdForAppointment(item.id);
    try {
      const shared = await cancelShared(eventId);
      const practitioner = await cancelPractitioner({ appointmentId: item.id, staffNames: item.staffNames });
      await markMapping(item.id, 'cancelled');
      results.push({ appointmentId: item.id, eventId, status: 'cancelled', sharedCancelled: shared?.cancelled === true, practitioner });
    } catch (error) {
      try { await markMapping(item.id, 'error', error.message || error); } catch (_) {}
      results.push({ appointmentId: item.id, eventId, status: 'error', error: String(error.message || error) });
      logger.error({ err: error, appointmentId: item.id }, 'Dummy Test booking cleanup calendar cancellation failed');
    }
  }
  return results;
}

async function runDummyTestAppointmentCleanup(deps = {}) {
  const dbPool = deps.pool || pool;
  const env = deps.env || process.env;
  if (!enabled(env)) return { enabled: false, skipped: true };

  const client = await dbPool.connect();
  let cancelled = [];
  let preserved = [];
  let related = {};
  try {
    await client.query('BEGIN');
    await loadLockedIdentity(client);
    const appointments = await loadAppointmentsForUpdate(client);
    ({ cancelled, preserved } = await cancelCanonicalAppointments(client, appointments));
    related = await terminalizeRelatedState(client, appointments.map((item) => Number(item.id)));
    await client.query(`
      INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
      VALUES(NULL,'system.dummy_test_booking_cleanup_completed','client',$1,$2::jsonb)`, [
      String(DUMMY_TEST_CLIENT_ID),
      JSON.stringify({ cancelledAppointmentIds: cancelled.map((item) => item.id), preserved, related, noClientMessage: true }),
    ]);
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }

  const calendars = await cleanupCalendars(cancelled, deps);
  const unresolvedCalendarIds = calendars.filter((item) => item.status === 'error').map((item) => item.appointmentId);
  const result = {
    enabled: true,
    clientId: DUMMY_TEST_CLIENT_ID,
    cancelledAppointmentIds: cancelled.map((item) => item.id),
    preserved,
    related,
    calendars,
    unresolvedCalendarIds,
  };
  logger.info(result, 'Dummy Test booking cleanup one-shot completed');
  return result;
}

module.exports = {
  DUMMY_TEST_CLIENT_ID,
  CLEANUP_FLAG,
  FINAL_STATUSES,
  enabled,
  validDummyName,
  assertResetIdentity,
  terminalizeRelatedState,
  cancelCanonicalAppointments,
  cleanupCalendars,
  runDummyTestAppointmentCleanup,
};
