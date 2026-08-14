const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lookupSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminClientLookup.js'), 'utf8');
const menuSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileMenu.js'), 'utf8');

test('client lookup keeps masked summary but exposes a separate read-only details formatter', () => {
  assert.match(lookupSource, /maskContact/);
  assert.match(lookupSource, /async function getClientDetails\(/);
  assert.match(lookupSource, /function formatClientDetailsReply\(/);
  assert.match(lookupSource, /Mobile:/);
  assert.match(lookupSource, /This is a read-only client detail view/);
  assert.doesNotMatch(lookupSource, /\b(?:UPDATE|INSERT|DELETE)\s+(?:clients|client_contacts)\b/i);
});

test('client details action is permission gated and scope revalidated before display', () => {
  assert.match(menuSource, /admin_client_details_\(\\d\+\)/);
  assert.match(menuSource, /client:lookup/);
  assert.match(menuSource, /filterClientsForAdminScope/);
  assert.match(menuSource, /admin\.client_details_viewed/);
});

test('single safe lookup offers an explicit details action rather than unmasking the search result', () => {
  assert.match(menuSource, /View contact details/);
  assert.match(menuSource, /admin_client_details_/);
});
