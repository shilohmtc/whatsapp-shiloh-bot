const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  DUMMY_TEST_CLIENT_ID,
  CLEANUP_FLAG,
  enabled,
  assertResetIdentity,
  cancelCanonicalAppointments,
  cleanupCalendars,
} = require('../src/services/dummyTestAppointmentCleanup');

const root = path.join(__dirname, '..');

test('Dummy Test booking cleanup is explicit one-shot only', () => {
  assert.equal(DUMMY_TEST_CLIENT_ID, 835);
  assert.equal(CLEANUP_FLAG, 'CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START');
  assert.equal(enabled({}), false);
  assert.equal(enabled({ [CLEANUP_FLAG]: 'false' }), false);
  assert.equal(enabled({ [CLEANUP_FLAG]: 'true' }), true);
});

test('cleanup identity requires exact archived reset CRM #835 with no phone binding', () => {
  assert.doesNotThrow(() => assertResetIdentity({ id: 835, display_name: 'Dummy Test', status: 'inactive', reset_marker: 'true', bound_contact_count: 0 }));
  assert.throws(() => assertResetIdentity({ id: 836, display_name: 'Dummy Test', status: 'inactive', reset_marker: 'true', bound_contact_count: 0 }), /CRM #835 not found/);
  assert.throws(() => assertResetIdentity({ id: 835, display_name: 'Real Client', status: 'inactive', reset_marker: 'true', bound_contact_count: 0 }), /display name drift/);
  assert.throws(() => assertResetIdentity({ id: 835, display_name: 'Dummy Test', status: 'active', reset_marker: 'true', bound_contact_count: 0 }), /not archived\/inactive/);
  assert.throws(() => assertResetIdentity({ id: 835, display_name: 'Dummy Test', status: 'inactive', reset_marker: null, bound_contact_count: 0 }), /reset marker/);
  assert.throws(() => assertResetIdentity({ id: 835, display_name: 'Dummy Test', status: 'inactive', reset_marker: 'true', bound_contact_count: 1 }), /still bound/);
});

test('non-final Dummy Test appointments are cancelled while completed no-show and prior cancellation history are preserved', async () => {
  const calls = [];
  const db = {
    query: async (sql, params = []) => {
      calls.push({ sql, params });
      if (/UPDATE appointments SET status='cancelled'/.test(sql)) return { rowCount: 1, rows: [{ id: params[0], status: 'cancelled' }] };
      return { rowCount: 1, rows: [] };
    },
  };
  const appointments = [
    { id: 582, status: 'confirmed', staff_names: ['Abigail'] },
    { id: 583, status: 'scheduled', staff_names: ['Marietjie'] },
    { id: 500, status: 'unknown', staff_names: ['Christel'] },
    { id: 400, status: 'completed', staff_names: ['Christel'] },
    { id: 401, status: 'no_show', staff_names: ['Abigail'] },
    { id: 402, status: 'cancelled', staff_names: ['Marietjie'] },
  ];
  const result = await cancelCanonicalAppointments(db, appointments);
  assert.deepEqual(result.cancelled.map((item) => item.id), [582, 583, 500]);
  assert.deepEqual(result.preserved, [
    { id: 400, status: 'completed' },
    { id: 401, status: 'no_show' },
    { id: 402, status: 'cancelled' },
  ]);
  assert.deepEqual(result.calendarCandidates.map((item) => item.id), [582, 583, 500, 402]);
  assert.equal(calls.filter((item) => /UPDATE appointments SET status='cancelled'/.test(item.sql)).length, 3);
  assert.equal(calls.filter((item) => /appointment_status_history/.test(item.sql)).length, 3);
  assert.equal(calls.filter((item) => /system\.dummy_test_appointment_cleanup/.test(item.sql)).length, 3);
});

test('calendar cleanup removes shared and practitioner mirrors with deterministic appointment identity', async () => {
  const shared = [];
  const practitioner = [];
  const mappings = [];
  const result = await cleanupCalendars([
    { id: 582, staffNames: ['Abigail'] },
    { id: 583, staffNames: ['Marietjie'] },
  ], {
    calendarEnabled: () => true,
    cancelBookingEvent: async (eventId) => { shared.push(eventId); return { cancelled: true }; },
    cancelPractitionerBookingEvents: async (input) => { practitioner.push(input); return [{ cancelled: true }]; },
    markSharedCalendarMapping: async (...args) => mappings.push(args),
  });
  assert.equal(result.every((item) => item.status === 'cancelled'), true);
  assert.equal(shared.length, 2);
  assert.deepEqual(practitioner, [
    { appointmentId: 582, staffNames: ['Abigail'] },
    { appointmentId: 583, staffNames: ['Marietjie'] },
  ]);
  assert.deepEqual(mappings.map((item) => item.slice(0, 2)), [[582, 'cancelled'], [583, 'cancelled']]);
});

test('cleanup source terminalizes operational state without queuing or sending client messages', () => {
  const source = fs.readFileSync(path.join(root, 'src/services/dummyTestAppointmentCleanup.js'), 'utf8');
  assert.match(source, /appointment_booking_approvals[\s\S]*status='declined'/);
  assert.match(source, /appointment_reschedule_requests[\s\S]*status='superseded'/);
  assert.match(source, /appointment_lifecycle[\s\S]*status='cancelled'/);
  assert.match(source, /customer_change_notifications[\s\S]*status='suppressed'/);
  assert.doesNotMatch(source, /queueCustomerChangeNotification|sendWhatsAppMessage|sendWhatsAppTemplate|sendWhatsAppReplyButtons/);
  assert.match(source, /noClientMessage: true/);
});

test('production startup awaits cleanup before listening and the switch remains default-off', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const cleanup = app.indexOf('await runDummyTestAppointmentCleanup()');
  const listen = app.indexOf('app.listen(PORT');
  assert.ok(cleanup > 0);
  assert.ok(listen > cleanup);
  assert.doesNotMatch(app, /CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START\s*=\s*['"]true/);
});
