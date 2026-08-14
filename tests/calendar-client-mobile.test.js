const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const calendarSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'googleBookingCalendar.js'), 'utf8');
const clientCommitSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'clientBookingCommit.js'), 'utf8');
const adminBookingSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBooking.js'), 'utf8');

test('calendar appointment description includes client mobile without changing the title contract', () => {
  assert.match(calendarSource, /clientMobile/);
  assert.match(calendarSource, /Mobile:/);
  assert.match(calendarSource, /bookingSummary\(\{clientName,serviceName,staffName\}\)/);
});

test('client WhatsApp booking carries the uniquely resolved WhatsApp identity into calendar creation', () => {
  assert.match(clientCommitSource, /resolveClientByWhatsApp/);
  assert.match(clientCommitSource, /identity\.status !== 'unique'/);
  assert.match(clientCommitSource, /clientMobile: normalizedPhone/);
});

test('admin booking resolves canonical CRM contact before calendar creation', () => {
  assert.match(adminBookingSource, /client_contacts/);
  assert.match(adminBookingSource, /clientMobile: session\.client_mobile/);
});

test('calendar mobile survives later event updates and remains descriptive only', () => {
  assert.match(calendarSource, /shilohClientMobile/);
  assert.match(calendarSource, /clientMobile\|\|p\.shilohClientMobile/);
  assert.doesNotMatch(calendarSource, /\b(?:UPDATE|INSERT|DELETE)\s+(?:clients|client_contacts)\b/i);
});
