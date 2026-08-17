const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js'),
  'utf8'
);

test('eligible practitioner DISTINCT query orders by selected practitioner_order alias', () => {
  const start = source.indexOf('async function listEligiblePractitionersForService');
  const end = source.indexOf('function serviceDescription', start);
  assert.ok(start >= 0 && end > start, 'eligible practitioner query must exist');

  const querySource = source.slice(start, end);
  assert.match(querySource, /SELECT DISTINCT st\.id, st\.display_name,/);
  assert.match(querySource, /END AS practitioner_order/);
  assert.match(querySource, /ORDER BY practitioner_order, st\.display_name, st\.id/);
  assert.doesNotMatch(querySource, /ORDER BY CASE LOWER\(st\.display_name\)/);
});
