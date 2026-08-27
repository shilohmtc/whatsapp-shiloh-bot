const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const availabilitySource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'clientRescheduleAvailability.js'), 'utf8');

test('reschedule confirmation uses clear interactive choices and hides internal identifiers', () => {
  assert.match(availabilitySource, /Confirm reschedule/);
  assert.match(availabilitySource, /Keep appointment/);
  assert.match(availabilitySource, /id:'yes'/);
  assert.match(availabilitySource, /id:'stop'/);
  assert.doesNotMatch(availabilitySource, /Booking #\$\{a\.id\}/);
  assert.match(availabilitySource, /Nothing has changed yet\./);
});

test('successful reschedule reply stays client-friendly while using the existing atomic handler', () => {
  assert.match(availabilitySource, /processAppointmentChangeMessage/);
  assert.match(availabilitySource, /✅ Appointment rescheduled/);
  assert.match(availabilitySource, /We look forward to seeing you\. 🌿/);
  assert.match(availabilitySource, /Your Shiloh appointment is updated/);
});

test('successful reschedule schedules the same calendar and change controls as booking confirmation', () => {
  assert.match(availabilitySource, /sendCustomerAppointmentActionsForAppointment/);
  assert.match(availabilitySource, /postSend/);
  assert.match(availabilitySource, /appointmentId/);
});
