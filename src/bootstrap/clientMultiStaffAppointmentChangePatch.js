const { pool } = require('../db/pool');
const appointmentChange = require('../services/appointmentChange');
const { normalizePhone } = require('../services/clientIdentityOnboarding');
const {
  calendarEnabled,
  findBookingEventByAppointmentId,
  cancelBookingEvent,
} = require('../services/googleBookingCalendar');
const { cancelPractitionerBookingEvents } = require('../services/practitionerGoogleCalendar');
const logger = require('../lib/logger');

const originalProcessAppointmentChangeMessage = appointmentChange.processAppointmentChangeMessage;

function isConfirmation(text = '') {
  return /^(yes|y|confirm|confirmed|correct|proceed|continue|ok|okay)$/i.test(String(text).trim());
}

async function multiStaffContext(phone, appointmentId, db = pool) {
  const result = await db.query(`
    SELECT a.id, a.starts_at, a.ends_at, a.status,
           COALESCE((SELECT string_agg(service_name_snapshot,' + ' ORDER BY position) FROM appointment_services WHERE appointment_id=a.id),a.title,'Appointment') AS service_name,
           COALESCE((SELECT string_agg(staff_name_snapshot,' + ' ORDER BY position) FROM appointment_staff WHERE appointment_id=a.id),'Shiloh practitioner') AS staff_name,
           (SELECT COUNT(*)::integer FROM appointment_staff WHERE appointment_id=a.id AND staff_id IS NOT NULL) AS staff_count
      FROM appointments a
     WHERE a.id=$1
       AND EXISTS (
         SELECT 1
           FROM client_contacts cc
          WHERE cc.client_id=a.client_id
            AND cc.contact_type IN ('whatsapp','mobile','phone')
            AND cc.normalized_value=$2
       )
     LIMIT 1
  `, [Number(appointmentId), normalizePhone(phone)]);
  return result.rows[0] || null;
}

async function syncMultiStaffCancellation(appointmentId, staffNames) {
  if (!calendarEnabled()) return { enabled: false, status: 'disabled', practitionerResults: [] };
  let eventId = null;
  try {
    const mapping = await pool.query(`SELECT event_id FROM appointment_calendar_events WHERE appointment_id=$1 AND provider='google_calendar' LIMIT 1`, [appointmentId]);
    eventId = mapping.rows[0]?.event_id || null;
    if (!eventId) eventId = (await findBookingEventByAppointmentId(appointmentId))?.id || null;
    if (eventId) {
      await cancelBookingEvent(eventId);
      await pool.query(`UPDATE appointment_calendar_events SET sync_status='cancelled',last_error=NULL,updated_at=NOW() WHERE appointment_id=$1 AND provider='google_calendar'`, [appointmentId]);
    }
    const practitionerResults = await cancelPractitionerBookingEvents({ appointmentId, staffNames });
    return { enabled: true, status: eventId ? 'cancelled' : 'no_event', eventId, practitionerResults };
  } catch (error) {
    logger.error({ err: error, appointmentId }, 'Client multi-staff cancellation Google Calendar sync failed');
    try {
      await pool.query(`UPDATE appointment_calendar_events SET sync_status='error',last_error=$2,updated_at=NOW() WHERE appointment_id=$1 AND provider='google_calendar'`, [appointmentId, String(error.message || error).slice(0, 2000)]);
    } catch (_) {}
    return { enabled: true, status: 'error', error: error.message, practitionerResults: [] };
  }
}

async function cancelMultiStaffAppointment(phone, appointmentId) {
  const db = await pool.connect();
  let context = null;
  let assignedStaff = [];
  try {
    await db.query('BEGIN');
    context = await multiStaffContext(phone, appointmentId, db);
    if (!context) {
      await db.query('ROLLBACK');
      return { status: 'not_found' };
    }
    if (Number(context.staff_count) <= 1) {
      await db.query('ROLLBACK');
      return { status: 'single_staff', context };
    }

    const locked = await db.query('SELECT status FROM appointments WHERE id=$1 FOR UPDATE', [appointmentId]);
    if (!locked.rows[0] || locked.rows[0].status === 'cancelled') {
      await db.query('ROLLBACK');
      return { status: 'already_cancelled', context };
    }

    const staffResult = await db.query(`
      SELECT staff_id, staff_name_snapshot
        FROM appointment_staff
       WHERE appointment_id=$1 AND staff_id IS NOT NULL
       ORDER BY staff_id, position
    `, [appointmentId]);
    assignedStaff = staffResult.rows.map((row) => ({ staffId: Number(row.staff_id), staffName: row.staff_name_snapshot }));
    if (assignedStaff.length <= 1) {
      await db.query('ROLLBACK');
      return { status: 'single_staff', context };
    }
    for (const staff of assignedStaff) await db.query('SELECT pg_advisory_xact_lock($1::bigint)', [staff.staffId]);

    const recheck = await db.query('SELECT status FROM appointments WHERE id=$1 FOR UPDATE', [appointmentId]);
    if (!recheck.rows[0] || recheck.rows[0].status === 'cancelled') {
      await db.query('ROLLBACK');
      return { status: 'conflict', context };
    }

    await db.query(`UPDATE appointments SET status='cancelled',updated_at=NOW() WHERE id=$1`, [appointmentId]);
    await db.query(`UPDATE appointment_lifecycle SET status='cancelled',updated_at=NOW() WHERE appointment_id=$1`, [appointmentId]);
    await db.query(`
      INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
      VALUES($1,$2,'cancelled',$3,'Client cancellation confirmed in WhatsApp; all assigned practitioners locked')
    `, [appointmentId, recheck.rows[0].status, `client:${normalizePhone(phone)}`]);
    await db.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES('client.appointment_cancelled','appointment',$1,$2::jsonb)
    `, [appointmentId, JSON.stringify({
      phone: normalizePhone(phone),
      multiStaffSafe: true,
      lockedStaffIds: assignedStaff.map((staff) => staff.staffId),
    })]);
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  const calendarSync = await syncMultiStaffCancellation(appointmentId, assignedStaff.map((staff) => staff.staffName));
  return { status: 'cancelled', context, calendarSync };
}

appointmentChange.processAppointmentChangeMessage = async function processAppointmentChangeMessageWithMultiStaffSafety(phone, text) {
  if (isConfirmation(text)) {
    const intent = await appointmentChange.getIntent(phone);
    if (intent?.action === 'cancel' && intent?.status === 'awaiting_confirmation' && intent?.appointment_id) {
      const context = await multiStaffContext(phone, intent.appointment_id);
      if (context && Number(context.staff_count) > 1) {
        const result = await cancelMultiStaffAppointment(phone, intent.appointment_id);
        await appointmentChange.clearIntent(phone);
        if (result.status === 'cancelled') {
          return { handled: true, interactive: appointmentChange.cancellationSuccessInteractive(result.context), multiStaffCancellation: true };
        }
        return { handled: true, reply: 'That appointment was already cancelled or changed. No duplicate cancellation was made.' };
      }
    }
  }
  return originalProcessAppointmentChangeMessage(phone, text);
};

module.exports = {
  isConfirmation,
  multiStaffContext,
  cancelMultiStaffAppointment,
  syncMultiStaffCancellation,
};
