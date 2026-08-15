const test = require('node:test');
const assert = require('node:assert/strict');

const {
  commandForClientBookingButton,
  postConfirmationButtons,
} = require('../src/services/clientBookingInteractive');
const {
  isMyAppointmentsIntent,
  appointmentsReply,
  appointmentActionButtons,
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

test('appointments reply preserves authoritative appointment state and interactive next actions', () => {
  const rows = [{
    service_name: 'Swedish Massage',
    staff_name: 'Christel',
    starts_at: '2026-08-20T08:00:00.000Z',
    ends_at: '2026-08-20T09:00:00.000Z',
    status: 'confirmed',
  }];
  const reply = appointmentsReply({ display_name: 'Test Client' }, rows);
  assert.match(reply, /Swedish Massage/);
  assert.match(reply, /Christel/);
  assert.match(reply, /Status: Confirmed/);
  assert.match(reply, /Choose an option below/);
  assert.deepEqual(appointmentActionButtons(rows), [
    { id: 'client_reschedule_booking', title: 'Reschedule' },
    { id: 'client_cancel_booking', title: 'Cancel' },
    { id: 'client_postbook_book_another', title: 'Book another' },
  ]);
});

test('empty appointment list is explicit and exposes safe navigation buttons', () => {
  const reply = appointmentsReply({ display_name: 'Test Client' }, []);
  assert.match(reply, /don't currently have any upcoming scheduled or confirmed appointments/);
  assert.deepEqual(appointmentActionButtons([]), [
    { id: 'client_postbook_book_another', title: 'Book another' },
    { id: 'client_postbook_main_menu', title: 'Main menu' },
  ]);
});
