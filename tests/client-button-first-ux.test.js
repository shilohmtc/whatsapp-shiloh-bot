const test = require('node:test');
const assert = require('node:assert/strict');
const { appointmentActionButtons, appointmentsReply } = require('../src/services/customerCare');

test('empty My appointments result exposes interactive navigation', () => {
  assert.deepEqual(appointmentActionButtons([]), [
    { id: 'client_postbook_book_another', title: 'Book another' },
    { id: 'client_postbook_main_menu', title: 'Main menu' },
  ]);
});

test('upcoming appointments expose the three highest-value interactive actions', () => {
  const rows = [{ id: 1 }];
  assert.deepEqual(appointmentActionButtons(rows), [
    { id: 'client_reschedule_booking', title: 'Reschedule' },
    { id: 'client_cancel_booking', title: 'Cancel' },
    { id: 'client_postbook_book_another', title: 'Book another' },
  ]);
});

test('appointments copy no longer relies on memorized commands for primary actions', () => {
  const empty = appointmentsReply({ display_name: 'Dummy Test' }, []);
  assert.doesNotMatch(empty, /send \*BOOK/i);
  assert.doesNotMatch(empty, /send \*MAIN MENU/i);
  const populated = appointmentsReply({ display_name: 'Dummy Test' }, [{
    service_name: 'Massage', staff_name: 'Christel', starts_at: '2026-08-20T08:00:00.000Z', status: 'confirmed',
  }]);
  assert.doesNotMatch(populated, /send \*RESCHEDULE/i);
  assert.doesNotMatch(populated, /send \*CANCEL/i);
});
