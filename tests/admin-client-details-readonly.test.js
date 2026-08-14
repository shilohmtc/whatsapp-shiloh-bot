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

test('client details request reuses the existing permission gate and scope filter', () => {
  assert.match(menuSource, /clientCommand&&has\(admin,'client:lookup'\)/);
  assert.match(menuSource, /filterClientsForAdminScope/);
  assert.match(lookupSource, /details\s+#?\(\\d\+\)/);
});

test('single safe lookup advertises an explicit details request without unmasking the search result', () => {
  assert.match(lookupSource, /Find client details/);
  assert.match(lookupSource, /formatClientLookupReply/);
  assert.match(lookupSource, /maskContact/);
});
