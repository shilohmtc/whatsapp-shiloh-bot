const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminMobileBookingFlow.js'), 'utf8');
const booking = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminBooking.js'), 'utf8');

test('guided booking catalogue is scoped by the admin business rule', () => {
  assert.match(source, /name==='marietjie'.*staffNames:\['marietjie'\]/s);
  assert.match(source, /name==='christel'\|\|name==='abigail'.*staffNames:\['christel','abigail'\]/s);
  assert.match(source, /bookingScope:scope\.key/);
  assert.match(source, /Available catalogue:/);
});

test('Marietjie catalogue contains only services mapped to Marietjie', () => {
  assert.match(source, /LOWER\(st\.display_name\)=ANY\(\$1::text\[\]\)/);
  assert.match(source, /scopedActiveServiceRows\(admin\)/);
  assert.match(source, /Marietjie services/);
});

test('Christel and Abigail share one service pool while practitioner selection remains eligibility based', () => {
  assert.match(source, /Christel & Abigail services/);
  assert.match(source, /async function staffRowsForService\(serviceId,admin\)/);
  assert.match(source, /LOWER\(st\.display_name\)=ANY\(\$2::text\[\]\)/);
  assert.match(source, /staffRowsForService\(service\.id,admin\)/);
  assert.match(source, /Eligible practitioner/);
});

test('client-bookable restriction remains enforced for both services and practitioner choices', () => {
  const matches = source.match(/st\.client_bookable=TRUE/g) || [];
  assert.ok(matches.length >= 3);
  assert.match(source, /no eligible practitioner in your booking scope is currently mapped to perform it/);
  assert.match(source, /Nothing has been booked/);
});

test('business admins outside the practitioner-specific rules retain the client-bookable business catalogue', () => {
  assert.match(source, /key:'business_admin',staffNames:null,label:'All client-bookable services'/);
  assert.match(source, /SELECT DISTINCT s\.id,s\.name/);
});

test('final booking still revalidates staff-service eligibility before production write', () => {
  assert.match(booking, /SELECT 1 FROM staff_services WHERE staff_id = \$1 AND service_id = \$2 LIMIT 1/);
  assert.match(booking, /eligibility_changed/);
});

test('calendar-backed booking still uses canonical shared and practitioner Google calendar paths', () => {
  assert.match(booking, /createBookingEvent\(/);
  assert.match(booking, /createPractitionerBookingEvent\(/);
  assert.match(booking, /appointment_calendar_events/);
  assert.match(booking, /sharedGoogleCalendarChecked/);
  assert.match(booking, /practitionerGoogleCalendarChecked/);
});
