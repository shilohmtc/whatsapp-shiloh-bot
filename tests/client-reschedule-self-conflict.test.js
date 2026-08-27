const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const availability = fs.readFileSync(path.join(root, 'src', 'services', 'availabilityService.js'), 'utf8');
const reschedule = fs.readFileSync(path.join(root, 'src', 'services', 'clientRescheduleAvailability.js'), 'utf8');

test('reschedule slot discovery can exclude the appointment being moved from CRM conflicts', () => {
  assert.match(availability, /excludeAppointmentId/);
  assert.match(availability, /a\.id\s*<>\s*\$\d+/);
  assert.match(reschedule, /excludeAppointmentId:\s*Number\(a\.id\)/);
});

test('reschedule slot discovery does not consult an external calendar event', () => {
  assert.doesNotMatch(availability, /checkCalendarAvailability|googleBookingCalendar/);
  assert.doesNotMatch(reschedule, /ignoreEventId|appointment_calendar_events|googleBookingCalendar/);
});

test('ordinary availability remains compatible when no exclusions are supplied', () => {
  assert.match(availability, /async function listAvailableSlots\(\{[\s\S]*excludeAppointmentId[\s\S]*ignoreEventId/);
});
