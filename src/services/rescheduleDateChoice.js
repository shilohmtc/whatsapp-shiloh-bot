const { displayDate } = require('./bookingIntent');
const { getNextOpenClinicDates } = require('./clinicDateChoices');

const TZ = 'Africa/Johannesburg';

function fmtDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TZ,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function summary(appointment) {
  return [
    `*${appointment.service_name}*`,
    `📅 ${fmtDateTime(appointment.starts_at)}`,
    `👤 ${appointment.staff_name}`,
    `Booking #${appointment.id}`,
  ].join('\n');
}

async function rescheduleDateChoice(appointment, message = null) {
  const openDates = await getNextOpenClinicDates({
    locationId: appointment?.location_id ? Number(appointment.location_id) : null,
    count: 2,
  });

  const buttons = openDates.map((choice) => ({
    id: `reschedule_date_${choice.date}`,
    title: choice.title.slice(0, 20),
  }));
  buttons.push({ id: 'reschedule_date_other', title: 'Choose another date' });

  const body = [
    appointment ? summary(appointment) : null,
    message,
    'What new day or date would you prefer?',
    '',
    'Choose an open clinic day below, or type another date such as Friday or 21 August.',
  ].filter(Boolean).join('\n');

  return {
    handled: true,
    interactive: {
      type: 'button',
      body,
      buttons: buttons.slice(0, 3),
    },
  };
}

function closedDateMessage(date, status = {}) {
  const reason = status.holidayName ? ` (${status.holidayName})` : '';
  return `Shiloh is closed on ${displayDate(date)}${reason}. Your current appointment is unchanged. Please choose another date.`;
}

module.exports = { closedDateMessage, rescheduleDateChoice };
