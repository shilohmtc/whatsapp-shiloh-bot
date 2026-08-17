const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'adminBookingChangeConfirmationPatch.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('production preloads review-before-write booking change guard after natural date support', () => {
  assert.match(pkg.scripts.start, /adminBookingNaturalDatePatch\.js/);
  assert.match(pkg.scripts.start, /adminBookingChangeConfirmationPatch\.js/);
  assert.ok(pkg.scripts.start.indexOf('adminBookingNaturalDatePatch.js') < pkg.scripts.start.indexOf('adminBookingChangeConfirmationPatch.js'));
});

test('date/time selection validates authoritative 15-minute availability before confirmation', () => {
  assert.match(source, /listAvailableSlots/);
  assert.match(source, /intervalMinutes:\s*15/);
  assert.match(source, /excludeAppointmentId:\s*context\.id/);
  assert.match(source, /ignoreEventId:\s*context\.event_id/);
  assert.match(source, /\*Confirm date\/time change\*/);
  assert.match(source, /Nothing changes until you confirm/);
  assert.match(source, /manage_quick_reschedule_confirm_/);
  assert.match(source, /Choose another time/);
});

test('typed same-day and explicit date-time inputs enter confirmation instead of writing immediately', () => {
  assert.match(source, /isTimeOnly/);
  assert.match(source, /isDateTime/);
  assert.match(source, /resolveTypedTimestamp/);
  assert.match(source, /return rescheduleConfirmation\(appointmentId, timestamp\)/);
  assert.match(source, /loadAdminBookingTimeInputSession/);
});

test('reschedule confirmation delegates to the established guarded mutation path and clears typed context', () => {
  assert.match(source, /originalImmediate\(sender, `manage_quick_reschedule_slot_/);
  assert.match(source, /clearAdminBookingTimeInputSession/);
});

test('service selection shows From-To review including duration and price before mutation', () => {
  assert.match(source, /\*Confirm service change\*/);
  assert.match(source, /\*From:\*/);
  assert.match(source, /\*To:\*/);
  assert.match(source, /\*New duration:\*/);
  assert.match(source, /\*New price:\*/);
  assert.match(source, /manage_service_confirm_/);
  assert.match(source, /Choose another service/);
});

test('service preview remains entitlement and practitioner aware while final confirm reuses guarded service mutation', () => {
  assert.match(source, /activePackageChoices/);
  assert.match(source, /staff_services/);
  assert.match(source, /checkClinicHours/);
  assert.match(source, /checkAuthoritativeSchedule/);
  assert.match(source, /checkCalendarAvailability/);
  assert.match(source, /originalStateless\(sender, `manage_service_pick_/);
});

test('confirmation patch itself never directly updates appointment truth', () => {
  assert.doesNotMatch(source, /UPDATE\s+appointments/i);
  assert.doesNotMatch(source, /UPDATE\s+appointment_services/i);
  assert.doesNotMatch(source, /INSERT\s+INTO\s+package_session_redemptions/i);
});
