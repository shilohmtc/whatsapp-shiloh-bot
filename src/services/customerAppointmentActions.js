const { pool } = require('../db/pool');
const { sendWhatsAppCtaUrl, sendWhatsAppReplyButtons } = require('./whatsapp');
const { ensureToken, googleCalendarUrl } = require('./customerBookingConfirmation');
const logger = require('../lib/logger');

function baseUrl() {
  return String(process.env.SHILOH_PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
}

async function sendOptional(label, sendAction, context) {
  try {
    await sendAction();
    return true;
  } catch (error) {
    logger.error({ err: error, ...context, action: label }, 'Customer appointment supplemental action failed');
    return false;
  }
}

async function appointmentActionContext(appointmentId, phoneOverride = null) {
  const result = await pool.query(`
    SELECT a.id,a.client_id,a.starts_at,a.ends_at,c.display_name AS client_name,l.name AS location_name,
           COALESCE((SELECT string_agg(service_name_snapshot,' + ' ORDER BY position) FROM appointment_services WHERE appointment_id=a.id),a.title,'Shiloh appointment') AS service_name,
           COALESCE((SELECT string_agg(staff_name_snapshot,' + ' ORDER BY position) FROM appointment_staff WHERE appointment_id=a.id),'Shiloh practitioner') AS staff_name,
           COALESCE($2,(SELECT normalized_value FROM client_contacts WHERE client_id=a.client_id AND contact_type IN ('whatsapp','phone','mobile') AND normalized_value IS NOT NULL ORDER BY is_primary DESC,id LIMIT 1)) AS phone
      FROM appointments a
      JOIN clients c ON c.id=a.client_id
      LEFT JOIN locations l ON l.id=a.location_id
     WHERE a.id=$1 AND a.status<>'cancelled'
     LIMIT 1`, [Number(appointmentId), phoneOverride]);
  return result.rows[0] || null;
}

async function sendCustomerAppointmentActionsForAppointment(appointmentId, phoneOverride = null) {
  const a = await appointmentActionContext(appointmentId, phoneOverride);
  if (!a || !a.phone) return { sent: false, reason: a ? 'no_phone' : 'appointment_not_found' };

  const token = await ensureToken(a.id);
  const root = baseUrl();
  const ics = root ? `${root}/calendar/${token}.ics` : '';
  const google = googleCalendarUrl({
    serviceName: a.service_name,
    staffName: a.staff_name,
    locationName: a.location_name,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
  });
  const context = { appointmentId: a.id, clientId: a.client_id };
  const actions = {
    googleCalendar: await sendOptional('google_calendar', () => sendWhatsAppCtaUrl(a.phone, 'Add to Google Calendar', 'Google Calendar', google), context),
    appleOutlook: false,
    changeButtons: false,
  };
  if (ics) {
    actions.appleOutlook = await sendOptional('apple_outlook_calendar', () => sendWhatsAppCtaUrl(a.phone, 'Add to Apple / Outlook', 'Apple / Outlook', ics), context);
  }
  actions.changeButtons = await sendOptional('booking_change_buttons', () => sendWhatsAppReplyButtons(a.phone, '*Need to make a change?*\nUse a button below, or type *RESCHEDULE* or *CANCEL*.', [
    { id: 'client_reschedule_booking', title: 'Reschedule' },
    { id: 'client_cancel_booking', title: 'Cancel booking' },
  ]), context);
  return { sent: true, appointmentId: a.id, actions };
}

module.exports = { appointmentActionContext, sendCustomerAppointmentActionsForAppointment };
