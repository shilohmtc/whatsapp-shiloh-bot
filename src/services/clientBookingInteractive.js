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

function dateInteractive(intent) {
  return {
    type: 'button',
    body: [
      `*${intent.service_text}*`,
      intent.therapist_text ? `Practitioner: ${intent.therapist_text}` : null,
      '',
      'What day would you prefer?',
      'Choose a quick option below, or type another day/date such as *next Friday* or *21 August*.',
    ].filter((line) => line !== null).join('\n'),
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
      intent.therapist_text ? `Practitioner: ${intent.therapist_text}` : null,
      '',
      'What time of day would you prefer?',
      'Choose below, or type an exact time such as *14:00* or *2pm*.',
    ].filter((line) => line !== null).join('\n'),
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
      `Date: ${displayDate(intent.preferred_date)}`,
      `Time: ${intent.preferred_time}`,
      `Practitioner: ${intent.therapist_text || 'Any available practitioner'}`,
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

  if (
    intent.status === 'collecting' &&
    intent.service_text &&
    intent.service_verified !== false &&
    !intent.preferred_date
  ) {
    return { ...result, interactive: dateInteractive(intent) };
  }

  if (
    intent.status === 'collecting' &&
    intent.service_text &&
    intent.service_verified !== false &&
    intent.preferred_date &&
    !intent.preferred_time
  ) {
    return { ...result, interactive: timeInteractive(intent) };
  }

  if (intent.status === 'awaiting_confirmation') {
    return { ...result, interactive: confirmationInteractive(intent) };
  }

  return result;
}

module.exports = {
  CLIENT_BOOKING_BUTTON_COMMANDS,
  commandForClientBookingButton,
  dateInteractive,
  timeInteractive,
  confirmationInteractive,
  decorateClientBookingResult,
};
