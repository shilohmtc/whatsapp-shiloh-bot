const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { reconcilePendingCalendarWrites } = require('../src/services/clientBookingCalendarRecovery');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function fakeDb({ canonicalAppointmentExists = false } = {}) {
  const queries = [];
  return {
    queries,
    async query(sql, params = []) {
      queries.push({ sql, params });
      if (sql.includes('SELECT id, provider, calendar_id')) return { rowCount: 1, rows: [{ id: 7, provider: 'shared_google', calendar_id: 'calendar-a', event_id: 'event-a', appointment_id: 41 }] };
      if (sql.includes('SELECT 1 FROM appointments')) return { rowCount: canonicalAppointmentExists ? 1 : 0, rows: canonicalAppointmentExists ? [{ value: 1 }] : [] };
      return { rowCount: 1, rows: [] };
    },
  };
}

test('rolled-back provider attempt is deleted before a later calendar write can proceed', async () => {
  const db = fakeDb();
  const cancelled = [];
  const result = await reconcilePendingCalendarWrites({ provider: 'shared_google', currentAppointmentId: 42, db, cancelEvent: async (eventId, calendarId) => cancelled.push({ eventId, calendarId }) });
  assert.deepEqual(cancelled, [{ eventId: 'event-a', calendarId: 'calendar-a' }]);
  assert.equal(result.reconciled, 1);
  assert.ok(db.queries.some((entry) => entry.params[1] === 'rolled_back_attempt_cleaned'));
});

test('provider cleanup uncertainty fails closed and leaves the attempt unresolved', async () => {
  const db = fakeDb();
  await assert.rejects(reconcilePendingCalendarWrites({ provider: 'shared_google', currentAppointmentId: 42, db, cancelEvent: async () => { throw new Error('network uncertain'); } }), (error) => error.code === 'CALENDAR_RECONCILIATION_PENDING');
  assert.ok(db.queries.some((entry) => entry.sql.includes('SET last_error = $2')));
  assert.ok(!db.queries.some((entry) => entry.params[1] === 'rolled_back_attempt_cleaned'));
});

test('a committed canonical appointment is never deleted during recovery', async () => {
  const db = fakeDb({ canonicalAppointmentExists: true });
  let cancelCalls = 0;
  const result = await reconcilePendingCalendarWrites({ provider: 'shared_google', currentAppointmentId: 42, db, cancelEvent: async () => { cancelCalls += 1; } });
  assert.equal(cancelCalls, 0);
  assert.equal(result.reconciled, 1);
  assert.ok(db.queries.some((entry) => entry.params[1] === 'canonical_appointment_exists'));
});

test('both creation wrappers use durable recovery before provider create', () => {
  const shared = read('src/services/googleBookingCalendar.js');
  const practitioner = read('src/services/practitionerGoogleCalendar.js');
  const migration = read('migrations/049_client_booking_calendar_write_recovery.sql');
  assert.ok(shared.includes('prepareCalendarWrite'));
  assert.ok(shared.includes('shared_google'));
  assert.ok(shared.includes('return createBookingEventOnCalendar(calendarId,data)'));
  assert.ok(practitioner.includes('practitioner_google'));
  assert.ok(practitioner.includes('prepareCalendarWrite'));
  assert.ok(migration.includes('client_booking_calendar_write_attempts'));
  assert.ok(migration.includes('appointment_id intentionally has no foreign key'));
});
