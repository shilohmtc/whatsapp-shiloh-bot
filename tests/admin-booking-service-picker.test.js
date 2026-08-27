const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBookingUpdate.js'), 'utf8');

test('manage booking change-service opens an interactive eligible-service picker', () => {
  assert.match(source, /const SERVICE_PAGE_SIZE = 7/);
  assert.match(source, /eligibleReplacementServices\(a\)/);
  assert.match(source, /replacementServiceInteractive\(a, services, 1\)/);
  assert.match(source, /manage_service_pick_\$\{service\.id\}/);
  assert.match(source, /manage_service_page_\$\{safePage \+ 1\}/);
  assert.doesNotMatch(source, /return \{ handled: true, admin, reply: 'Send the exact new service name\.' \}/);
});

test('replacement choices remain practitioner-scoped and exclude package-only/current service', () => {
  assert.match(source, /s\.id<>\$2/);
  assert.match(source, /COALESCE\(s\.external_source,''\)<>'shiloh_package'/);
  assert.match(source, /service_packages sp/);
  assert.match(source, /staff_services ss/);
  assert.match(source, /ss\.staff_id=ast\.staff_id AND ss\.service_id=s\.id/);
});

test('selected service uses guarded mutation, canonical schedule validation and audit', () => {
  assert.match(source, /manage_service_pick_\(\\d\+\)/);
  assert.match(source, /validateWindow\(a, a\.staff\[0\]\.staff_id/);
  assert.match(source, /UPDATE appointment_services SET service_id=\$1/);
  assert.doesNotMatch(source, /syncCalendar|updateBookingEvent|appointment_calendar_events/);
  assert.match(source, /appointment\.service_updated/);
  assert.match(source, /selectedFromInteractiveList/);
});
