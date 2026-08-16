const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lookupSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminClientLookup.js'), 'utf8');
const menuSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileMenu.js'), 'utf8');

test('client lookup retains masked ambiguity handling and a read-only full-details formatter', () => {
  assert.match(lookupSource, /maskContact/);
  assert.match(lookupSource, /async function getClientDetails\(/);
  assert.match(lookupSource, /function formatClientDetailsReply\(/);
  assert.match(lookupSource, /return "Mobile"/);
  assert.match(lookupSource, /This is a read-only client detail view/);
  assert.doesNotMatch(lookupSource, /\b(?:UPDATE|INSERT|DELETE)\s+(?:clients|client_contacts)\b/i);
});

test('client details request reuses the existing permission gate and scope filter', () => {
  assert.match(menuSource, /clientCommand&&has\(admin,'client:lookup'\)/);
  assert.match(menuSource, /filterClientsForAdminScope/);
  assert.match(lookupSource, /const detailsMatch = cleaned\.match/);
  assert.match(lookupSource, /getClientDetails\(detailsMatch\[1\]\)/);
  assert.match(lookupSource, /queryType: "details"/);
});

test('a single authorized lookup returns full read-only details while ambiguous results stay masked', () => {
  assert.match(lookupSource, /if \(clients\.length === 1\) return formatClientDetailsReply\(clients\[0\]\)/);
  assert.match(lookupSource, /Refine the name or number to narrow the lookup/);
  assert.match(lookupSource, /maskContact/);
  assert.match(lookupSource, /contactLabel\(contact\)\}: \$\{value\}/);
});
