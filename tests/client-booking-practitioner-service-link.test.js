const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discoveryPath = path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js');
const source = fs.readFileSync(discoveryPath, 'utf8');
const {
  SERVICE_PAGE_SIZE,
  eligiblePractitionersInteractive,
  practitionerServicePageInteractive,
} = require(discoveryPath);

test('service-first discovery exposes Any available plus only bounded eligible practitioner rows', () => {
  const service = { id: 41, name: 'Swedish Massage' };
  const staff = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, display_name: `Practitioner ${index + 1}` }));
  const view = eligiblePractitionersInteractive(service, staff);
  assert.equal(view.type, 'list');
  assert.equal(view.rows[0].id, 'client_practitioner_any');
  assert.equal(view.rows[0].title, 'Any available');
  assert.ok(view.rows.length <= 10);
  assert.ok(view.rows.slice(1).every((row) => row.id.startsWith('client_practitioner_')));
});

test('practitioner-first service pagination keeps practitioner scope in pagination IDs', () => {
  assert.equal(SERVICE_PAGE_SIZE, 9);
  const practitioner = { id: 7, display_name: 'Marietjie' };
  const rows = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    name: `Treatment ${index + 1}`,
    duration_minutes: 60,
    price: 500,
  }));
  const first = practitionerServicePageInteractive(rows, practitioner, 1);
  const second = practitionerServicePageInteractive(rows, practitioner, 2);
  assert.equal(first.rows.length, 10);
  assert.equal(second.rows.length, 10);
  assert.equal(first.rows.at(-1).id, 'client_practitioner_services_7_page_2');
  assert.equal(second.rows.at(-1).id, 'client_practitioner_services_7_page_3');
  assert.match(first.body, /Services with Marietjie/);
});

test('both discovery directions are CRM staff-services backed and client-bookable only', () => {
  assert.match(source, /async function listServicesForPractitioner/);
  assert.match(source, /async function listEligiblePractitionersForService/);
  const staffServiceJoins = source.match(/JOIN staff_services ss/g) || [];
  const clientBookableChecks = source.match(/client_bookable = TRUE/g) || [];
  assert.ok(staffServiceJoins.length >= 6);
  assert.ok(clientBookableChecks.length >= 6);
  assert.doesNotMatch(source, /Savanna|Pieter/);
});

test('service-first flow stages the service then renders only its eligible practitioners', () => {
  const serviceBlock = source.slice(source.indexOf('const serviceMatch'), source.indexOf("if (value === 'client_practitioner_any')"));
  assert.match(serviceBlock, /findClientBookableService\(serviceMatch\[1\]\)/);
  assert.match(serviceBlock, /serviceEligibleForPractitioner\(service\.id, chosenPractitioner\)/);
  assert.match(serviceBlock, /processBookingMessage\(sender, `Book \$\{service\.name\}`\)/);
  assert.match(serviceBlock, /listEligiblePractitionersForService\(service\.id\)/);
  assert.match(serviceBlock, /eligiblePractitionersInteractive\(service, eligible\)/);
});

test('practitioner-first flow stages the practitioner then renders only mapped services', () => {
  const practitionerBlock = source.slice(source.indexOf('const practitionerMatch'), source.indexOf('return { handled: false }'));
  assert.match(practitionerBlock, /findClientBookablePractitioner\(practitionerMatch\[1\]\)/);
  assert.match(practitionerBlock, /practitionerEligibleForService\(practitioner\.id, existing\.service_text\)/);
  assert.match(practitionerBlock, /processBookingMessage\(sender, `booking with \$\{practitioner\.display_name\}`\)/);
  assert.match(practitionerBlock, /listServicesForPractitioner\(practitioner\.id\)/);
  assert.match(practitionerBlock, /practitionerServicePageInteractive\(services, practitioner, 1\)/);
});

test('specific service-practitioner combinations are revalidated before advancing booking steps', () => {
  assert.match(source, /async function practitionerEligibleForService/);
  assert.match(source, /LOWER\(s\.name\) = LOWER\(\$2\)/);
  assert.match(source, /async function serviceEligibleForPractitioner/);
  assert.match(source, /LOWER\(st\.display_name\) = LOWER\(\$2\)/);
  assert.match(source, /not currently eligible for the selected service/);
  assert.match(source, /not currently mapped to \$\{chosenPractitioner\}/);
});

test('this slice remains discovery/staging only and does not create appointments or claim availability', () => {
  assert.doesNotMatch(source, /INSERT INTO appointments/i);
  assert.doesNotMatch(source, /createBookingEvent|createPractitionerBookingEvent/);
  assert.doesNotMatch(source, /available slot|availability confirmed|appointment confirmed/i);
});
