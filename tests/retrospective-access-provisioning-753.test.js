'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  AUTHORIZED_RUN_ID,
  RECORD_PAST,
  RECORD_PAST_CLIENT_IDS,
  validateSnapshot,
  execute,
  runConfigured,
} = require('../src/services/retrospectiveAccessProvisioning753');

function noDatabase() {
  return {
    connect() {
      throw new Error('database access must not occur');
    },
  };
}

function principal({
  id,
  staffId = null,
  businessRole,
  calendarScope,
  serviceScope,
  permissions = { 'appointment:create': true },
  staffStatus = null,
}) {
  return {
    id,
    staff_id: staffId,
    admin_active: true,
    business_role: businessRole,
    calendar_scope: calendarScope,
    service_scope: serviceScope,
    permissions,
    staff_status: staffStatus,
  };
}

function safeSnapshot(overrides = {}) {
  return {
    naomi: [principal({
      id: 101,
      businessRole: 'booking_operator',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
    })],
    marietjie: [principal({
      id: 102,
      staffId: 12,
      businessRole: 'tenant_practitioner',
      calendarScope: 'own_services',
      serviceScope: 'own_services',
      staffStatus: 'active',
    })],
    jp: [principal({
      id: 103,
      businessRole: 'business_admin',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
    })],
    christel: [principal({
      id: 104,
      staffId: 14,
      businessRole: 'owner',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      staffStatus: 'active',
    })],
    demoClient: [{ id: 9001 }],
    holders: [],
    ...overrides,
  };
}

test('production provisioning is inert without an explicit mode', async () => {
  assert.deepEqual(await runConfigured({ env: {}, dbPool: noDatabase() }), { status: 'disabled' });
});

test('production provisioning refuses an invalid mode before database access', async () => {
  const result = await runConfigured({
    env: {
      SHILOH_RETROSPECTIVE_ACCESS_753_MODE: 'anything-else',
    },
    dbPool: noDatabase(),
  });
  assert.deepEqual(result, { status: 'refused', reason: 'invalid_mode' });
});

test('production provisioning refuses a release-SHA mismatch before database access', async () => {
  const result = await runConfigured({
    env: {
      SHILOH_RETROSPECTIVE_ACCESS_753_MODE: 'preflight',
      SHILOH_RETROSPECTIVE_ACCESS_753_RELEASE_SHA: 'a'.repeat(40),
      RENDER_GIT_COMMIT: 'b'.repeat(40),
    },
    dbPool: noDatabase(),
  });
  assert.deepEqual(result, { status: 'refused', reason: 'release_sha_mismatch' });
});

test('preflight validation freezes the exact canonical ids without granting anything', () => {
  const result = validateSnapshot(safeSnapshot());
  assert.equal(result.safe, true);
  assert.deepEqual(result.reasons, []);
  assert.deepEqual(result.ids, {
    naomiAdminId: 101,
    marietjieAdminId: 102,
    jpAdminId: 103,
    christelAdminId: 104,
    demoCrmV2ClientId: 9001,
  });
  assert.deepEqual(result.current.existingHolderIds, []);
});

test('preflight fails closed when an unrelated active principal already holds record-past authority', () => {
  const result = validateSnapshot(safeSnapshot({ holders: [{ id: 777 }] }));
  assert.equal(result.safe, false);
  assert.ok(result.reasons.includes('unexpected_existing_record_past_holder'));
});

test('preflight fails closed if Christel already has retrospective authority', () => {
  const snapshot = safeSnapshot({
    christel: [principal({
      id: 104,
      staffId: 14,
      businessRole: 'owner',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      staffStatus: 'active',
      permissions: { 'appointment:create': true, [RECORD_PAST]: true },
    })],
    holders: [{ id: 104 }],
  });
  const result = validateSnapshot(snapshot);
  assert.equal(result.safe, false);
  assert.ok(result.reasons.includes('christel_must_remain_ungranted'));
});

test('final-state validation requires Naomi and Marietjie unrestricted and JP restricted to exactly the demo client', () => {
  const snapshot = safeSnapshot({
    naomi: [principal({
      id: 101,
      businessRole: 'booking_operator',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      permissions: { 'appointment:create': true, [RECORD_PAST]: true },
    })],
    marietjie: [principal({
      id: 102,
      staffId: 12,
      businessRole: 'tenant_practitioner',
      calendarScope: 'own_services',
      serviceScope: 'own_services',
      staffStatus: 'active',
      permissions: { 'appointment:create': true, [RECORD_PAST]: true },
    })],
    jp: [principal({
      id: 103,
      businessRole: 'business_admin',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      permissions: {
        'appointment:create': true,
        [RECORD_PAST]: true,
        [RECORD_PAST_CLIENT_IDS]: [9001],
      },
    })],
    holders: [{ id: 101 }, { id: 102 }, { id: 103 }],
  });
  const expectedIds = {
    naomiAdminId: 101,
    marietjieAdminId: 102,
    jpAdminId: 103,
    demoCrmV2ClientId: 9001,
  };
  const result = validateSnapshot(snapshot, { expectedIds, requireFinalState: true });
  assert.equal(result.safe, true);
});

test('final-state validation rejects a broader or different JP client restriction', () => {
  const snapshot = safeSnapshot({
    naomi: [principal({
      id: 101,
      businessRole: 'booking_operator',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      permissions: { 'appointment:create': true, [RECORD_PAST]: true },
    })],
    marietjie: [principal({
      id: 102,
      staffId: 12,
      businessRole: 'tenant_practitioner',
      calendarScope: 'own_services',
      serviceScope: 'own_services',
      staffStatus: 'active',
      permissions: { 'appointment:create': true, [RECORD_PAST]: true },
    })],
    jp: [principal({
      id: 103,
      businessRole: 'business_admin',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      permissions: {
        'appointment:create': true,
        [RECORD_PAST]: true,
        [RECORD_PAST_CLIENT_IDS]: [9001, 9002],
      },
    })],
    holders: [{ id: 101 }, { id: 102 }, { id: 103 }],
  });
  const result = validateSnapshot(snapshot, {
    expectedIds: {
      naomiAdminId: 101,
      marietjieAdminId: 102,
      jpAdminId: 103,
      demoCrmV2ClientId: 9001,
    },
    requireFinalState: true,
  });
  assert.equal(result.safe, false);
  assert.ok(result.reasons.includes('jp_final_policy_mismatch'));
});

test('execute refuses a non-authorized run id before database access', async () => {
  const result = await execute({
    dbPool: noDatabase(),
    runId: 'wrong-run',
    expectedIds: {
      naomiAdminId: 101,
      marietjieAdminId: 102,
      jpAdminId: 103,
      demoCrmV2ClientId: 9001,
    },
  });
  assert.deepEqual(result, { status: 'refused', reason: 'run_id_mismatch' });
});

test('execute refuses incomplete frozen ids before database access', async () => {
  const result = await execute({
    dbPool: noDatabase(),
    runId: AUTHORIZED_RUN_ID,
    expectedIds: {
      naomiAdminId: 101,
      marietjieAdminId: 102,
      jpAdminId: 103,
      demoCrmV2ClientId: null,
    },
  });
  assert.deepEqual(result, { status: 'refused', reason: 'expected_ids_incomplete' });
});
