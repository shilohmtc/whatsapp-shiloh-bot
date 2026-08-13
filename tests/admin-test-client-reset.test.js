const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const servicePath = 'src/services/adminTestClientReset.js';
const routerPath = 'src/services/adminInteractiveMenu.js';
const serviceSource = fs.readFileSync(servicePath, 'utf8');
const routerSource = fs.readFileSync(routerPath, 'utf8');
const { TEST_CLIENTS, canResetTestClients, targetFromText } = require(`../${servicePath}`);

test('test-client reset is restricted to Chenique, Juvan and Dummy Test', () => {
  assert.deepEqual(TEST_CLIENTS, { chenique: 'Chenique', juvan: 'Juvan', dummy_test: 'Dummy Test' });
  assert.equal(targetFromText('Reset test client Chenique').key, 'chenique');
  assert.equal(targetFromText('admin_test_client_reset_confirm:juvan').key, 'juvan');
  assert.equal(targetFromText('Reset test client Dummy Test').key, 'dummy_test');
  assert.equal(targetFromText('admin_test_client_reset_confirm:dummy_test').key, 'dummy_test');
  assert.equal(targetFromText('Reset test client Abigail'), null);
});

test('only Christel owner/admin and Jean-Pierre business admin can reset test clients', () => {
  assert.equal(canResetTestClients({ display_name: 'Christel', business_role: 'owner', calendar_scope: 'all_business', service_scope: 'all_services' }), true);
  assert.equal(canResetTestClients({ display_name: 'Jean-Pierre', business_role: 'business_admin', calendar_scope: 'all_business', service_scope: 'all_services' }), true);
  assert.equal(canResetTestClients({ display_name: 'Abigail', business_role: 'employee_practitioner', calendar_scope: 'own', service_scope: 'own_services' }), false);
  assert.equal(canResetTestClients({ display_name: 'Marietjie', business_role: 'tenant_practitioner', calendar_scope: 'own', service_scope: 'own_services' }), false);
});

test('reset preserves appointment history while releasing reusable WhatsApp identity', () => {
  assert.match(serviceSource, /UPDATE clients[\s\S]*status='inactive'/);
  assert.match(serviceSource, /DELETE FROM client_contacts/);
  assert.match(serviceSource, /contact_type IN \('whatsapp','mobile'\)/);
  assert.match(serviceSource, /DELETE FROM booking_intents WHERE phone = ANY/);
  assert.match(serviceSource, /DELETE FROM client_onboarding_sessions WHERE phone = ANY/);
  assert.match(serviceSource, /DELETE FROM booking_policy_acceptances WHERE phone = ANY/);
  assert.doesNotMatch(serviceSource, /DELETE FROM clients/);
  assert.doesNotMatch(serviceSource, /DELETE FROM appointments/);
  assert.match(serviceSource, /admin\.test_client_reset/);
});

test('reset requires explicit confirmation and is exposed only through privileged Clients menu enrichment', () => {
  assert.match(serviceSource, /Confirm reset/);
  assert.match(serviceSource, /admin_test_client_reset_confirm:/);
  assert.match(routerSource, /Reset Chenique profile/);
  assert.match(routerSource, /Reset Juvan profile/);
  assert.match(routerSource, /Reset Dummy Test profile/);
  assert.match(routerSource, /\(jeanPierre \|\| christel\)/);
  assert.match(routerSource, /processAdminTestClientResetMessage\(sender, action\.command\)/);
  assert.match(routerSource, /const testClientReset = await processAdminTestClientResetMessage\(sender, text\)/);
});
