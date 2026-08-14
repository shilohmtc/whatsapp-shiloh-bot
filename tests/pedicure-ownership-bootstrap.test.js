const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrapPath = path.join(__dirname, '..', 'src', 'services', 'pedicureOwnershipBootstrap.js');
const appPath = path.join(__dirname, '..', 'app.js');
const migrationPath = path.join(__dirname, '..', 'migrations', '054_christel_mediheel_ownership.sql');

const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');

test('MediHeel catalogue ownership is repaired to unique active Christel only', () => {
  assert.match(bootstrap, /LOWER\(display_name\) = 'christel'/);
  assert.match(bootstrap, /status = 'active'/);
  assert.match(bootstrap, /resource_type = 'practitioner'/);
  assert.match(bootstrap, /medi-?heel/i);
  assert.match(bootstrap, /elim/i);
  assert.doesNotMatch(bootstrap, /pedicures & foot care/i);
  assert.match(bootstrap, /DELETE FROM staff_services/);
  assert.match(bootstrap, /INSERT INTO staff_services/);
  assert.match(bootstrap, /BEGIN/);
  assert.match(bootstrap, /COMMIT/);
  assert.match(bootstrap, /ROLLBACK/);
});

test('ownership repair fails closed instead of guessing Christel identity', () => {
  assert.match(bootstrap, /rows\.length !== 1/);
  assert.match(bootstrap, /throw new Error/);
});

test('production startup applies idempotent Christel MediHeel ownership repair before listening', () => {
  assert.match(app, /ensureChristelMediHeelOwnership/);
  const ensure = app.indexOf('await ensureChristelMediHeelOwnership()');
  const listen = app.indexOf('app.listen');
  assert.ok(ensure >= 0 && listen >= 0 && ensure < listen);
});

test('correction migration records the same Christel-only MediHeel contract', () => {
  assert.match(migration, /LOWER\(display_name\) = 'christel'/);
  assert.match(migration, /medi-?heel/i);
  assert.match(migration, /elim/i);
  assert.doesNotMatch(migration, /pedicures & foot care/i);
  assert.match(migration, /DELETE FROM staff_services/);
  assert.match(migration, /INSERT INTO staff_services/);
});
