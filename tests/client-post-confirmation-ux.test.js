const test = require('node:test');
const assert = require('node:assert/strict');

const {
  commandForClientBookingButton,
  postConfirmationButtons,
} = require('../src/services/clientBookingInteractive');
const {
  isMyAppointmentsIntent,
  appointmentsReply,
} = require('../src/services/customerCare');

test('post-confirmation buttons map to canonical client commands', () => {
  assert.equal(commandForClientBookingButton('client_postbook_book_another'), 'booking');
  assert.equal(commandForClientBookingButton('client_postbook_my_appointments'), 'my appointments');
  assert.equal(commandForClientBookingButton('client_postbook_main_menu'), 'main menu');
  assert.deepEqual(postConfirmationButtons(), [
    { id: 'client_postbook_book_another', title: 'Book another' },
    { id: 'client_postbook_my_appointments', title: 'My appointments' },
    { id: 'client_postbook_main_menu', title: 'Main menu' },
  ]);
});

test('natural-language appointment lookup equivalents are recognized', () => {
  for (const text of [
    'my appointments',
    'My bookings',
    'show my appointments',
    'what appointments do I have',
    'when is my next appointment',
    'upcoming bookings',
  ]) {
    assert.equal(isMyAppointmentsIntent(text), true, text);
  }
  assert.equal(isMyAppointmentsIntent('book another treatment'), false);
});

test('appointments reply preserves authoritative appointment state and next actions', () => {
  const reply = appointmentsReply(
    { display_name: 'Test Client' },
    [{
      service_name: 'Swedish Massage',
      staff_name: 'Christel',
      starts_at: '2026-08-20T08:00:00.000Z',
      ends_at: '2026-08-20T09:00:00.000Z',
      status: 'confirmed',
    }]
  );
  assert.match(reply, /Swedish Massage/);
  assert.match(reply, /Christel/);
  assert.match(reply, /Status: Confirmed/);
  assert.match(reply, /RESCHEDULE/);
  assert.match(reply, /BOOK ANOTHER TREATMENT/);
  assert.match(reply, /MAIN MENU/);
});

test('empty appointment list is explicit and offers safe navigation', () => {
  const reply = appointmentsReply({ display_name: 'Test Client' }, []);
  assert.match(reply, /don't currently have any upcoming scheduled or confirmed appointments/);
  assert.match(reply, /BOOK ANOTHER TREATMENT/);
  assert.match(reply, /MAIN MENU/);
});
