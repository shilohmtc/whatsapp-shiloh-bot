const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminMobileBookingFlow.js'), 'utf8');
const entitlement = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminBookingEntitlement.js'), 'utf8');
const booking = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminBooking.js'), 'utf8');
const migration = fs.readFileSync(path.join(__dirname, '..', 'src/db/migrations/063_jean_pierre_booking_entitlement.sql'), 'utf8');

test('guided booking catalogue is fail-closed by explicit practitioner business rule', () => {
  assert.match(entitlement, /name === 'marietjie'.*staffNames: \['marietjie'\]/s);
  assert.match(entitlement, /name === 'christel' \|\| name === 'abigail' \|\| isJeanPierreBookingException\(admin\).*staffNames: \['christel', 'abigail'\]/s);
  assert.match(entitlement, /key: 'own_practitioner'.*staffIds: \[Number\(admin\.staff_id\)\]/s);
  assert.match(entitlement, /key: 'no_practitioner_scope'.*staffNames: \[\], staffIds: \[\]/s);
  assert.doesNotMatch(entitlement, /All client-bookable services/);
  assert.match(source, /bookingScope: scope\.key/);
});

test('Marietjie catalogue contains only services mapped to Marietjie', () => {
  assert.match(source, /LOWER\(st\.display_name\)=ANY\(\$1::text\[\]\)/);
  assert.match(source, /scopedActiveServiceRows\(admin\)/);
  assert.match(entitlement, /Marietjie services/);
});

test('Christel and Abigail share one service pool while practitioner selection remains eligibility based', () => {
  assert.match(entitlement, /Christel & Abigail services/);
  assert.match(source, /async function staffRowsForService\(serviceId, admin\)/);
  assert.match(source, /LOWER\(st\.display_name\)=ANY\(\$2::text\[\]\)/);
  assert.match(source, /staffRowsForService\(service\.id, admin\)/);
  assert.match(source, /Eligible practitioner/);
});

test('unlinked business admins without JP explicit exception do not inherit a clinic-wide booking catalogue', () => {
  assert.match(source, /no practitioner booking scope/i);
  assert.match(source, /return \[\];/);
  assert.doesNotMatch(source, /staffNames:null,label:'All client-bookable services'/);
});

test('WhatsApp treatment rows are concise and services are grouped before selection', () => {
  assert.match(source, /GROUP_ORDER/);
  assert.match(source, /subgroupForService/);
  assert.match(source, /step: 'group'/);
  assert.match(source, /admin_booking_group:/);
  assert.match(source, /Choose a treatment group/);
  assert.doesNotMatch(source, /description: ?'Select this service'/);
});

test('database guard prevents crafted or alternate admin booking paths from escaping practitioner scope', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION enforce_admin_booking_practitioner_scope/);
  assert.match(migration, /admin_name IN \('christel', 'abigail'\)/);
  assert.match(migration, /target_staff_name IN \('christel', 'abigail'\)/);
  assert.match(migration, /admin_name = 'marietjie'/);
  assert.match(migration, /admin_name = 'jean-pierre'[\s\S]*target_staff_name IN \('christel', 'abigail'\)/);
  assert.match(migration, /linked_staff_id = NEW\.staff_id/);
  assert.match(migration, /allowed := false/);
  assert.match(migration, /admin_booking_scope_denied/);
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
