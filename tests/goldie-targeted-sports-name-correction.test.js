const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const migration = source('migrations/077_goldie_targeted_sports_name_correction.sql');
const bootstrap = source('src/services/goldieTargetedSportsNameCorrectionBootstrap.js');
const ensureScript = source('scripts/ensure-goldie-targeted-sports-name-correction.js');
const pkg = JSON.parse(source('package.json'));

const ID = '2d5b6147-ee9f-4a97-8e27-6270751c2673';
const PRIOR = 'Targated Area Specific Sports Massage';
const TARGET = 'Targeted Area-Specific Sports Massage';
const DESCRIPTION = 'Targeted Area Specific Sports Massage uses focused sports-massage techniques on a selected body area, tailored to the client’s comfort, activity level and treatment goals.';

test('migration 077 is exactly the PR447 one-row mechanical name correction', () => {
  assert.match(migration, new RegExp(ID));
  assert.match(migration, new RegExp(PRIOR));
  assert.match(migration, new RegExp(TARGET));
  assert.match(migration, /SET name = 'Targeted Area-Specific Sports Massage'/);
  assert.doesNotMatch(migration, /customer_description\s*=/i);
  assert.doesNotMatch(migration, /(?:INSERT|DELETE)\s+(?:INTO\s+)?(?:staff_services|appointments|appointment_services|clients)\b/i);
});

test('generic migration execution cannot bypass PR447 name-correction guard', () => {
  assert.match(migration, /current_setting\('shiloh\.goldie_targeted_sports_name_authority', true\)/);
  assert.match(migration, /requires guarded PR447 authority/);
  assert.match(bootstrap, /SET LOCAL shiloh\.goldie_targeted_sports_name_authority = 'PR447'/);
});

test('bootstrap preserves exact Wave B description, status, mappings and non-target names', () => {
  assert.match(bootstrap, new RegExp(DESCRIPTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(bootstrap, /Targeted Sports Wave B description drift detected/);
  assert.match(bootstrap, /Targeted Sports must remain active and public-catalogue eligible/);
  assert.match(bootstrap, /Targeted Sports practitioner mappings/);
  assert.match(bootstrap, /Non-target service names/);
  assert.match(bootstrap, /Targeted Sports non-name metadata/);
});

test('bootstrap is transactional and fails closed on identity or name drift', () => {
  assert.match(bootstrap, /Expected exactly one Targeted Sports canonical row/);
  assert.match(bootstrap, /Targeted Sports canonical identity mismatch/);
  assert.match(bootstrap, /Unexpected Targeted Sports current name/);
  assert.match(bootstrap, /mechanical name correction postcondition failed/);
  assert.match(bootstrap, /await client\.query\('BEGIN'\)/);
  assert.match(bootstrap, /await client\.query\('COMMIT'\)/);
  assert.match(bootstrap, /await client\.query\('ROLLBACK'\)/);
});

test('targeted correction guard is verification-only and detached from ordinary startup', () => {
  assert.match(ensureScript, /goldie_targeted_sports_name_correction_verified/);
  assert.match(ensureScript, /verifyMigrationFile/);
  assert.doesNotMatch(ensureScript, /ensureGoldieTargetedSportsNameCorrection/);
  const start = pkg.scripts.start;
  const authority = start.indexOf('node scripts/verify-migrations.js');
  const app = start.lastIndexOf(' app.js');
  assert.ok(authority === 0 && app > authority);
  assert.doesNotMatch(start, /ensure-goldie-targeted-sports-name-correction/);
});
