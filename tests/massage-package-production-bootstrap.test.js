const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrap = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'massagePackageBootstrap.js'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('massage package bootstrap applies only the approved migration with checksum tracking', () => {
  assert.match(bootstrap, /MIGRATION_FILENAME = '061_massage_packages\.sql'/);
  assert.match(bootstrap, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.match(bootstrap, /SELECT checksum, applied_at FROM schema_migrations WHERE filename = \$1 FOR UPDATE/);
  assert.match(bootstrap, /Migration \$\{MIGRATION_FILENAME\} has changed after being applied/);
  assert.match(bootstrap, /INSERT INTO schema_migrations \(filename, checksum\)/);
  assert.match(bootstrap, /await client\.query\('BEGIN'\)/);
  assert.match(bootstrap, /await client\.query\('COMMIT'\)/);
  assert.match(bootstrap, /await client\.query\('ROLLBACK'\)/);
});

test('ordinary startup verifies migration authority without applying package bootstrap', () => {
  const schemaCall = app.indexOf('await verifyMigrationState()');
  const listenCall = app.indexOf('server = app.listen');
  assert.ok(schemaCall >= 0 && listenCall > schemaCall, 'migration authority must be verified before Shiloh accepts traffic');
  assert.doesNotMatch(app, /ensureMassagePackageSchema/);
});

test('Sports Massage activation delegates before the generic Admin assistant fallback is captured by webhook routes', () => {
  const delegate = app.indexOf('adminAssistantService.processAdminAssistantMessage = async');
  const webhookLoad = app.indexOf('const webhookRoutes = require(".\/src\/routes\/webhook")');
  assert.ok(delegate >= 0 && webhookLoad > delegate, 'Admin package delegation must be installed before webhook routes load');
  assert.match(app, /activate\|grant/);
  assert.match(app, /sports massage/);
  assert.match(app, /activateSportsPackage\(sender, activation\[1\]\)/);
});
