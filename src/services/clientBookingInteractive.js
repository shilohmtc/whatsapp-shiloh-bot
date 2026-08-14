const { displayDate } = require('./bookingIntent');
const { CLIENT_COPY } = require('../config/clientCopy');

const CLIENT_BOOKING_BUTTON_COMMANDS = Object.freeze({
  client_date_today: 'today',
  client_date_tomorrow: 'tomorrow',
  client_time_morning: 'morning',
  client_time_afternoon: 'afternoon',
  client_time_evening: 'evening',
  client_booking_confirm: 'yes',
  client_booking_change: 'change',
  client_booking_cancel: 'cancel',
});

function commandForClientBookingButton(id = '') {
  return CLIENT_BOOKING_BUTTON_COMMANDS[String(id || '').trim()] || null;
}

function treatmentTeamLines() {
  return [
    'Shiloh’s client-facing treatment team:',
    '• Christel — Massage practitioner',
    '• Abigail — Massage & Lymphatic Drainage practitioner',
    '• Marietjie — Beauty & Aesthetics practitioner',
  ];
}

function bookingDiscoveryInteractive() {
  return {
    type: 'list',
    body: [
      '*What would you like to book? 🌿*',
      '',
      CLIENT_COPY.bookingDiscoveryPrompt,
    ].join('\n'),
    buttonText: 'Choose service',
    rows: [
      { id: 'client_family_beauty', title: 'Beauty & Aesthetics', description: 'View beauty & aesthetics treatments' },
      { id: 'client_family_massage', title: 'Massage Treatments', description: 'View massage treatments' },
      { id: 'client_family_lymphatic', title: 'Lymphatic Drainage', description: 'View lymphatic drainage treatments' },
      { id: 'client_family_pedicure', title: 'Elim MediHeel Pedicures', description: 'View pedicure treatments' },
    ],
    sectionTitle: 'Shiloh treatments',
  };
}

function practitionerRequiredInteractive(intent) {
  return {
    type: 'button',
    body: [
      `*${intent.service_text}*`,
      '',
      'Please choose your practitioner preference before choosing a date.',
      ...treatmentTeamLines(),
      '',
      'Use *Choose treatment* to reopen this treatment and see only the practitioners currently eligible for it, including an explicit *Any available* option. Or choose a practitioner first to see only their mapped services.',
      '',
      'Shiloh will not silently treat a missing practitioner choice as “Any available”.',
    ].join('\n'),
    buttons: [
      { id: 'client_browse_services', title: 'Choose treatment' },
      { id: 'client_practitioners', title: 'Choose practitioner' },
    ],
  };
}

function dateInteractive(intent) {
  return {
    type: 'button',
    body: [
      `*${intent.service_text}*`,
      `Practitioner: ${intent.therapist_text}`,
      '',
      'What day would you prefer?',
      'Choose a quick option below, or type another day/date such as *next Friday* or *21 August*.',
    ].join('\n'),
    buttons: [
      { id: 'client_date_today', title: 'Today' },
      { id: 'client_date_tomorrow', title: 'Tomorrow' },
    ],
  };
}

function timeInteractive(intent) {
  return {
    type: 'button',
    body: [
      `*${intent.service_text}*`,
      `Practitioner: ${intent.therapist_text}`,
      `Date: ${displayDate(intent.preferred_date)}`,
      '',
      'What time would you prefer?',
      'Choose a time of day below, or type a specific time such as *10:30* or *2pm*.',
    ].join('\n'),
    buttons: [
      { id: 'client_time_morning', title: 'Morning' },
      { id: 'client_time_afternoon', title: 'Afternoon' },
      { id: 'client_time_evening', title: 'Evening' },
    ],
  };
}

function confirmationInteractive(intent) {
  return {
    type: 'button',
    body: [
      '*Please confirm your booking details*',
      '',
      `Treatment: ${intent.service_text}`,
      `Practitioner: ${intent.therapist_text}`,
      `Date: ${displayDate(intent.preferred_date)}`,
      `Time: ${intent.preferred_time}`,
      '',
      'Would you like me to continue with this booking?',
    ].join('\n'),
    buttons: [
      { id: 'client_booking_confirm', title: 'Yes, continue' },
      { id: 'client_booking_change', title: 'Change details' },
      { id: 'client_booking_cancel', title: 'Cancel' },
    ],
  };
}

function decorateClientBookingResult(result) {
  if (!result?.handled) return result;
  if (result.interactive) return result;
  if (result.reply && /booking policy/i.test(result.reply)) return result;
  const intent = result.intent;
  if (!intent || intent.status !== 'collecting') return result;
  if (!intent.service_text || intent.service_verified === false) return result;
  if (!intent.therapist_text) return { ...result, reply: null, interactive: practitionerRequiredInteractive(intent) };
  if (!intent.preferred_date) return { ...result, reply: null, interactive: dateInteractive(intent) };
  if (!intent.preferred_time) return { ...result, reply: null, interactive: timeInteractive(intent) };
  if (intent.confirmed !== true) return { ...result, reply: null, interactive: confirmationInteractive(intent) };
  return result;
}

module.exports = {
  CLIENT_BOOKING_BUTTON_COMMANDS,
  bookingDiscoveryInteractive,
  commandForClientBookingButton,
  confirmationInteractive,
  dateInteractive,
  decorateClientBookingResult,
  practitionerRequiredInteractive,
  timeInteractive,
  treatmentTeamLines,
};
