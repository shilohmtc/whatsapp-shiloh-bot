const { pool } = require('../db/pool');
const { displayDate } = require('./bookingIntent');

const TZ = 'Africa/Johannesburg';

function fmtTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function fmtDate(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

async function appointmentTemplateContext(phone, appointmentId) {
  if (!appointmentId) return null;
  const normalized = String(phone || '').replace(/[^0-9]/g, '');
  const result = await pool.query(`
    SELECT a.id, a.starts_at,
           COALESCE(c.display_name, a.source_client_name, 'there') AS client_name,
           COALESCE((SELECT string_agg(service_name_snapshot, ' + ' ORDER BY position)
                     FROM appointment_services WHERE appointment_id=a.id), a.title, 'Shiloh appointment') AS service_name,
           COALESCE((SELECT string_agg(staff_name_snapshot, ' + ' ORDER BY position)
                     FROM appointment_staff WHERE appointment_id=a.id), 'Shiloh practitioner') AS staff_name
      FROM appointments a
      LEFT JOIN clients c ON c.id=a.client_id
      LEFT JOIN client_contacts cc ON cc.client_id=c.id
     WHERE a.id=$2
       AND (cc.normalized_value=$1 OR a.client_id IS NULL)
     ORDER BY cc.is_primary DESC NULLS LAST, cc.id
     LIMIT 1`, [normalized, Number(appointmentId)]);
  return result.rows[0] || null;
}

async function decorateAppointmentChangeTemplate(phone, priorIntent, result) {
  if (!result?.handled || !priorIntent?.appointment_id || typeof result.reply !== 'string') return result;
  const context = await appointmentTemplateContext(phone, priorIntent.appointment_id);
  if (!context) return result;

  if (result.reply.includes('Your appointment has been cancelled')) {
    const templateName = process.env.WHATSAPP_CANCELLATION_CONFIRMATION_TEMPLATE;
    if (!templateName) return result;
    return {
      ...result,
      template: {
        name: templateName,
        bodyParameters: [
          context.client_name || 'there',
          context.service_name,
          fmtDate(context.starts_at),
          fmtTime(context.starts_at),
          String(context.id),
        ],
      },
    };
  }

  if (result.reply.includes('Your appointment has been rescheduled') || result.reply.includes('Appointment rescheduled')) {
    const templateName = process.env.WHATSAPP_RESCHEDULE_CONFIRMATION_TEMPLATE;
    if (!templateName) return result;
    const preferredDate = priorIntent.preferred_date || null;
    const dateText = preferredDate ? displayDate(preferredDate) : fmtDate(context.starts_at);
    return {
      ...result,
      template: {
        name: templateName,
        bodyParameters: [
          context.client_name || 'there',
          context.service_name,
          context.staff_name,
          dateText,
          fmtTime(context.starts_at),
        ],
      },
    };
  }

  return result;
}

module.exports = {
  appointmentTemplateContext,
  decorateAppointmentChangeTemplate,
  fmtDate,
  fmtTime,
};
