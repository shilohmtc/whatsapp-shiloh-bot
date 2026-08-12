const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminMobileBookingFlow.js'), 'utf8');
const booking = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminBooking.js'), 'utf8');

test('guided admin booking starts from every active CRM service, not practitioner-filtered services', () => {
  assert.match(source, /FROM services s WHERE s\.status='active' ORDER BY s\.name,s\.id/);
  assert.doesNotMatch(source, /async function serviceRows\(staffId\)/);
  assert.match(source, /selectionOrder:'service_first'/);
  assert.match(source, /Choose from the full active Shiloh service catalogue first/);
});

test('practitioner eligibility is resolved only after the service is selected', () => {
  assert.match(source, /async function staffRowsForService\(serviceId\)/);
  assert.match(source, /WHERE ss\.service_id=\$1 AND st\.status='active' AND st\.client_bookable=TRUE/);
  assert.match(source, /if\(session\.step==='service'\).*staffRowsForService\(service\.id\)/s);
  assert.match(source, /Eligible practitioner/);
});

test('an active service without an eligible client-bookable practitioner fails closed instead of being silently hidden or misrouted', () => {
  assert.match(source, /This service is active in CRM, but no client-bookable practitioner is currently mapped to perform it/);
  assert.match(source, /Nothing has been booked/);
});

test('final booking still revalidates staff-service eligibility before production write', () => {
  assert.match(booking, /SELECT 1 FROM staff_services WHERE staff_id = \$1 AND service_id = \$2 LIMIT 1/);
  assert.match(booking, /eligibility_changed/);
});

test('calendar-backed booking still uses the canonical Google booking event path after CRM creation', () => {
  assert.match(booking, /createBookingEvent\(/);
  assert.match(booking, /appointment_calendar_events/);
  assert.match(booking, /sharedGoogleCalendarChecked/);
});
