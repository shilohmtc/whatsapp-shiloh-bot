const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const migration = source('migrations/062_christel_service_catalogue_correction.sql');
const bootstrap = source('src/services/christelServiceCatalogueCorrectionBootstrap.js');
const app = source('app.js');

test('controlled correction retires only the reviewed 90-minute duplicate and preserves history', () => {
  assert.match(migration, /id = 27/);
  assert.match(migration, /1d734e8b-d21e-44c3-9a3f-b2a7165a7787/);
  assert.match(migration, /SET status = 'inactive'/);
  assert.match(migration, /DELETE FROM staff_services[\s\S]*service_id = 27/);
  assert.match(migration, /COUNT\(DISTINCT aps\.appointment_id\)/);
  assert.doesNotMatch(migration, /DELETE FROM (?:appointments|appointment_services)/i);
  assert.doesNotMatch(migration, /UPDATE (?:appointments|appointment_services)/i);
});

test('distinct 120-minute Sports Massage and package-only 50-minute service are guarded unchanged', () => {
  assert.match(migration, /id = 34[\s\S]*46043512-d1df-4169-92b4-132160fca809[\s\S]*duration_minutes = 120/);
  assert.match(migration, /id = 65[\s\S]*sports-massage-monthly-session[\s\S]*duration_minutes = 50/);
  assert.doesNotMatch(migration, /\b(?:name|price|customer_description|booking_note)\s*=/i);
  assert.match(bootstrap, /getPackageRule/);
  assert.match(bootstrap, /Sports Massage package rule/);
});

test('only the three reviewed Christel buffers are corrected and unreviewed buffers fail closed', () => {
  assert.match(migration, /e4510fa9-579f-46dd-8fff-107c00748597/);
  assert.match(migration, /61a0a7db-426d-4ecf-94ff-9fd6855f384d/);
  assert.match(migration, /b39dcaf1-7894-40e0-8a51-c7ab4eba553a/);
  assert.match(migration, /Unreviewed Christel service buffer conflict/);
  assert.match(bootstrap, /getActiveChristelCatalogue/);
  assert.match(bootstrap, /assertNoUnreviewedBuffers\(activeCatalogueBefore\)/);
  assert.match(bootstrap, /Target service names\/prices\/descriptions\/base durations/);
  assert.match(bootstrap, /Non-retired practitioner mappings/);
});

test('canonical corrected totals drive display and availability duration calculations', () => {
  const { formatDuration } = require('../src/services/activeCatalogueKnowledge');
  const { canonicalServiceTotalMinutes } = require('../src/services/availabilityService');
  const corrected = [
    { duration_minutes: 60, processing_time_minutes: 0, extra_time_minutes: 0, expected: 60 },
    { duration_minutes: 90, processing_time_minutes: 0, extra_time_minutes: 0, expected: 90 },
    { duration_minutes: 90, processing_time_minutes: 0, extra_time_minutes: 0, expected: 90 },
  ];
  for (const service of corrected) {
    assert.equal(canonicalServiceTotalMinutes(service), service.expected);
    assert.equal(formatDuration(service), `${service.expected} min`);
  }

  const availability = source('src/services/availabilityService.js');
  const adminBooking = source('src/services/adminBooking.js');
  const clientBooking = source('src/services/clientBookingCommit.js');
  assert.match(availability, /canonicalServiceTotalMinutes\(resource\)/);
  assert.match(availability, /\[date, staffId, locationId, totalMinutes/);
  assert.match(adminBooking, /availability\.endsAt/);
  assert.match(adminBooking, /session\.starts_at, session\.ends_at/);
  assert.match(clientBooking, /const endsAt = context\.availability\.endsAt/);
  assert.match(clientBooking, /startsAt, endsAt, canonical\.service_name/);
});

test('public and Admin booking surfaces remain canonical active-and-eligible views', () => {
  const publicCatalogue = source('src/services/publicServiceCatalogue.js');
  const adminAvailability = source('src/services/adminAvailability.js');
  assert.match(publicCatalogue, /s\.status = 'active'/);
  assert.match(publicCatalogue, /staff_services/);
  assert.match(publicCatalogue, /st\.client_bookable = TRUE/);
  assert.match(adminAvailability, /FROM services WHERE status='active'/);
  assert.match(bootstrap, /Retired service #27 remains eligible for a booking surface/);
  assert.match(bootstrap, /Distinct 120-minute Sports Massage service #34 is not publicly bookable/);
});

test('production startup applies and verifies the checksum-tracked correction before accepting traffic', () => {
  assert.match(bootstrap, /MIGRATION_FILENAME = '062_christel_service_catalogue_correction\.sql'/);
  assert.match(bootstrap, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.match(bootstrap, /SELECT checksum, applied_at FROM schema_migrations WHERE filename = \$1 FOR UPDATE/);
  assert.match(bootstrap, /Migration \$\{MIGRATION_FILENAME\} has changed after being applied/);
  assert.match(bootstrap, /await client\.query\('BEGIN'\)/);
  assert.match(bootstrap, /await client\.query\('COMMIT'\)/);
  assert.match(bootstrap, /await client\.query\('ROLLBACK'\)/);

  const packageBootstrap = app.indexOf('await ensureMassagePackageSchema()');
  const ownershipBootstrap = app.indexOf('await ensureChristelMediHeelOwnership()');
  const correctionBootstrap = app.indexOf('await ensureChristelServiceCatalogueCorrection()');
  const listener = app.indexOf('server = app.listen');
  assert.ok(packageBootstrap >= 0 && ownershipBootstrap > packageBootstrap);
  assert.ok(correctionBootstrap > ownershipBootstrap && listener > correctionBootstrap);
  assert.match(app, /Christel service catalogue correction verified/);
});
