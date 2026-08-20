const { sendCustomerCalendarActionsForAppointment } = require('./customerAppointmentActions');

const ACTION_PREFIX = 'booking confirmation v2';

function parseBookingConfirmationV2Action(text = '') {
  const match = String(text || '').trim().match(/^booking confirmation v2 (calendar|manage) (\d+)$/i);
  if (!match) return null;
  const appointmentId = Number(match[2]);
  if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0) return null;
  return { action: match[1].toLowerCase(), appointmentId };
}

function manageBookingInteractive() {
  return {
    type: 'button',
    body: '*Manage booking*\nChoose an option below. Shiloh will re-check the appointment before any change is made.',
    buttons: [
      { id: 'client_reschedule_booking', title: 'Reschedule' },
      { id: 'client_cancel_booking', title: 'Cancel booking' },
      { id: 'client_postbook_my_appointments', title: 'My appointments' },
    ],
  };
}

async function processBookingConfirmationV2Action(phone, text, dependencies = {}) {
  const parsed = parseBookingConfirmationV2Action(text);
  if (!parsed) return { handled: false };

  if (parsed.action === 'manage') {
    return {
      handled: true,
      appointmentId: parsed.appointmentId,
      reply: 'Choose how you would like to manage your booking.',
      interactive: manageBookingInteractive(),
    };
  }

  const sendCalendar = dependencies.sendCalendar || sendCustomerCalendarActionsForAppointment;
  const calendar = await sendCalendar(parsed.appointmentId, phone, { requirePhoneMatch: true });
  if (!calendar?.sent) {
    return {
      handled: true,
      appointmentId: parsed.appointmentId,
      reply: 'I could not safely match that calendar request to your current Shiloh appointment. Open *My appointments* to view your current bookings.',
    };
  }
  return {
    handled: true,
    appointmentId: parsed.appointmentId,
    reply: 'Your calendar options are ready above. 🌿',
  };
}

module.exports = {
  ACTION_PREFIX,
  parseBookingConfirmationV2Action,
  manageBookingInteractive,
  processBookingConfirmationV2Action,
};
