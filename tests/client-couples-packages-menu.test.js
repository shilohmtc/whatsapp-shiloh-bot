const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discovery = require('../src/services/clientDiscoveryPackages');
const couplesBooking = require('../src/services/clientCouplesMassageBooking');
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

test('Couples & Packages submenu puts the 90 min R1,080 Couples Massage first', () => {
  const menu = patch.buildCouplesAndPackagesInteractive([packageFixture]);
  assert.equal(menu.body, '*Couples & Packages*\nChoose a special massage booking:');
  assert.deepEqual(menu.rows.map((row) => row.title), ['Couples Massage', 'Sports Massage Package', 'Back']);
  assert.equal(menu.rows[0].id, patch.COUPLES_MASSAGE_ACTION_ID);
  assert.equal(menu.rows[0].description, '90 min • R1,080 • Abigail & Christel');
  assert.equal(menu.rows[1].id, patch.SPORTS_PACKAGE_ACTION_ID);
  assert.equal(menu.rows[1].description, '4 sessions • R1400 • valid 30 days');
});

test('Couples & Packages still fails closed when the canonical Sports package is not active', () => {
  const menu = patch.buildCouplesAndPackagesInteractive([]);
  assert.deepEqual(menu.rows.map((row) => row.title), ['Couples Massage', 'Back']);
  assert.equal(menu.rows.some((row) => row.title === 'Sports Massage Package'), false);
});

test('Massage Treatments page keeps Couples & Packages first and suppresses direct Couples Massage service rows', () => {
  const decorated = patch.decorateMassageTreatmentsInteractive({
    type: 'list',
    body: '*Massage Treatments*\nChoose a treatment, or open Massage Packages. Showing page 1 of 2.',
    buttonText: 'View services',
    sectionTitle: 'Massage Treatments',
    rows: [
      { id: 'client_massage_packages', title: 'Massage Packages', description: 'Prepaid packages & package sessions' },
      { id: 'client_service_70', title: 'Couples Massage', description: '90 min • R1080' },
      { id: 'client_service_22', title: 'Full Body Swedish', description: '90 min • R700' },
    ],
  });

  assert.equal(decorated.rows[0].id, patch.COUPLES_AND_PACKAGES_ACTION_ID);
  assert.equal(decorated.rows.some((row) => row.id === 'client_massage_packages'), false);
  assert.equal(decorated.rows.some((row) => row.title === 'Couples Massage'), false);
  assert.equal(decorated.rows[1].id, 'client_service_22');
  assert.match(decorated.body, /open Couples & Packages/);
});

test('later Massage Treatments pages suppress direct Couples Massage without adding another special row', () => {
  const decorated = patch.decorateMassageTreatmentsInteractive({
    type: 'list',
    body: '*Massage Treatments*\nChoose a treatment, or open Massage Packages. Showing page 2 of 2.',
    rows: [
      { id: 'client_service_70', title: 'Couples Massage' },
      { id: 'client_service_34', title: 'Sports Massage Full Body' },
    ],
  });
  assert.deepEqual(decorated.rows.map((row) => row.title), ['Sports Massage Full Body']);
  assert.equal(decorated.rows.some((row) => row.id === patch.COUPLES_AND_PACKAGES_ACTION_ID), false);
});

test('joint availability is the exact future intersection of Abigail and Christel slots', () => {
  const first = [
    { starts_at: '2030-01-01T08:00:00.000Z', ends_at: '2030-01-01T09:30:00.000Z' },
    { starts_at: '2030-01-01T09:30:00.000Z', ends_at: '2030-01-01T11:00:00.000Z' },
  ];
  const second = [
    { starts_at: '2030-01-01T09:30:00.000Z', ends_at: '2030-01-01T11:00:00.000Z' },
    { starts_at: '2030-01-01T11:00:00.000Z', ends_at: '2030-01-01T12:30:00.000Z' },
  ];
  assert.deepEqual(couplesBooking.intersectSlots(first, second, 0), [first[1]]);
});

test('Couples Massage business contract is fixed at 90 minutes, R1,080, Abigail + Christel', () => {
  assert.equal(couplesBooking.SERVICE_NAME, 'Couples Massage');
  assert.equal(couplesBooking.DURATION_MINUTES, 90);
  assert.equal(couplesBooking.PRICE, 1080);
  assert.equal(couplesBooking.formatMoney(1080), 'R1,080');
  assert.deepEqual(couplesBooking.STAFF_NAMES, ['Abigail', 'Christel']);
});

test('migration creates one Shiloh-owned Couples Massage service and booking-only companion contact', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '070_couples_massage_self_service.sql'), 'utf8');
  assert.match(sql, /'Couples Massage', 90, 0, 0/);
  assert.match(sql, /1080\.00/);
  assert.match(sql, /'shiloh_special', 'couples-massage-v1'/);
  assert.match(sql, /LOWER\(TRIM\(display_name\)\) = 'abigail'/);
  assert.match(sql, /LOWER\(TRIM\(display_name\)\) = 'christel'/);
  assert.match(sql, /contact_role TEXT NOT NULL DEFAULT 'booking_backup'/);
  assert.match(sql, /marketing_consent BOOLEAN NOT NULL DEFAULT FALSE/);
  assert.match(sql, /appointment_companions_no_marketing_check CHECK \(marketing_consent = FALSE\)/);
  assert.doesNotMatch(sql, /INSERT INTO client_contacts/i);
});

test('booking commit locks and writes both practitioners atomically without external mirrors', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'clientCouplesMassageBooking.js'), 'utf8');
  assert.match(source, /lockIds = foundation\.staff\.map/);
  assert.match(source, /pg_advisory_xact_lock/);
  assert.match(source, /for \(let index = 0; index < foundation\.staff\.length; index \+= 1\)/);
  assert.match(source, /INSERT INTO appointment_staff/);
  assert.match(source, /INSERT INTO appointment_companions/);
  assert.match(source, /'booking_backup',FALSE/);
  assert.doesNotMatch(source, /createPractitionerBookingEvent|cancelPractitionerBookingEvents|appointment_calendar_events/);
  assert.match(source, /stageCreatedBookingForApproval/);
  assert.match(source, /POLICY_TEXT/);
});

test('Admin cancellation locks every assigned practitioner and leaves external snapshots untouched', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminAppointmentCancellation.js'), 'utf8');
  assert.match(source, /cancelCanonicalAppointmentInTransaction\(client/);
  assert.match(source, /getAppointmentStaff\(appointmentId, db\)/);
  assert.match(source, /for \(const staff of assignedStaff\) await db\.query\(`SELECT pg_advisory_xact_lock/);
  assert.match(source, /historical_snapshot_untouched/);
  assert.doesNotMatch(source, /cancelPractitionerBookingEvents|appointment_calendar_events/);
});

test('Client cancellation locks all assigned staff while leaving historical external snapshots untouched', () => {
  const patchSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'clientMultiStaffAppointmentChangePatch.js'), 'utf8');
  const appointmentChangeSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'appointmentChange.js'), 'utf8');
  const preload = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'clientCouplesPackagesPatch.js'), 'utf8');
  assert.match(patchSource, /for \(const staff of assignedStaff\) await db\.query\('SELECT pg_advisory_xact_lock/);
  assert.match(patchSource, /historical_snapshot_untouched/);
  assert.doesNotMatch(patchSource, /cancelPractitionerBookingEvents|appointment_calendar_events|googleBookingCalendar/);
  assert.match(patchSource, /multiStaffSafe: true/);
  assert.match(appointmentChangeSource, /staff_count\)!==1/);
  assert.match(appointmentChangeSource, /complex practitioner setup/);
  assert.match(preload, /clientMultiStaffAppointmentChangePatch/);
});

test('startup chain checksum-verifies migration 070 after existing catalogue corrections', () => {
  const bootstrap = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'couplesMassageBookingBootstrap.js'), 'utf8');
  const patchSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'abigailJawReleaseMappingPatch.js'), 'utf8');
  assert.match(bootstrap, /070_couples_massage_self_service\.sql/);
  assert.match(bootstrap, /Migration .* has changed after being applied/);
  assert.match(bootstrap, /exactly Abigail \+ Christel/);
  assert.match(patchSource, /ensureCouplesMassageBookingFoundation/);
});

test('Sports package detail remains canonical and returns to Couples & Packages', () => {
  const detail = discovery.packageDetailInteractive(packageFixture, null);
  const decorated = patch.decorateSportsPackageDetail(detail);
  assert.equal(decorated.buttons[0].id, 'client_package_enquire_sports-massage-monthly');
  assert.equal(decorated.buttons[1].id, 'client_package_status_sports-massage-monthly');
  assert.deepEqual(decorated.buttons[2], { id: patch.COUPLES_AND_PACKAGES_ACTION_ID, title: 'Back' });
});

test('production and dev entrypoints still preload the Couples & Packages patch', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.match(packageJson.scripts.start, /clientCouplesPackagesPatch\.js/);
  assert.match(packageJson.scripts.dev, /clientCouplesPackagesPatch\.js/);
});
