const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discoveryPath = path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js');
const source = fs.readFileSync(discoveryPath, 'utf8');
const {
  SQT_CLIENT_CATEGORY_ID,
  SQT_CLIENT_CATEGORY_NAME,
  categoryPageInteractive,
  groupClientCategories,
  isSqtBioMicroneedlingCategory,
} = require(discoveryPath);

test('numbered SQT catalogue categories collapse into one client-facing family', () => {
  const grouped = groupClientCategories([
    { id: 10, name: 'Facials', service_count: 17 },
    { id: 11, name: '1. SQT BioMicroneedling', service_count: 1 },
    { id: 12, name: '2. SQT BioMicroneedling', service_count: 1 },
    { id: 13, name: 'Microneedling', service_count: 3 },
    { id: 14, name: 'Massage', service_count: 14 },
    { id: 15, name: 'Pedicures & Foot Care', service_count: 2 },
  ]);

  assert.equal(grouped.filter((row) => isSqtBioMicroneedlingCategory(row.name)).length, 0);
  const sqt = grouped.find((row) => row.id === SQT_CLIENT_CATEGORY_ID);
  assert.deepEqual(
    { name: sqt.name, service_count: sqt.service_count },
    { name: SQT_CLIENT_CATEGORY_NAME, service_count: 2 }
  );
  assert.deepEqual(grouped.slice(0, 2).map((row) => row.name), ['Massage', 'Pedicures & Foot Care']);
  assert.deepEqual(grouped.slice(2).map((row) => row.name), ['Facials', 'Microneedling', 'SQT BioMicroneedling']);
});

test('virtual SQT family renders as one selectable category with two treatments', () => {
  const grouped = groupClientCategories([
    { id: 11, name: '1. SQT BioMicroneedling', service_count: 1 },
    { id: 12, name: '2. SQT BioMicroneedling', service_count: 1 },
  ]);
  const interactive = categoryPageInteractive(grouped, 1);

  assert.deepEqual(interactive.rows[0], {
    id: `client_category_${SQT_CLIENT_CATEGORY_ID}`,
    title: 'SQT BioMicroneedling',
    description: '2 treatments',
  });
});

test('SQT virtual route loads both canonical source categories without rewriting service identity', () => {
  assert.match(source, /REGEXP_REPLACE\(COALESCE\(sc\.name, ''\)/);
  assert.match(source, /= 'sqt biomicroneedling'/);
  assert.match(source, /client_category_\$\{SQT_CLIENT_CATEGORY_ID\}/);
  assert.match(source, /listSqtBioMicroneedlingServices\(\)/);
  assert.match(source, /id: `client_service_\$\{row\.id\}`/);
});
