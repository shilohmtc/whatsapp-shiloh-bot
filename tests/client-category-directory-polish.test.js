const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discoveryPath = path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js');
const source = fs.readFileSync(discoveryPath, 'utf8');
const { categoryPageInteractive } = require(discoveryPath);

test('category directory presents approved client-facing treatment wording', () => {
  const interactive = categoryPageInteractive([
    { id: 1, name: 'Massage', service_count: 14 },
    { id: 2, name: 'Pedicures & Foot Care', service_count: 2 },
    { id: 3, name: 'Profosma Jet Plasma', service_count: 1 },
  ], 1);

  assert.equal(interactive.rows[0].title, 'Massage Treatments');
  assert.equal(interactive.rows[0].description, '14 treatments');
  assert.equal(interactive.rows[1].title, 'Pedicures & Foot Care');
  assert.equal(interactive.rows[1].description, '2 treatments');
  assert.equal(interactive.rows[2].description, '1 treatment');
  assert.doesNotMatch(interactive.rows.map((row) => row.description).join('\n'), /active service/i);
});

test('category query pins Massage then Pedicures & Foot Care and alphabetizes the remainder', () => {
  const start = source.indexOf('async function listClientBookableCategories()');
  const end = source.indexOf('async function listClientBookableServices()', start);
  const categoryQuery = source.slice(start, end);

  assert.ok(start >= 0 && end > start, 'category query function must remain present');
  assert.match(categoryQuery, /WHEN 'massage' THEN 0/);
  assert.match(categoryQuery, /WHEN 'pedicures & foot care' THEN 1/);
  assert.match(categoryQuery, /ELSE 2/);
  assert.match(categoryQuery, /LOWER\(COALESCE\(sc\.name, 'Services'\)\)/);
});

test('category polish keeps WhatsApp pagination unchanged', () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: index === 0 ? 'Massage' : `Category ${index + 1}`,
    service_count: index + 1,
  }));
  const first = categoryPageInteractive(rows, 1);
  const second = categoryPageInteractive(rows, 2);

  assert.equal(first.rows.length, 10);
  assert.equal(first.rows.at(-1).id, 'client_categories_page_2');
  assert.equal(second.rows.at(-1).id, 'client_categories_page_1');
});