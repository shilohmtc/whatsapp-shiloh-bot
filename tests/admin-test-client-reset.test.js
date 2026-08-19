const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const servicePath = 'src/services/adminTestClientReset.js';
const routerPath = 'src/services/adminInteractiveMenu.js';
const serviceSource = fs.readFileSync(servicePath, 'utf8');
const routerSource = fs.readFileSync(routerPath, 'utf8');
const {
  TEST_CLIENTS,
  TEST_CLIENT_ALIASES,
  canResetTestClients,
  targetFromText,
  confirmationInteractive,
  previewTargetRelease,
  resetTargetClient,
} = require(`../${servicePath}`);

function compact(sql) {
  return String(sql).replace(/\s+/g, ' ').trim();
}

function scriptedDb(handler) {
  const calls = [];
  let released = false;
  const db = {
    async query(sql, params = []) {
      const text = compact(sql);
      calls.push({ text, params });
      return handler(text, params, calls);
    },
    release() {
      released = true;
    },
  };
  return { db, calls, wasReleased: () => released };
}

const crmDummy = { id: 4242, display_name: 'CRM Dummy Test', status: 'active' };
const targetContact = {
  id: 9001,
  contact_type: 'whatsapp',
  normalized_value: '27821234567',
  is_primary: true,
};

function previewDb({ conflict = false } = {}) {
  return scriptedDb((sql) => {
    if (sql.includes('FROM clients') && sql.includes("status='active'")) {
      return { rowCount: 1, rows: [crmDummy] };
    }
    if (sql.includes('FROM client_contacts') && sql.includes('WHERE client_id=$1')) {
      return { rowCount: 1, rows: [targetContact] };
    }
    if (sql.includes('SELECT DISTINCT cc.client_id')) {
      return conflict
        ? { rowCount: 1, rows: [{ client_id: 777, display_name: 'Other Active Client' }] }
        : { rowCount: 0, rows: [] };
    }
    throw new Error(`Unexpected preview SQL: ${sql}`);
  });
}

function transactionDb({ conflict = false, residualCount = 0 } = {}) {
  return scriptedDb((sql) => {
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rowCount: 0, rows: [] };
    if (sql.includes('FROM clients') && sql.includes("status='active'") && sql.includes('FOR UPDATE')) {
      return { rowCount: 1, rows: [crmDummy] };
    }
    if (sql.includes('FROM client_contacts') && sql.includes('WHERE client_id=$1') && sql.includes('FOR UPDATE')) {
      return { rowCount: 1, rows: [targetContact] };
    }
    if (sql.includes('SELECT DISTINCT cc.client_id')) {
      return conflict
        ? { rowCount: 1, rows: [{ client_id: 777, display_name: 'Other Active Client' }] }
        : { rowCount: 0, rows: [] };
    }
    if (sql.startsWith('DELETE FROM booking_intents')) return { rowCount: 1, rows: [] };
    if (sql.startsWith('DELETE FROM client_onboarding_sessions')) return { rowCount: 1, rows: [] };
    if (sql.startsWith('DELETE FROM booking_policy_acceptances')) return { rowCount: 1, rows: [] };
    if (sql.startsWith('SELECT to_regclass')) return { rowCount: 1, rows: [{ table_name: null }] };
    if (sql.startsWith('DELETE FROM client_contacts')) return { rowCount: 1, rows: [] };
    if (sql.startsWith('SELECT COUNT(*)::int AS count FROM client_contacts')) {
      return { rowCount: 1, rows: [{ count: residualCount }] };
    }
    if (sql.startsWith('UPDATE clients SET status=')) return { rowCount: 1, rows: [] };
    if (sql.startsWith('INSERT INTO crm_audit_events')) return { rowCount: 1, rows: [] };
    throw new Error(`Unexpected transaction SQL: ${sql}`);
  });
}

test('test-client reset eligibility remains restricted to the approved identities', () => {
  assert.deepEqual(TEST_CLIENTS, { chenique: 'Chenique', juvan: 'Juvan', dummy_test: 'Dummy Test' });
  assert.deepEqual(TEST_CLIENT_ALIASES.dummy_test, ['Dummy Test', 'CRM Dummy Test']);
  assert.equal(targetFromText('Reset test client Chenique').key, 'chenique');
  assert.equal(targetFromText('Reset test client Juvan').key, 'juvan');
  assert.equal(targetFromText('Reset test client Dummy Test').key, 'dummy_test');
  assert.equal(targetFromText('Reset test client CRM Dummy Test').key, 'dummy_test');
  assert.equal(targetFromText('admin_test_client_reset_confirm:dummy_test').key, 'dummy_test');
  assert.equal(targetFromText('Reset test client Abigail'), null);
  assert.equal(targetFromText('Reset test client Other Client'), null);
});

test('only Christel owner/admin and Jean-Pierre business admin can reset test clients', () => {
  assert.equal(canResetTestClients({ display_name: 'Christel', business_role: 'owner', calendar_scope: 'all_business', service_scope: 'all_services' }), true);
  assert.equal(canResetTestClients({ display_name: 'Jean-Pierre', business_role: 'business_admin', calendar_scope: 'all_business', service_scope: 'all_services' }), true);
  assert.equal(canResetTestClients({ display_name: 'Abigail', business_role: 'employee_practitioner', calendar_scope: 'own', service_scope: 'own_services' }), false);
  assert.equal(canResetTestClients({ display_name: 'Marietjie', business_role: 'tenant_practitioner', calendar_scope: 'own', service_scope: 'own_services' }), false);
});

test('preview shows the actual CRM Dummy Test profile and intended phone identity before confirmation', async () => {
  const { db } = previewDb();
  const preview = await previewTargetRelease('dummy_test', db);
  assert.equal(preview.status, 'ready');
  assert.equal(preview.client.display_name, 'CRM Dummy Test');
  assert.deepEqual(preview.phones, ['27821234567']);

  const interactive = confirmationInteractive('dummy_test', preview.client, preview.contacts);
  assert.match(interactive.body, /CRM profile: CRM Dummy Test/);
  assert.match(interactive.body, /CRM ID: #4242/);
  assert.match(interactive.body, /WhatsApp: \+27821234567 — primary/);
  assert.match(interactive.body, /Confirm only if this is the exact CRM profile and phone identity intended for reassignment/);
  assert.doesNotMatch(interactive.body, /^\*Reset Dummy Test test client\?\*/m);
});

test('preview fails closed before Confirm when the target phone is shared with another active client', async () => {
  const { db, calls } = previewDb({ conflict: true });
  const preview = await previewTargetRelease('dummy_test', db);
  assert.equal(preview.status, 'identity_conflict');
  assert.equal(preview.client.display_name, 'CRM Dummy Test');
  assert.deepEqual(preview.phones, ['27821234567']);
  assert.equal(preview.conflicts[0].client_id, 777);
  assert.ok(calls.some(({ text }) => text.includes('SELECT DISTINCT cc.client_id')));
});

test('transaction rechecks shared-active identity after confirmation and rolls back on a race', async () => {
  const { db, calls, wasReleased } = transactionDb({ conflict: true });
  const result = await resetTargetClient(
    { id: 12, display_name: 'Jean-Pierre' },
    'dummy_test',
    { connect: async () => db }
  );

  assert.equal(result.status, 'identity_conflict');
  assert.ok(calls.some(({ text }) => text.includes('SELECT DISTINCT cc.client_id')));
  assert.ok(calls.some(({ text }) => text === 'ROLLBACK'));
  assert.equal(calls.some(({ text }) => text.startsWith('DELETE FROM client_contacts')), false);
  assert.equal(calls.some(({ text }) => text.startsWith('UPDATE clients SET status=')), false);
  assert.equal(wasReleased(), true);
});

test('residual WhatsApp/mobile binding fails the postcondition and rolls the transaction back', async () => {
  const { db, calls, wasReleased } = transactionDb({ residualCount: 1 });
  await assert.rejects(
    resetTargetClient(
      { id: 12, display_name: 'Jean-Pierre' },
      'dummy_test',
      { connect: async () => db }
    ),
    /identity release postcondition failed/
  );

  assert.ok(calls.some(({ text }) => text.startsWith('DELETE FROM client_contacts')));
  assert.ok(calls.some(({ text }) => text === 'ROLLBACK'));
  assert.equal(calls.some(({ text }) => text === 'COMMIT'), false);
  assert.equal(calls.some(({ text }) => text.startsWith('UPDATE clients SET status=')), false);
  assert.equal(calls.some(({ text }) => text.startsWith('INSERT INTO crm_audit_events')), false);
  assert.equal(wasReleased(), true);
});

test('successful reset releases only phone identity, archives the client and preserves appointments/audit history', async () => {
  const { db, calls, wasReleased } = transactionDb({ residualCount: 0 });
  const result = await resetTargetClient(
    { id: 12, display_name: 'Jean-Pierre' },
    'dummy_test',
    { connect: async () => db }
  );

  assert.equal(result.status, 'reset');
  assert.ok(calls.some(({ text }) => text.startsWith('DELETE FROM booking_intents')));
  assert.ok(calls.some(({ text }) => text.startsWith('DELETE FROM client_onboarding_sessions')));
  assert.ok(calls.some(({ text }) => text.startsWith('DELETE FROM booking_policy_acceptances')));
  assert.ok(calls.some(({ text }) => text.startsWith('DELETE FROM client_contacts')));
  assert.ok(calls.some(({ text }) => text.startsWith('UPDATE clients SET status=')));
  assert.ok(calls.some(({ text }) => text.startsWith('INSERT INTO crm_audit_events')));
  assert.ok(calls.some(({ text }) => text === 'COMMIT'));
  assert.equal(calls.some(({ text }) => /^DELETE FROM clients\b/.test(text)), false);
  assert.equal(calls.some(({ text }) => /^DELETE FROM appointments\b/.test(text)), false);
  assert.equal(calls.some(({ text }) => /^DELETE FROM crm_audit_events\b/.test(text)), false);

  const auditCall = calls.find(({ text }) => text.startsWith('INSERT INTO crm_audit_events'));
  const metadata = JSON.parse(auditCall.params[2]);
  assert.equal(metadata.displayName, 'CRM Dummy Test');
  assert.equal(metadata.preservedAppointmentHistory, true);
  assert.equal(metadata.releasedIdentityCount, 1);
  assert.equal(wasReleased(), true);
});

test('temporary phone state cleanup and explicit confirmation route remain wired', () => {
  assert.match(serviceSource, /DELETE FROM conversation_sessions WHERE phone = ANY/);
  assert.match(serviceSource, /DELETE FROM user_profiles[\s\S]*regexp_replace\(phone::text, '\[\^0-9\]'/);
  assert.match(serviceSource, /admin_test_client_reset_confirm:/);
  assert.match(serviceSource, /processAdminTestClientResetMessage/);
  assert.match(routerSource, /processAdminTestClientResetMessage\(sender, action\.command\)/);
  assert.match(routerSource, /const testClientReset = await processAdminTestClientResetMessage\(sender, text\)/);
});
