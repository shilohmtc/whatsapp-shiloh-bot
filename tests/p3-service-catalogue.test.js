const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('service content migrations are presentation-only', () => {
  for (const file of ['migrations/038_service_customer_content.sql', 'migrations/039_service_customer_descriptions.sql']) {
    const sql = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(sql, /DELETE\s+FROM\s+(appointments|clients)/i);
    assert.doesNotMatch(sql, /UPDATE\s+(appointments|clients)/i);
  }
  assert.match(fs.readFileSync('migrations/039_service_customer_descriptions.sql', 'utf8'), /Customer description seed incomplete/);
});

test('catalogue is active CRM only and WhatsApp-linked', () => {
  const service = fs.readFileSync('src/services/serviceCatalogue.js', 'utf8');
  const route = fs.readFileSync('src/routes/services.js', 'utf8');
  const app = fs.readFileSync('app.js', 'utf8');
  assert.match(service, /s\.status='active'/);
  assert.match(route, /Book this treatment via WhatsApp/);
  assert.match(app, /serviceRoutes/);
});

test('guarded catalogue migration refuses unrelated pending migrations', () => {
  const service = fs.readFileSync('src/services/serviceCatalogueMigration.js', 'utf8');
  const auth = fs.readFileSync('src/middleware/catalogueMigrationAuth.js', 'utf8');
  const routes = fs.readFileSync('src/routes/admin.js', 'utf8');
  assert.match(service, /unexpected migrations are pending/);
  assert.match(service, /038_service_customer_content\.sql/);
  assert.match(service, /039_service_customer_descriptions\.sql/);
  assert.match(auth, /CATALOGUE_MIGRATION_KEY/);
  assert.match(auth, /x-catalogue-migration-key/);
  assert.match(routes, /catalogueMigrationAuth/);
});
