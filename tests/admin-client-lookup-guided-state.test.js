const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileMenu.js'), 'utf8');

test('Find a client enters a short-lived guided lookup state', () => {
  assert.match(source, /CLIENT_LOOKUP_TTL_MS = 2 \* 60 \* 1000/);
  assert.match(source, /step:'client_lookup',expiresAt:Date\.now\(\)\+CLIENT_LOOKUP_TTL_MS/);
  assert.match(source, /guided\?\.step==='client_lookup'/);
});

test('guided lookup accepts a bare name, Find name, Find client name, or mobile input', () => {
  assert.match(source, /function normalizeGuidedClientQuery/);
  assert.match(source, /replace\(\/\^\(\?:find\|lookup\|search/);
  assert.match(source, /reply:await scopedClientLookup\(admin,q\)/);
  assert.match(source, /You can type the name directly/);
  assert.match(source, /Find Juvan/);
  assert.match(source, /mobile number/);
});

test('guided lookup remains permission scoped and exits cleanly', () => {
  assert.match(source, /filterClientsForAdminScope\(admin,found\.clients\)/);
  assert.match(source, /\['menu','admin menu','home','admin'\]\.includes\(v\)/);
  assert.match(source, /v==='0'\|\|v==='back'\|\|v==='cancel'/);
  assert.match(source, /moreSessions\.delete\(k\)/);
});
