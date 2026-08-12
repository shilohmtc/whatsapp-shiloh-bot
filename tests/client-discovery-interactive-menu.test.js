const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const discoveryPath = path.join(__dirname, '..', 'src', 'services', 'clientDiscoveryMenu.js');
const webhookPath = path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js');
const source = fs.readFileSync(discoveryPath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');
const { clientHomeInteractive, servicePageInteractive, SERVICE_PAGE_SIZE } = require(discoveryPath);

test('client home uses exactly three genuine WhatsApp reply-button actions', () => {
  const home = clientHomeInteractive();
  assert.equal(home.type, 'button');
  assert.deepEqual(home.buttons.map((button) => button.id), [
    'client_browse_services',
    'client_practitioners',
    'client_book_now',
  ]);
  assert.ok(home.buttons.every((button) => button.title.length <= 20));
});

test('client service browsing is CRM-backed and restricted to client-bookable practitioners', () => {
  assert.match(source, /JOIN staff_services ss ON ss\.service_id = s\.id/);
  assert.match(source, /JOIN staff st ON st\.id = ss\.staff_id/);
  assert.match(source, /s\.status = 'active'/);
  assert.match(source, /st\.status = 'active'/);
  assert.match(source, /st\.resource_type = 'practitioner'/);
  const scopedBookableChecks = source.match(/st\.client_bookable = TRUE/g) || [];
  assert.ok(scopedBookableChecks.length >= 2);
  assert.match(source, /AND client_bookable = TRUE/);
});

test('service list pagination never exceeds Meta list row bounds', () => {
  assert.equal(SERVICE_PAGE_SIZE, 9);
  const rows = Array.from({ length: 22 }, (_, index) => ({
    id: index + 1,
    name: `Treatment ${index + 1}`,
    duration_minutes: 60,
    price: 500,
  }));
  const first = servicePageInteractive(rows, 1);
  const second = servicePageInteractive(rows, 2);
  const last = servicePageInteractive(rows, 3);
  assert.equal(first.type, 'list');
  assert.equal(first.rows.length, 10);
  assert.equal(second.rows.length, 10);
  assert.ok(last.rows.length <= 10);
  assert.equal(first.rows.at(-1).id, 'client_services_page_2');
  assert.equal(second.rows.at(-1).id, 'client_services_page_3');
});

test('client service and practitioner selections are revalidated before entering booking intent', () => {
  assert.match(source, /findClientBookableService\(serviceMatch\[1\]\)/);
  assert.match(source, /findClientBookablePractitioner\(practitionerMatch\[1\]\)/);
  assert.match(source, /return processBookingMessage\(sender, `Book \$\{service\.name\}`\)/);
  assert.match(source, /return processBookingMessage\(sender, `booking with \$\{practitioner\.display_name\}`\)/);
  assert.doesNotMatch(source, /Savanna|Pieter/);
});

test('non-admin interactive button IDs survive inbound normalization', () => {
  assert.match(webhook, /button_reply[\s\S]*commandForAdminButton\(id\)\|\|id\|\|null/);
  assert.match(webhook, /list_reply[\s\S]*commandForAdminButton\(id\)\|\|id\|\|null/);
});

test('client discovery runs after identity handling but before scope and booking fallthrough', () => {
  const identity = webhook.indexOf('processClientIdentityMessage(from,text)');
  const discovery = webhook.indexOf('processClientDiscoveryMessage(from,text)');
  const scope = webhook.indexOf('evaluateClinicScope(text)');
  const policy = webhook.indexOf('processBookingPolicyMessage(from,text)');
  const booking = webhook.lastIndexOf('processBookingMessage(from,text)');
  assert.ok(identity >= 0 && discovery >= 0 && scope >= 0 && policy >= 0 && booking >= 0);
  assert.ok(identity < discovery);
  assert.ok(discovery < scope);
  assert.ok(scope < policy);
  assert.ok(policy < booking);
});
