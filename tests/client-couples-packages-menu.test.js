const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discovery = require('../src/services/clientDiscoveryPackages');
const patch = require('../src/bootstrap/clientCouplesPackagesPatch');

const packageFixture = {
  id: 9,
  slug: 'sports-massage-monthly',
  name: 'Sports Massage — Monthly Package',
  package_price: '1400.00',
  sessions_included: 4,
  validity_days: 30,
  cancellation_notice_hours: 24,
  duration_minutes: 50,
  customer_description: 'Four 50-minute Sports Massage sessions.',
};

test('Couples & Packages submenu puts Couples Massage first and canonical Sports package second', () => {
  const menu = patch.buildCouplesAndPackagesInteractive([packageFixture]);
  assert.equal(menu.body, '*Couples & Packages*\nChoose a special massage booking:');
  assert.deepEqual(menu.rows.map((row) => row.title), [
    'Couples Massage',
    'Sports Massage Package',
    'Back',
  ]);
  assert.equal(menu.rows[0].id, patch.COUPLES_MASSAGE_ACTION_ID);
  assert.equal(menu.rows[1].id, patch.SPORTS_PACKAGE_ACTION_ID);
  assert.equal(menu.rows[1].description, '4 sessions • R1,400 • valid 30 days');
  assert.equal(menu.rows[2].description, 'Back to Massage Treatments');
});

test('Couples & Packages fails closed when the canonical Sports package is not active', () => {
  const menu = patch.buildCouplesAndPackagesInteractive([]);
  assert.deepEqual(menu.rows.map((row) => row.title), ['Couples Massage', 'Back']);
  assert.equal(menu.rows.some((row) => row.title === 'Sports Massage Package'), false);
});

test('Massage Treatments page replaces legacy package row with Couples & Packages as first option', () => {
  const decorated = patch.decorateMassageTreatmentsInteractive({
    type: 'list',
    body: '*Massage Treatments*\nChoose a treatment, or open Massage Packages. Showing page 1 of 2.',
    buttonText: 'View services',
    sectionTitle: 'Massage Treatments',
    rows: [
      { id: 'client_massage_packages', title: 'Massage Packages', description: 'Prepaid packages & package sessions' },
      { id: 'client_service_22', title: 'Full Body Swedish', description: '90 min • R700' },
    ],
  });

  assert.equal(decorated.rows[0].id, patch.COUPLES_AND_PACKAGES_ACTION_ID);
  assert.equal(decorated.rows[0].title, 'Couples & Packages');
  assert.equal(decorated.rows.some((row) => row.id === 'client_massage_packages'), false);
  assert.equal(decorated.rows[1].id, 'client_service_22');
  assert.match(decorated.body, /open Couples & Packages/);
});

test('later Massage Treatments pages are not polluted with the special first-page option', () => {
  const pageTwo = {
    type: 'list',
    body: '*Massage Treatments*\nChoose a treatment, or open Massage Packages. Showing page 2 of 2.',
    rows: [{ id: 'client_service_34', title: 'Sports Massage Full Body' }],
  };
  assert.deepEqual(patch.decorateMassageTreatmentsInteractive(pageTwo), pageTwo);
});

test('Couples Massage is assisted-only and does not start an ordinary booking', async () => {
  const result = await discovery.processClientDiscoveryMessage('27820000000', patch.COUPLES_MASSAGE_ACTION_ID);
  assert.equal(result.handled, true);
  assert.equal(result.interactive.type, 'button');
  assert.match(result.interactive.body, /coordinated practitioner and treatment-space availability/i);
  assert.match(result.interactive.body, /No booking has been created yet\./);
  assert.deepEqual(result.interactive.buttons, [
    { id: patch.COUPLES_AND_PACKAGES_ACTION_ID, title: 'Back' },
  ]);
});

test('Sports package detail can return to Couples & Packages without changing package actions', () => {
  const detail = discovery.packageDetailInteractive(packageFixture, null);
  const decorated = patch.decorateSportsPackageDetail(detail);
  assert.equal(decorated.buttons[0].id, 'client_package_enquire_sports-massage-monthly');
  assert.equal(decorated.buttons[1].id, 'client_package_status_sports-massage-monthly');
  assert.deepEqual(decorated.buttons[2], { id: patch.COUPLES_AND_PACKAGES_ACTION_ID, title: 'Back' });
});

test('production and dev entrypoints preload the Couples & Packages patch', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.match(packageJson.scripts.start, /clientCouplesPackagesPatch\.js/);
  assert.match(packageJson.scripts.dev, /clientCouplesPackagesPatch\.js/);
});
