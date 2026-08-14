const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const availabilitySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'clientRescheduleAvailability.js'),
  'utf8'
);
const appointmentSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'appointmentChange.js'),
  'utf8'
);

test('bare CANCEL bypasses an active reschedule availability adapter so canonical cancellation can supersede it', () => {
  const fnStart = availabilitySource.indexOf('async function processClientRescheduleAvailabilityMessage');
  const getIntent = availabilitySource.indexOf('getIntent(phone)', fnStart);
  assert.ok(fnStart >= 0 && getIntent > fnStart);
  const preIntentGuard = availabilitySource.slice(fnStart, getIntent);
  assert.match(preIntentGuard, /cancel/i);
  assert.match(preIntentGuard, /handled:false/);
});

test('canonical appointment-change handler still clears a conflicting reschedule intent before starting cancellation', () => {
  assert.match(appointmentSource, /if\(action&&intent&&intent\.action!==action\)\{await clearIntent\(phone\);intent=null;\}/);
  assert.match(appointmentSource, /intent\.action==='cancel'\?'awaiting_confirmation':'collecting'/);
  assert.match(appointmentSource, /Please confirm the cancellation:/);
});
