const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('policy acceptance immediately delegates to the canonical client booking commit', () => {
  const policy = source('src/services/bookingPolicy.js');
  assert.match(policy, /commitAcceptedClientBooking/);
  assert.match(policy, /intent\.status === ["']policy_accepted["']/);
  assert.match(policy, /processAcceptedClientBookingMessage\(phone, text\)/);
  assert.match(policy, /recordAcceptance\(phone\)[\s\S]*finalizeAcceptedBooking\(phone\)/);
});

test('canonical client booking can only consume an explicitly policy-accepted intent', () => {
  const commit = source('src/services/clientBookingCommit.js');
  assert.match(commit, /initialIntent\.status !== 'policy_accepted'/);
  assert.match(commit, /WHERE phone = \$1[\s\S]*AND status = 'policy_accepted'[\s\S]*FOR UPDATE/);
  assert.match(commit, /policy_version/);
  assert.match(commit, /policy_accepted_at/);
});

test('client booking commit revalidates identity, service eligibility and canonical Shiloh conflicts', () => {
  const commit = source('src/services/clientBookingCommit.js');
  assert.match(commit, /resolveWhatsAppBookingIdentity/);
  assert.match(commit, /bookingProfileComplete/);
  assert.match(commit, /resolveFinalBookingIdentity/);
  assert.match(commit, /verifyService/);
  assert.match(commit, /staff_services/);
  assert.match(commit, /checkClinicHours/);
  assert.match(commit, /checkAuthoritativeSchedule/);
  assert.match(commit, /getConflicts/);
  assert.doesNotMatch(commit, /googleBookingCalendar|practitionerGoogleCalendar|checkCalendarAvailability/);
  assert.match(commit, /pg_advisory_xact_lock/);
});

test('successful client commit writes canonical snapshots, history and audit then consumes intent', () => {
  const commit = source('src/services/clientBookingCommit.js');
  assert.match(commit, /INSERT INTO appointments/);
  assert.match(commit, /INSERT INTO appointment_services/);
  assert.match(commit, /INSERT INTO appointment_staff/);
  assert.doesNotMatch(commit, /createBookingEvent|createPractitionerBookingEvent|appointment_calendar_events/);
  assert.match(commit, /INSERT INTO appointment_status_history/);
  assert.match(commit, /'client\.booking_created'/);
  assert.match(commit, /DELETE FROM booking_intents WHERE phone = \$1/);
});

test('canonical transaction failure rolls back without external compensation', () => {
  const commit = source('src/services/clientBookingCommit.js');
  assert.match(commit, /ROLLBACK/);
  assert.doesNotMatch(commit, /cancelPractitionerBookingEvent|cancelBookingEvent|calendar compensation/);
});

test('stale slots fail closed to time reselection while transient failures remain explicitly retryable', () => {
  const commit = source('src/services/clientBookingCommit.js');
  assert.match(commit, /resetAcceptedIntentForNewSlot/);
  assert.match(commit, /preferred_time = NULL/);
  assert.match(commit, /status = 'collecting'/);
  assert.match(commit, /RETRY BOOKING/);
  assert.match(commit, /CANCEL BOOKING/);
  assert.match(commit, /commit_failed/);
});

test('client canonical booking source is distinct and never reuses the admin actor contract', () => {
  const commit = source('src/services/clientBookingCommit.js');
  assert.match(commit, /shiloh_client_whatsapp/);
  assert.match(commit, /client:\$\{normalizedPhone\}/);
  assert.doesNotMatch(commit, /admin\.booking_created/);
});
