const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discoveryPath = path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js');
const source = fs.readFileSync(discoveryPath, 'utf8');

test('SQT client query strips numbering for presentation and sorts by the cleaned display name', () => {
  const start = source.indexOf('async function listSqtBioMicroneedlingServices()');
  const end = source.indexOf('async function listServicesForPractitioner(', start);
  const sqtQuery = source.slice(start, end);

  assert.ok(start >= 0 && end > start, 'SQT query must remain present');
  assert.match(sqtQuery, /REGEXP_REPLACE\(s\.name,[\s\S]*AS name/);
  assert.match(sqtQuery, /ORDER BY LOWER\(REGEXP_REPLACE\(s\.name,/);
  assert.doesNotMatch(sqtQuery, /UPDATE\s+services|INSERT\s+INTO\s+services|DELETE\s+FROM\s+services/i);
});

test('service selection still resolves the canonical service by id before booking', () => {
  const start = source.indexOf('const serviceMatch = value.match');
  const end = source.indexOf("if (value === 'client_practitioner_any')", start);
  const route = source.slice(start, end);

  assert.match(route, /findClientBookableService\(serviceMatch\[1\]\)/);
  assert.match(route, /processBookingMessage\(sender, `Book \$\{service\.name\}`\)/);
});
