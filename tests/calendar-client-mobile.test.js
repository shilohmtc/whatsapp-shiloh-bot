const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const calendarSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'googleBookingCalendar.js'), 'utf8');
const clientCommitSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'clientBookingCommit.js'), 'utf8');
const adminBookingSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBooking.js'), 'utf8');

test('calendar appointment description keeps staff-useful mobile and WhatsApp contact details', () => {
  assert.match(calendarSource, /clientMobile/);
  assert.match(calendarSource, /Mobile:/);
  assert.match(calendarSource, /WhatsApp:/);
  assert.match(calendarSource, /https:\/\/wa\.me\//);
  assert.match(calendarSource, /bookingSummary\(\{clientName,serviceName,staffName\}\)/);
});

test('calendar appointment presentation uses native location and hides internal CRM/source metadata', () => {
  assert.match(calendarSource, /location:/);
  assert.doesNotMatch(calendarSource, /Shiloh CRM appointment #\$\{appointmentId\}/);
  assert.doesNotMatch(calendarSource, /source\?`Source:/);
  assert.doesNotMatch(calendarSource, /locationName\?`Location:/);
});

test('client WhatsApp booking resolves one identity without exposing it to an external calendar', () => {
  assert.match(clientCommitSource, /resolveWhatsAppBookingIdentity/);
  assert.match(clientCommitSource, /resolveFinalBookingIdentity/);
  assert.match(clientCommitSource, /identity\.status !== 'unique'/);
  assert.doesNotMatch(clientCommitSource, /clientMobile: normalizedPhone|createBookingEvent|appointment_calendar_events/);
});

test('admin booking resolves canonical CRM contact only for governed confirmation delivery', () => {
  assert.match(adminBookingSource, /client_contacts/);
  assert.doesNotMatch(adminBookingSource, /clientMobile: session\.client_mobile|createBookingEvent|appointment_calendar_events/);
});

test('calendar mobile survives later event updates and remains descriptive only', () => {
  assert.match(calendarSource, /shilohClientMobile/);
  assert.match(calendarSource, /clientMobile\|\|p\.shilohClientMobile/);
  assert.doesNotMatch(calendarSource, /\b(?:UPDATE|INSERT|DELETE)\s+(?:clients|client_contacts)\b/i);
});
