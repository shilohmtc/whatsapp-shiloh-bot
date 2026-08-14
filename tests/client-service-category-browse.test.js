const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discoveryPath = path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js');
const source = fs.readFileSync(discoveryPath, 'utf8');
const {
  CATEGORY_PAGE_SIZE,
  categoryPageInteractive,
  servicePageInteractive,
} = require(discoveryPath);

test('service browsing starts with CRM-backed categories scoped to client-bookable practitioners', () => {
  assert.match(source, /async function listClientBookableCategories\(\)/);
  assert.match(source, /JOIN staff_services ss ON ss\.service_id = s\.id/);
  assert.match(source, /st\.client_bookable = TRUE/);
  assert.match(source, /COUNT\(DISTINCT s\.id\)::int AS service_count/);
  assert.match(source, /return \{ handled: true, interactive: categoryPageInteractive\(categories, 1\) \}/);
});

test('category lists respect Meta row bounds and use stable IDs', () => {
  assert.equal(CATEGORY_PAGE_SIZE, 9);
  const rows = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: `Category ${index + 1}`,
    service_count: index + 2,
  }));
  const first = categoryPageInteractive(rows, 1);
  const second = categoryPageInteractive(rows, 2);
  assert.equal(first.type, 'list');
  assert.equal(first.rows.length, 10);
  assert.ok(second.rows.length <= 10);
  assert.equal(first.rows[0].id, 'client_category_1');
  assert.equal(first.rows.at(-1).id, 'client_categories_page_2');
});

test('client service category copy uses deliberate family labels and action-oriented descriptions', () => {
  const view = categoryPageInteractive([
    { id: 1, name: 'Beauty & Aesthetics', service_count: 12 },
    { id: 2, name: 'Massage', service_count: 8 },
    { id: 3, name: 'Lymphatic Drainage', service_count: 2 },
    { id: 4, name: 'Elim MediHeel Pedicures', service_count: 3 },
  ], 1);
  assert.deepEqual(view.rows.map(({ title, description }) => ({ title, description })), [
    { title: 'Beauty & Aesthetics', description: 'View beauty & aesthetics treatments' },
    { title: 'Massage Treatments', description: 'View massage treatments' },
    { title: 'Lymphatic Drainage', description: 'View lymphatic drainage treatments' },
    { title: 'Elim MediHeel Pedicures', description: 'View pedicure treatments' },
  ]);
  assert.equal(view.rows[1].id, 'client_category_2');
});

test('category service pages retain category scope across pagination', () => {
  const rows = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    name: `Treatment ${index + 1}`,
    duration_minutes: 60,
    price: 500,
  }));
  const page = servicePageInteractive(rows, 1, { categoryId: 7, categoryName: 'Massage' });
  assert.equal(page.type, 'list');
  assert.equal(page.rows.at(-1).id, 'client_category_7_page_2');
  assert.match(page.body, /Massage/);
});

test('category selection re-queries active CRM mapping and fails closed when empty', () => {
  assert.match(source, /async function listServicesForCategory\(categoryId\)/);
  assert.match(source, /WHERE COALESCE\(sc\.id, 0\) = \$1/);
  assert.match(source, /That category no longer has active client-bookable services/);
  assert.match(source, /client_category_\(\\d\+\)/);
});

test('Any available path also returns to category-first browsing when service is not yet selected', () => {
  assert.match(source, /value === 'client_practitioner_any'/);
  assert.match(source, /const categories = await listClientBookableCategories\(\)/);
  assert.match(source, /interactive: categoryPageInteractive\(categories, 1\)/);
});
