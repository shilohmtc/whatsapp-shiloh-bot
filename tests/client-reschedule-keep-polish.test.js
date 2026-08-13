const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'clientRescheduleAvailability.js'), 'utf8');

test('keep-appointment response reassures client with canonical appointment context', () => {
  assert.match(source, /No problem/);
  assert.match(source, /Your appointment is unchanged and remains booked for/);
  assert.match(source, /We look forward to seeing you\. 🌿/);
  assert.match(source, /client_name/);
});

test('keep-appointment polish delegates stop semantics to existing appointment-change handler', () => {
  assert.match(source, /processAppointmentChangeMessage/);
  assert.match(source, /awaiting_confirmation/);
});
