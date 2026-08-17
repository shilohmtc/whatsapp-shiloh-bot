const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discoveryPath = path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js');
const source = fs.readFileSync(discoveryPath, 'utf8');

test('SQT DISTINCT query orders by selected display-name alias', () => {
  const start = source.indexOf('async function listSqtBioMicroneedlingServices()');
  const end = source.indexOf('async function listServicesForPractitioner(', start);
  const query = source.slice(start, end);

  assert.ok(start >= 0 && end > start, 'SQT service query must remain present');
  assert.match(query, /REGEXP_REPLACE\(s\.name,[\s\S]*AS name/);
  assert.match(query, /ORDER BY name, s\.id/);
  assert.doesNotMatch(query, /ORDER BY LOWER\(REGEXP_REPLACE/);
});
