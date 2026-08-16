const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'services', 'adminBookingUpdate.js'), 'utf8');
const finalization = fs.readFileSync(path.join(root, 'src', 'services', 'adminAppointmentFinalization.js'), 'utf8');

test('manage booking exposes button-first guarded change actions', () => {
  assert.match(source, /type: 'list'/);
  assert.match(source, /id: 'manage_change_service'/);
  assert.match(source, /id: 'manage_change_practitioner'/);
  assert.match(source, /id: 'manage_change_time'/);
  assert.match(source, /id: 'manage_change_price'/);
});

test('date/time change offers open clinic dates before asking for free text', () => {
  assert.match(source, /getNextOpenClinicDates/);
  assert.match(source, /manage_reschedule_date_/);
  assert.match(source, /manage_reschedule_other/);
  assert.match(source, /Shiloh will show only slots that are currently bookable/);
});

test('reschedule slots use authoritative availability and exclude the appointment being moved', () => {
  assert.match(source, /listAvailableSlots/);
  assert.match(source, /excludeAppointmentId: a\.id/);
  assert.match(source, /ignoreEventId: a\.event_id \|\| null/);
  assert.match(source, /intervalMinutes: 15/);
});

test('selected slot is revalidated before canonical appointment mutation', () => {
  const recheck = source.indexOf('validateWindow(a, st.staff_id');
  const update = source.indexOf('UPDATE appointments SET starts_at=$1,ends_at=$2');
  assert.ok(recheck >= 0 && update >= 0);
  assert.ok(recheck < update);
  assert.match(source, /No change was saved\. Choose another available time/);
});

test('successful reschedule synchronizes Google Calendar and writes an audit event', () => {
  assert.match(source, /await syncCalendar\(after\)/);
  assert.match(source, /appointment\.time_updated/);
  assert.match(source, /authoritativeSlotFlow: true/);
});

test('past-visit Reschedule reuses the same guarded manage-booking state machine', () => {
  assert.match(finalization, /processAdminBookingUpdateMessage/);
  assert.match(finalization, /startPastVisitReschedule/);
  assert.match(finalization, /return processAdminBookingUpdateMessage\(sender, '3'\)/);
});

test('multi-resource bookings fail safely to guarded manual entry rather than guessing slots', () => {
  assert.match(source, /multiple resources/);
  assert.match(source, /manage_reschedule_manual/);
  assert.match(source, /fully re-checked before any change is saved/);
});
