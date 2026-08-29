const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createStaleOnboardingIdentityRecovery,
} = require('../src/services/staleOnboardingIdentityRecovery');
const {
  installClientNavigationPriority,
} = require('../src/services/clientNavigationPriority');

const CURRENT_AUTHORITY = 'verified_client_v3_crm_v2_fresh_registration';
const STALE_AUTHORITY = 'verified_client_v2_pre_crm_v2_registration';

function staleDualMasterSession(overrides = {}) {
  return {
    phone: '27820000000',
    client_id: 741,
    crm_v2_client_id: 852,
    identity_model: 'legacy',
    state: 'collect_name',
    booking_requested: true,
    authority_version: STALE_AUTHORITY,
    ...overrides,
  };
}

function fakeRecoveryDb(initialSession) {
  let session = initialSession ? structuredClone(initialSession) : null;
  const calls = { begin: 0, commit: 0, rollback: 0, select: 0, delete: 0, release: 0 };
  const client = {
    async query(sql, params = []) {
      if (sql === 'BEGIN') {
        calls.begin += 1;
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'COMMIT') {
        calls.commit += 1;
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'ROLLBACK') {
        calls.rollback += 1;
        return { rows: [], rowCount: 0 };
      }
      if (/SELECT phone,client_id,crm_v2_client_id,identity_model,state,booking_requested,authority_version/.test(sql)) {
        calls.select += 1;
        assert.equal(params.length, 1);
        return { rows: session ? [structuredClone(session)] : [], rowCount: session ? 1 : 0 };
      }
      if (/^DELETE FROM client_onboarding_sessions /.test(sql)) {
        calls.delete += 1;
        assert.equal(params.length, 1);
        const existed = Boolean(session);
        session = null;
        return { rows: existed ? [{ phone: params[0] }] : [], rowCount: existed ? 1 : 0 };
      }
      throw new Error(`Unexpected recovery SQL: ${String(sql).slice(0, 100)}`);
    },
    release() { calls.release += 1; },
  };
  return {
    db: { async connect() { return client; } },
    calls,
    currentSession: () => structuredClone(session),
  };
}

function buildRecovery({ session = staleDualMasterSession(), legacy, crmV2 } = {}) {
  const db = fakeRecoveryDb(session);
  const resolverCalls = { legacy: 0, crmV2: 0 };
  const recovery = createStaleOnboardingIdentityRecovery({
    db: db.db,
    legacyResolver: async () => {
      resolverCalls.legacy += 1;
      return structuredClone(legacy || {
        status: 'historical_unverified',
        reason: 'history_without_explicit_verification',
        clients: [{ id: 741 }],
      });
    },
    crmV2Resolver: async () => {
      resolverCalls.crmV2 += 1;
      return structuredClone(crmV2 || { status: 'not_found', identity: null, client: null });
    },
  });
  return { recovery, db, resolverCalls };
}

test('stale dual-master historical session is discarded and ordinary canonical retry begins fresh registration', async () => {
  const runtime = buildRecovery();
  let retries = 0;
  const result = await runtime.recovery.recoverAndRetry({
    phone: '27820000000',
    currentAuthorityVersion: CURRENT_AUTHORITY,
    retry: async () => {
      retries += 1;
      assert.equal(runtime.db.currentSession(), null, 'canonical retry must see no stale onboarding session');
      return { handled: true, identityStatus: 'registration_required', reply: 'registration' };
    },
  });

  assert.equal(result.recovered, true);
  assert.equal(result.reason, 'stale_invalid_session_reentered');
  assert.equal(result.result.identityStatus, 'registration_required');
  assert.equal(retries, 1);
  assert.deepEqual(runtime.resolverCalls, { legacy: 1, crmV2: 1 });
  assert.equal(runtime.db.calls.delete, 1);
  assert.equal(runtime.db.calls.commit, 1);
  assert.equal(runtime.db.calls.rollback, 0);
  assert.equal(runtime.db.currentSession(), null);
});

test('genuine legacy ambiguity with no exact CRM V2 authority remains fail closed with zero session mutation', async () => {
  const runtime = buildRecovery({
    legacy: { status: 'ambiguous', reason: 'multiple_active_clients_for_exact_phone', clients: [{ id: 1 }, { id: 2 }] },
    crmV2: { status: 'not_found', identity: null, client: null },
  });
  let retries = 0;
  const result = await runtime.recovery.recoverAndRetry({
    phone: '27820000000',
    currentAuthorityVersion: CURRENT_AUTHORITY,
    retry: async () => { retries += 1; return { handled: false }; },
  });

  assert.equal(result.recovered, false);
  assert.equal(result.reason, 'legacy_manual_review_fail_closed');
  assert.equal(retries, 0);
  assert.deepEqual(runtime.resolverCalls, { legacy: 1, crmV2: 1 });
  assert.equal(runtime.db.calls.delete, 0);
  assert.equal(runtime.db.calls.commit, 0);
  assert.equal(runtime.db.calls.rollback, 1);
  assert.notEqual(runtime.db.currentSession(), null);
});

test('CRM V2 exact-mobile conflict remains fail closed with zero stale-session mutation', async () => {
  const runtime = buildRecovery({
    legacy: { status: 'historical_unverified', reason: 'history_without_explicit_verification', clients: [{ id: 741 }] },
    crmV2: { status: 'conflict', identity: null, client: null },
  });
  const result = await runtime.recovery.recoverAndRetry({
    phone: '27820000000',
    currentAuthorityVersion: CURRENT_AUTHORITY,
    retry: async () => ({ handled: false }),
  });

  assert.equal(result.recovered, false);
  assert.equal(result.reason, 'crm_v2_conflict_fail_closed');
  assert.equal(runtime.db.calls.delete, 0);
  assert.equal(runtime.db.calls.rollback, 1);
  assert.notEqual(runtime.db.currentSession(), null);
});

test('exact CRM V2 authority may discard stale invalid onboarding state but canonical retry remains the binding authority', async () => {
  const runtime = buildRecovery({
    legacy: { status: 'historical_unverified', reason: 'history_without_explicit_verification', clients: [{ id: 741 }] },
    crmV2: { status: 'resolved', identity: { crmV2ClientId: '901' }, client: { id: '901', profileStatus: 'registered' } },
  });
  const result = await runtime.recovery.recoverAndRetry({
    phone: '27820000000',
    currentAuthorityVersion: CURRENT_AUTHORITY,
    retry: async () => {
      assert.equal(runtime.db.currentSession(), null);
      return { handled: false, identityStatus: 'matched_complete', clientIdentity: { identityModel: 'crm_v2' } };
    },
  });

  assert.equal(result.recovered, true);
  assert.equal(result.result.identityStatus, 'matched_complete');
  assert.deepEqual(runtime.resolverCalls, { legacy: 1, crmV2: 1 });
  assert.equal(runtime.db.calls.delete, 1);
});

test('durable verified legacy authority may discard stale invalid onboarding state without consulting CRM V2', async () => {
  const runtime = buildRecovery({
    legacy: { status: 'verified_client', client: { id: 741 }, clients: [{ id: 741 }] },
  });
  const result = await runtime.recovery.recoverAndRetry({
    phone: '27820000000',
    currentAuthorityVersion: CURRENT_AUTHORITY,
    retry: async () => ({ handled: false, identityStatus: 'matched_complete', clientIdentity: { identityModel: 'legacy' } }),
  });

  assert.equal(result.recovered, true);
  assert.equal(result.result.identityStatus, 'matched_complete');
  assert.deepEqual(runtime.resolverCalls, { legacy: 1, crmV2: 0 });
  assert.equal(runtime.db.calls.delete, 1);
});

test('current-authority or complete invalid sessions are never recovered automatically', async () => {
  for (const session of [
    staleDualMasterSession({ authority_version: CURRENT_AUTHORITY }),
    staleDualMasterSession({ state: 'complete' }),
  ]) {
    const runtime = buildRecovery({ session });
    const result = await runtime.recovery.recoverAndRetry({
      phone: '27820000000',
      currentAuthorityVersion: CURRENT_AUTHORITY,
      retry: async () => ({ handled: false }),
    });
    assert.equal(result.recovered, false);
    assert.match(result.reason, /fail_closed$/);
    assert.deepEqual(runtime.resolverCalls, { legacy: 0, crmV2: 0 });
    assert.equal(runtime.db.calls.delete, 0);
    assert.equal(runtime.db.calls.rollback, 1);
  }
});

test('non-recoverable malformed identity contracts remain fail closed', async () => {
  const runtime = buildRecovery({
    session: staleDualMasterSession({ client_id: 'not-a-canonical-id', crm_v2_client_id: null, identity_model: 'legacy' }),
  });
  const result = await runtime.recovery.recoverAndRetry({
    phone: '27820000000',
    currentAuthorityVersion: CURRENT_AUTHORITY,
    retry: async () => ({ handled: false }),
  });
  assert.equal(result.recovered, false);
  assert.equal(result.reason, 'contract_not_recoverable');
  assert.deepEqual(runtime.resolverCalls, { legacy: 0, crmV2: 0 });
  assert.equal(runtime.db.calls.delete, 0);
});

test('navigation wrapper replaces only a recovered identity_contract_invalid result and preserves B1 observability of the original seam', async () => {
  let identityCalls = 0;
  const identityService = {
    AUTHORITY_VERSION: CURRENT_AUTHORITY,
    async processClientIdentityMessage() {
      identityCalls += 1;
      if (identityCalls === 1) return { handled: true, identityStatus: 'identity_contract_invalid', reply: 'human verification' };
      return { handled: true, identityStatus: 'registration_required', reply: 'fresh registration' };
    },
  };
  const discoveryService = { async processClientDiscoveryMessage() { return { handled: false }; } };
  const observed = [];
  const observer = {
    async captureSession() { return { present: true, authorityVersionClass: 'stale' }; },
    async observeAndLog(input) { observed.push(input); },
  };
  const recovery = {
    async recoverAndRetry({ retry }) {
      return { recovered: true, reason: 'stale_invalid_session_reentered', result: await retry() };
    },
  };

  installClientNavigationPriority({
    identityService,
    discoveryService,
    identityDecisionObservability: observer,
    identityRecovery: recovery,
  });
  const result = await identityService.processClientIdentityMessage('27820000000', 'booking');

  assert.equal(identityCalls, 2);
  assert.equal(result.identityStatus, 'registration_required');
  assert.equal(observed.length, 1);
  assert.equal(observed[0].originalResult.identityStatus, 'identity_contract_invalid');
  assert.equal(observed[0].finalResult.identityStatus, 'registration_required');
});

test('navigation recovery errors preserve the original fail-closed result', async () => {
  const expected = { handled: true, identityStatus: 'identity_contract_invalid', reply: 'human verification' };
  const identityService = {
    AUTHORITY_VERSION: CURRENT_AUTHORITY,
    async processClientIdentityMessage() { return expected; },
  };
  const discoveryService = { async processClientDiscoveryMessage() { return { handled: false }; } };
  const recovery = { async recoverAndRetry() { throw new Error('synthetic recovery failure'); } };
  const observer = { async captureSession() { return null; }, async observeAndLog() {} };

  installClientNavigationPriority({
    identityService,
    discoveryService,
    identityDecisionObservability: observer,
    identityRecovery: recovery,
  });
  const result = await identityService.processClientIdentityMessage('27820000000', 'booking');
  assert.equal(result, expected);
});
