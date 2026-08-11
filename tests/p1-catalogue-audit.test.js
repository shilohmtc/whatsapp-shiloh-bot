const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('catalogue parity audit is read-only and excludes client/appointment data', () => {
  const audit = source('src/services/catalogueParityAudit.js');
  assert.match(audit, /FROM services s/);
  assert.match(audit, /service_categories/);
  assert.doesNotMatch(audit, /\bUPDATE\b|\bINSERT\b|\bDELETE\b/i);
  assert.doesNotMatch(audit, /FROM clients|FROM appointments|client_contacts/i);
  assert.doesNotMatch(audit, /external_id|external_source|staff/i);
});

test('public catalogue audit route exposes only the sanitized catalogue report', () => {
  const route = source('src/routes/auditRead.js');
  assert.match(route, /\/catalogue\/status/);
  assert.match(route, /getCatalogueParityAudit/);
});
