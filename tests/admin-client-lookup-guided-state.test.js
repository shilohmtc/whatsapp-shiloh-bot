const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mobile = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileMenu.js'), 'utf8');
const interactive = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js'), 'utf8');
const { classifyRetiredAdminAction } = require('../src/services/adminAuthorityRetirement');

test('ordinary Admin no longer creates or resumes guided client lookup state', () => {
  assert.doesNotMatch(mobile, /CLIENT_LOOKUP_TTL_MS|client_lookup|scopedClientLookup|filterClientsForAdminScope|findClients/);
  assert.doesNotMatch(interactive, /processAdminClientLookup|scopedClientLookup|clientGuide/);
});

test('old client lookup aliases and action IDs retire before ordinary staff routing', () => {
  for (const input of [
    'Find a client',
    'Find my client',
    'Find client Juvan',
    'Lookup client Juvan',
    'Client find Juvan',
    'Client details',
    'admin_action_client',
  ]) assert.equal(classifyRetiredAdminAction(input)?.kind, 'retired', input);
});

test('underlying CRM lookup implementation is not deleted by menu retirement', () => {
  const lookup = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminClientLookup.js'), 'utf8');
  assert.match(lookup, /findClients/);
  assert.match(lookup, /formatClientLookupReply/);
});
