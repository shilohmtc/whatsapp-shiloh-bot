const { displayDate } = require('./bookingIntent');

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
    '• Abigail — Massage practitioner',
    '• Marietjie — Esthetician',
  ];
}

function bookingDiscoveryInteractive() {
  return {
    type: 'button',
    body: [
      '*Book at Shiloh 🌿*',
      '',
      ...treatmentTeamLines(),
      '',
      'Choose a treatment first to see only the practitioners who currently offer it, or choose a practitioner first to see only their active CRM-mapped services.',
    ].join('\n'),
    buttons: [
      { id: 'client_browse_services', title: 'Choose treatment' },
      { id: 'client_practitioners', title: 'Choose practitioner' },
    ],
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
      `Date: ${displayDate(intent.preferred_date)}`,
      `Practitioner: ${intent.therapist_text}`,
      '',
      'What time of day would you prefer?',
      'Choose below, or type an exact time such as *14:00* or *2pm*.',
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
      '*Please check your booking preferences*',
      `Service: ${intent.service_text}`,
      `Practitioner: ${intent.therapist_text}`,
      `Date: ${displayDate(intent.preferred_date)}`,
      `Time: ${intent.preferred_time}`,
      '',
      'Nothing is booked yet. Confirm these details to continue to Shiloh’s Booking Policy & Terms, or change/cancel the request.',
    ].join('\n'),
    buttons: [
      { id: 'client_booking_confirm', title: 'Confirm details' },
      { id: 'client_booking_change', title: 'Change details' },
      { id: 'client_booking_cancel', title: 'Cancel request' },
    ],
  };
}

function decorateClientBookingResult(result) {
  if (!result?.handled || !result.intent) return result;
  const intent = result.intent;

  if (intent.status === 'collecting' && !intent.service_text) {
    return { ...result, interactive: bookingDiscoveryInteractive() };
  }

  if (
    ['collecting', 'awaiting_confirmation'].includes(intent.status) &&
    intent.service_text &&
    intent.service_verified !== false &&
    !intent.therapist_text
  ) {
    return { ...result, interactive: practitionerRequiredInteractive(intent) };
  }

  if (
    intent.status === 'collecting' &&
    intent.service_text &&
    intent.service_verified !== false &&
    intent.therapist_text &&
    !intent.preferred_date
  ) {
    return { ...result, interactive: dateInteractive(intent) };
  }

  if (
    intent.status === 'collecting' &&
    intent.service_text &&
    intent.service_verified !== false &&
    intent.therapist_text &&
    intent.preferred_date &&
    !intent.preferred_time
  ) {
    return { ...result, interactive: timeInteractive(intent) };
  }

  if (intent.status === 'awaiting_confirmation' && intent.therapist_text) {
    return { ...result, interactive: confirmationInteractive(intent) };
  }

  return result;
}

module.exports = {
  CLIENT_BOOKING_BUTTON_COMMANDS,
  bookingDiscoveryInteractive,
  commandForClientBookingButton,
  dateInteractive,
  timeInteractive,
  confirmationInteractive,
  decorateClientBookingResult,
  practitionerRequiredInteractive,
  treatmentTeamLines,
};
