const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('calendar uncertainty cleanup is deterministic', () => {
  const commit = read('src/services/clientBookingCommit.js');
  const shared = read('src/services/googleBookingCalendar.js');
  const practitioner = read('src/services/practitionerGoogleCalendar.js');

  assert.ok(shared.includes('function eventIdForAppointment(appointmentId)'));
  assert.ok(shared.includes('eventIdForAppointment(appointmentId)'));
  assert.ok(practitioner.includes('eventIdForAppointment'));
  assert.ok(commit.includes('sharedCalendarCreateAttempted = true'));
  assert.ok(commit.includes('practitionerCalendarCreateAttempted = true'));
  assert.ok(commit.includes('eventIdForAppointment(attemptedAppointmentId)'));
});
