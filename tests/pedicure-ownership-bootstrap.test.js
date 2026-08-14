const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrapPath = path.join(__dirname, '..', 'src', 'services', 'pedicureOwnershipBootstrap.js');
const appPath = path.join(__dirname, '..', 'app.js');
const migrationPath = path.join(__dirname, '..', 'migrations', '053_marietjie_pedicure_ownership.sql');

const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');

test('MediHeel and pedicure catalogue ownership is repaired to unique active Marietjie', () => {
  assert.match(bootstrap, /LOWER\(display_name\) = 'marietjie'/);
  assert.match(bootstrap, /status = 'active'/);
  assert.match(bootstrap, /resource_type = 'practitioner'/);
  assert.match(bootstrap, /Pedicures & Foot Care/);
  assert.match(bootstrap, /pedicur/i);
  assert.match(bootstrap, /medi-?heel/i);
  assert.match(bootstrap, /elim/i);
  assert.match(bootstrap, /DELETE FROM staff_services/);
  assert.match(bootstrap, /INSERT INTO staff_services/);
  assert.match(bootstrap, /BEGIN/);
  assert.match(bootstrap, /COMMIT/);
  assert.match(bootstrap, /ROLLBACK/);
});

test('ownership repair fails closed instead of guessing Marietjie identity', () => {
  assert.match(bootstrap, /rows\.length !== 1/);
  assert.match(bootstrap, /throw new Error/);
});

test('production startup applies idempotent pedicure ownership repair before listening', () => {
  assert.match(app, /ensureMarietjiePedicureOwnership/);
  const ensure = app.indexOf('await ensureMarietjiePedicureOwnership()');
  const listen = app.indexOf('app.listen');
  assert.ok(ensure >= 0 && listen >= 0 && ensure < listen);
});

test('migration records the same Marietjie-only ownership contract', () => {
  assert.match(migration, /Pedicures & Foot Care/);
  assert.match(migration, /LOWER\(display_name\) = 'marietjie'/);
  assert.match(migration, /DELETE FROM staff_services/);
  assert.match(migration, /INSERT INTO staff_services/);
});
