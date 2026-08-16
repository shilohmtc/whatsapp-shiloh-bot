const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(file) {
  return fs.readFileSync(path.join(__dirname, '..', 'src', 'services', file), 'utf8');
}

test('reschedule date choices are backed by authoritative clinic working days', () => {
  const choices = source('rescheduleDateChoice.js');
  const helper = source('clinicDateChoices.js');
  assert.match(choices, /getNextOpenClinicDates/);
  assert.match(choices, /reschedule_date_/);
  assert.match(helper, /getClinicWindowForDate/);
  assert.match(helper, /if \(!window\.covered\) continue/);
});

test('closed reschedule dates are rejected before time-of-day selection', () => {
  const reschedule = source('clientRescheduleAvailability.js');
  assert.match(reschedule, /getClinicDateStatus/);
  assert.match(reschedule, /if\(!clinicDate\.covered\)/);
  assert.match(reschedule, /preferred_date:null,preferred_time:null/);
  assert.match(reschedule, /Shiloh is closed on/);
});

test('reschedule escape controls clear stale dates and avoid daypart loops', () => {
  const reschedule = source('clientRescheduleAvailability.js');
  assert.match(reschedule, /reschedule_date_other/);
  assert.match(reschedule, /reschedule_change_daypart/);
  assert.match(reschedule, /Another time/);
  assert.match(reschedule, /Another date/);
  assert.match(reschedule, /Keep appointment/);
});

test('new client bookings use the same closed-date eligibility gate', () => {
  const booking = source('clientBookingAvailability.js');
  assert.match(booking, /getClinicDateStatus/);
  assert.match(booking, /if\(!clinicDate\.covered\)/);
  assert.match(booking, /Nothing has been booked/);
  assert.match(booking, /client_date_/);
});
