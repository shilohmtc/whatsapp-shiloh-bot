const test = require('node:test');
const assert = require('node:assert/strict');

const { appointmentChoiceInteractive } = require('../src/services/appointmentChange');

const rows = [
  { id: 564, starts_at: '2026-08-15T08:45:00.000Z', service_name: 'Medi-Heel Pedicure (With Gel Toes) & Foot Massage', staff_name: 'Christel' },
  { id: 565, starts_at: '2026-08-15T10:30:00.000Z', service_name: 'Medi-Heel Pedicure (With Gel Toes) & Foot Massage', staff_name: 'Christel' },
];

test('multiple reschedule choices render deterministic booking buttons', () => {
  const view = appointmentChoiceInteractive(rows, 'reschedule', 1);
  assert.equal(view.type, 'button');
  assert.match(view.body, /Which booking would you like to reschedule\?/);
  assert.match(view.body, /Booking #564/);
  assert.match(view.body, /Booking #565/);
  assert.deepEqual(view.buttons.map((button) => button.id), [
    'client_change_reschedule_564',
    'client_change_reschedule_565',
  ]);
  assert.deepEqual(view.buttons.map((button) => button.title), ['10:45 · #564', '12:30 · #565']);
  assert.match(view.body, /Your other bookings will remain unchanged\./);
});

test('cancel uses the same deterministic appointment-selection UX', () => {
  const view = appointmentChoiceInteractive(rows, 'cancel', 1);
  assert.equal(view.type, 'button');
  assert.match(view.body, /Which booking would you like to cancel\?/);
  assert.deepEqual(view.buttons.map((button) => button.id), [
    'client_change_cancel_564',
    'client_change_cancel_565',
  ]);
});

test('more than three appointments render a paginated list instead of omitting choices', () => {
  const many = Array.from({ length: 10 }, (_, index) => ({
    id: 600 + index,
    starts_at: new Date(Date.parse('2026-08-16T08:00:00.000Z') + index * 3600000).toISOString(),
    service_name: `Treatment ${index + 1}`,
    staff_name: 'Christel',
  }));
  const first = appointmentChoiceInteractive(many, 'reschedule', 1);
  assert.equal(first.type, 'list');
  assert.equal(first.rows.length, 9);
  assert.equal(first.rows.at(-1).id, 'client_change_reschedule_page_2');
  const second = appointmentChoiceInteractive(many, 'reschedule', 2);
  assert.equal(second.type, 'list');
  assert.ok(second.rows.length <= 10);
  assert.equal(second.rows.at(-1).id, 'client_change_reschedule_page_1');
});
