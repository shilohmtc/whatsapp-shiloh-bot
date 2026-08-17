const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const helper = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBookingNextAvailable.js'), 'utf8');
const preload = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'adminBookingNaturalDatePatch.js'), 'utf8');

test('change date/time is scoped to restart-safe next-available action', () => {
  assert.match(helper, /manage_change_time_\$\{appointmentId\}/);
  assert.match(helper, /manage_quick_reschedule_slot_\$\{appointmentId\}_/);
  assert.match(helper, /manage_quick_reschedule_page_\$\{appointmentId\}_/);
  assert.match(helper, /manage_quick_reschedule_other_\$\{appointmentId\}/);
  assert.match(preload, /scopeImmediateTimeActions\(originalScope\(result\)\)/);
});

test('next-available picker aggregates authoritative slots and excludes current booking', () => {
  assert.match(helper, /getNextOpenClinicDates/);
  assert.match(helper, /listAvailableSlots/);
  assert.match(helper, /excludeAppointmentId: context\.id/);
  assert.match(helper, /ignoreEventId: context\.event_id \|\| null/);
  assert.match(helper, /startMs === currentStart/);
  assert.match(helper, /Next available times/);
  assert.match(helper, /More times/);
  assert.match(helper, /Choose another date/);
});

test('package booking quick slots remain inside entitlement validity', () => {
  assert.match(helper, /package_expires_at/);
  assert.match(helper, /startMs >= packageExpiry/);
  assert.match(helper, /falls outside this package validity window/);
});

test('selected quick slot reuses guarded existing reschedule path', () => {
  assert.match(helper, /processAdminBookingUpdateMessage\(sender, 'manage_change_time'\)/);
  assert.match(helper, /manage_reschedule_date_\$\{localIsoDate\(starts\)\}/);
  assert.match(helper, /manage_reschedule_slot_\$\{timestamp\}/);
});
