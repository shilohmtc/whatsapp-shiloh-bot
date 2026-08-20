const { pool } = require('../db/pool');
const appointmentChange = require('../services/appointmentChange');
const clientRescheduleApproval = require('../services/clientRescheduleApproval');

const START_GUARD_SECONDS = 60;

function normalizePhone(value = '') {
  return String(value || '').replace(/\D/g, '');
}

function blockedReply(state = 'started') {
  return state === 'starting'
    ? 'This appointment is starting now, so it can no longer be rescheduled through WhatsApp self-service. Please contact the clinic team if you need help. Your appointment has not been changed.'
    : 'This appointment has already started, so it can no longer be rescheduled through WhatsApp self-service. Please contact the clinic team if you need help. Your appointment has not been changed.';
}

async function ownedAppointmentStartState(phone, appointmentId, db = pool) {
  if (!appointmentId) return null;
  const result = await db.query(`
    SELECT a.id,a.starts_at,a.ends_at,a.status,
           CASE
             WHEN a.starts_at <= NOW() THEN 'started'
             WHEN a.starts_at <= NOW() + INTERVAL '1 minute' THEN 'starting'
             ELSE 'future'
           END AS start_state
      FROM appointments a
      JOIN clients c ON c.id=a.client_id
      JOIN client_contacts cc ON cc.client_id=c.id
     WHERE a.id=$2
       AND cc.normalized_value=$1
       AND LOWER(cc.contact_type) IN ('whatsapp','mobile','phone','telephone')
       AND a.status<>'cancelled'
     ORDER BY cc.is_primary DESC,cc.id
     LIMIT 1
  `, [normalizePhone(phone), Number(appointmentId)]);
  return result.rows[0] || null;
}

async function blockStartedIntent(phone, intent) {
  if (intent?.action !== 'reschedule' || !intent?.appointment_id) return null;
  const appointment = await ownedAppointmentStartState(phone, intent.appointment_id);
  if (!appointment || appointment.start_state === 'future') return null;
  await appointmentChange.clearIntent(phone);
  return {
    handled: true,
    status: 'appointment_started',
    reply: blockedReply(appointment.start_state),
  };
}

const originalProcessAppointmentChangeMessage = appointmentChange.processAppointmentChangeMessage;
appointmentChange.processAppointmentChangeMessage = async function startBoundaryGuardedAppointmentChange(phone, text, ...rest) {
  const priorIntent = await appointmentChange.getIntent(phone);
  const priorBlocked = await blockStartedIntent(phone, priorIntent);
  if (priorBlocked) return priorBlocked;

  const result = await originalProcessAppointmentChangeMessage(phone, text, ...rest);

  const nextIntent = await appointmentChange.getIntent(phone);
  const nextBlocked = await blockStartedIntent(phone, nextIntent);
  if (nextBlocked) return nextBlocked;
  return result;
};

const originalCreatePendingRescheduleRequest = clientRescheduleApproval.createPendingRescheduleRequest;
clientRescheduleApproval.createPendingRescheduleRequest = async function startBoundaryGuardedPendingReschedule(phone, intent, ...rest) {
  if (intent?.appointment_id) {
    const appointment = await ownedAppointmentStartState(phone, intent.appointment_id);
    if (appointment && appointment.start_state !== 'future') {
      return {
        status: 'appointment_started',
        reply: blockedReply(appointment.start_state),
      };
    }
  }
  return originalCreatePendingRescheduleRequest(phone, intent, ...rest);
};

module.exports = {
  START_GUARD_SECONDS,
  normalizePhone,
  blockedReply,
  ownedAppointmentStartState,
  blockStartedIntent,
};
