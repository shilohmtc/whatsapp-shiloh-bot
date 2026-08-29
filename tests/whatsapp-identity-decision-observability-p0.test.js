const test = require('node:test');
const assert = require('node:assert/strict');

const {
  EVENT_NAME,
  createWhatsAppIdentityDecisionObservability,
} = require('../src/services/whatsappIdentityDecisionObservability');
const {
  runWithRequestLog,
  currentRequestLog,
} = require('../src/lib/requestLogContext');
const {
  installClientNavigationPriority,
} = require('../src/services/clientNavigationPriority');

const AUTHORITY_VERSION = 'verified_client_v3_crm_v2_fresh_registration';

function capturingLogger() {
  const records = [];
  return {
    records,
    info(payload, message) {
      records.push({ payload, message });
    },
  };
}

function fakeDb(row) {
  return {
    async query(sql, params) {
      assert.match(sql, /^SELECT client_id,crm_v2_client_id,identity_model,state,authority_version /);
      assert.equal(params.length, 1);
      return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
    },
  };
}

test('request-scoped logger remains available across asynchronous identity work', async () => {
  const logger = capturingLogger();
  assert.equal(currentRequestLog(), null);
  await runWithRequestLog(logger, async () => {
    await Promise.resolve();
    assert.equal(currentRequestLog(), logger);
  });
  assert.equal(currentRequestLog(), null);
});

test('identity decision event is fixed-schema and excludes PII and identity values by construction', async () => {
  const trapPhone = '27829998888';
  const trapClientId = '991111';
  const trapCrmV2ClientId = '882222';
  const trapName = 'Sensitive Person';
  const trapDob = '1991-02-03';
  const trapMessage = 'private inbound and outbound text';
  const observer = createWhatsAppIdentityDecisionObservability({
    db: fakeDb({
      client_id: trapClientId,
      crm_v2_client_id: trapCrmV2ClientId,
      identity_model: 'legacy',
      state: 'collect_name',
      authority_version: 'stale_authority',
      pending_name: trapName,
      pending_date_of_birth: trapDob,
    }),
    legacyResolver: async () => ({
      status: 'historical_unverified',
      reason: 'history_without_explicit_verification',
      clients: [{ id: trapClientId, display_name: trapName, date_of_birth: trapDob }],
    }),
    crmV2Resolver: async () => ({
      status: 'not_found',
      normalizedMobile: trapPhone,
      clientIds: [trapCrmV2ClientId],
    }),
  });
  const logger = capturingLogger();
  const sessionBefore = await observer.captureSession(trapPhone, AUTHORITY_VERSION);
  const result = {
    handled: true,
    identityStatus: 'identity_contract_invalid',
    reply: trapMessage,
    client: { id: trapClientId, display_name: trapName },
  };

  const event = await observer.observeAndLog({
    logger,
    phone: trapPhone,
    currentAuthorityVersion: AUTHORITY_VERSION,
    sessionBefore,
    originalResult: result,
    finalResult: result,
  });

  assert.equal(logger.records.length, 1);
  assert.equal(logger.records[0].message, EVENT_NAME);
  assert.deepEqual(event, {
    event: 'whatsapp_identity_decision',
    resolverStatus: 'identity_contract_invalid',
    resolverReasonCode: 'persisted_identity_contract_invalid',
    resolutionObservationClass: 'diagnostic_post_decision',
    selectedConsumer: 'client_identity_onboarding',
    selectedRoute: 'existing_session_contract_invalid',
    crmV2ResolutionClass: 'not_found',
    legacyResolutionClass: 'historical_unverified',
    candidateCountBucket: 'one',
    durableVerifiedLegacyAuthority: false,
    onboardingSessionPresent: true,
    onboardingState: 'collect_name',
    authorityVersionClass: 'stale',
    clientIdPresent: true,
    crmV2ClientIdPresent: true,
    identityModelPresent: true,
    finalResponseClass: 'human_verification',
  });

  const serialized = JSON.stringify(logger.records[0]);
  for (const forbidden of [trapPhone, trapClientId, trapCrmV2ClientId, trapName, trapDob, trapMessage]) {
    assert.equal(serialized.includes(forbidden), false, `event must not contain ${forbidden}`);
  }
  for (const forbiddenKey of ['phone', 'mobile', 'name', 'dob', 'reply', 'messageText', 'client', 'contact', 'appointment', 'token', 'credential', 'secret']) {
    assert.equal(Object.keys(event).some((key) => key.toLowerCase() === forbiddenKey.toLowerCase()), false);
  }
});

test('navigation wrapper emits observability without changing the original identity result', async () => {
  const logger = capturingLogger();
  const observed = [];
  const identityService = {
    AUTHORITY_VERSION,
    async processClientIdentityMessage() {
      return { handled: true, identityStatus: 'identity_contract_invalid', reply: 'same result' };
    },
  };
  const discoveryService = {
    async processClientDiscoveryMessage(_sender, text) { return { handled: true, text }; },
  };
  const observer = {
    async captureSession() {
      return {
        present: true,
        onboardingState: 'collect_name',
        authorityVersionClass: 'stale',
        clientIdPresent: true,
        crmV2ClientIdPresent: true,
        identityModelPresent: true,
      };
    },
    async observeAndLog(input) { observed.push(input); },
  };

  installClientNavigationPriority({ identityService, discoveryService, identityDecisionObservability: observer });
  const result = await runWithRequestLog(logger, () => identityService.processClientIdentityMessage('27820000000', 'continue'));

  assert.deepEqual(result, { handled: true, identityStatus: 'identity_contract_invalid', reply: 'same result' });
  assert.equal(observed.length, 1);
  assert.equal(observed[0].logger, logger);
  assert.equal(observed[0].originalResult, result);
  assert.equal(observed[0].finalResult, result);
  assert.equal(observed[0].navigationKind, null);
});

test('navigation observer failures are fail-open and cannot change identity routing', async () => {
  const logger = capturingLogger();
  const expected = { handled: true, identityStatus: 'registration_required', reply: 'unchanged' };
  const identityService = {
    async processClientIdentityMessage() { return expected; },
  };
  const discoveryService = {
    async processClientDiscoveryMessage() { return { handled: false }; },
  };
  const observer = {
    async captureSession() { throw new Error('synthetic observer failure'); },
    async observeAndLog() { throw new Error('synthetic emit failure'); },
  };

  installClientNavigationPriority({ identityService, discoveryService, identityDecisionObservability: observer });
  const actual = await runWithRequestLog(logger, () => identityService.processClientIdentityMessage('27820000000', 'booking'));
  assert.equal(actual, expected);
});

async function loadSyntheticOnboarding({ initialSession, legacyResult, crmV2Result }) {
  const poolModule = require('../src/db/pool');
  const verifiedModule = require('../src/services/clientVerifiedIdentity');
  const compatModule = require('../src/services/whatsappCrmV2IdentityCompat');
  const onboardingPath = require.resolve('../src/services/clientIdentityOnboarding');

  const originalQuery = poolModule.pool.query;
  const originalLegacyResolver = verifiedModule.resolveVerifiedClientByWhatsApp;
  const originalCompatFactory = compatModule.createWhatsAppCrmV2IdentityCompatService;
  let session = initialSession ? structuredClone(initialSession) : null;
  const calls = { legacy: 0, crmV2: 0, sessionWrites: 0 };

  poolModule.pool.query = async (sql, params = []) => {
    if (/^ALTER TABLE client_onboarding_sessions /.test(sql)) return { rows: [], rowCount: 0 };
    if (/^SELECT phone,client_id,crm_v2_client_id,identity_model,state/.test(sql)) {
      return { rows: session ? [structuredClone(session)] : [], rowCount: session ? 1 : 0 };
    }
    if (/^INSERT INTO client_onboarding_sessions /.test(sql)) {
      calls.sessionWrites += 1;
      session = {
        phone: params[0],
        client_id: params[1],
        crm_v2_client_id: params[2],
        identity_model: params[3],
        state: params[4],
        pending_name: params[5],
        pending_contact: params[6],
        pending_date_of_birth: params[7],
        pending_gender: params[8],
        booking_requested: params[9],
        authority_version: params[10],
      };
      return { rows: [structuredClone(session)], rowCount: 1 };
    }
    throw new Error(`Unexpected synthetic SQL: ${String(sql).slice(0, 80)}`);
  };

  verifiedModule.resolveVerifiedClientByWhatsApp = async () => {
    calls.legacy += 1;
    return structuredClone(legacyResult);
  };
  compatModule.createWhatsAppCrmV2IdentityCompatService = () => ({
    async resolveCrmV2ByExactMobile() {
      calls.crmV2 += 1;
      return structuredClone(crmV2Result);
    },
    async revalidateSessionIdentity() {
      return { status: 'crm_v2_stale', recovery: 'manual_rebind_required', audit: null };
    },
  });

  delete require.cache[onboardingPath];
  const onboarding = require(onboardingPath);

  return {
    onboarding,
    calls,
    currentSession: () => structuredClone(session),
    restore() {
      delete require.cache[onboardingPath];
      poolModule.pool.query = originalQuery;
      verifiedModule.resolveVerifiedClientByWhatsApp = originalLegacyResolver;
      compatModule.createWhatsAppCrmV2IdentityCompatService = originalCompatFactory;
    },
  };
}

test('stale dual-master session terminates at identity_contract_invalid before reset or canonical re-resolution', async () => {
  const runtime = await loadSyntheticOnboarding({
    initialSession: {
      phone: '27820000000',
      client_id: 741,
      crm_v2_client_id: 852,
      identity_model: 'legacy',
      state: 'collect_name',
      pending_name: null,
      pending_contact: '27820000000',
      pending_date_of_birth: null,
      pending_gender: null,
      booking_requested: true,
      authority_version: 'verified_client_v2_pre_crm_v2_registration',
    },
    legacyResult: {
      status: 'historical_unverified',
      reason: 'history_without_explicit_verification',
      clients: [{ id: 741, has_appointment_history: true }],
    },
    crmV2Result: { status: 'not_found', identity: null, client: null, audit: null },
  });

  try {
    const result = await runtime.onboarding.processClientIdentityMessage('27820000000', 'booking');
    assert.equal(result.identityStatus, 'identity_contract_invalid');
    assert.equal(result.reply, runtime.onboarding.HUMAN_VERIFICATION_REPLY);
    assert.deepEqual(runtime.calls, { legacy: 0, crmV2: 0, sessionWrites: 0 });
    const durable = runtime.currentSession();
    assert.equal(durable.client_id, 741);
    assert.equal(durable.crm_v2_client_id, 852);
    assert.equal(durable.authority_version, 'verified_client_v2_pre_crm_v2_registration');
  } finally {
    runtime.restore();
  }
});

test('valid stale session enters current-authority reset and re-entry while clearing non-authoritative identity state', async () => {
  const staleSession = {
    phone: '27820000000',
    client_id: 741,
    crm_v2_client_id: null,
    identity_model: 'legacy',
    state: 'collect_name',
    pending_name: null,
    pending_contact: '27820000000',
    pending_date_of_birth: null,
    pending_gender: null,
    booking_requested: true,
    authority_version: 'verified_client_v2_pre_crm_v2_registration',
  };
  const legacyResult = {
    status: 'historical_unverified',
    reason: 'history_without_explicit_verification',
    clients: [{ id: 741, has_appointment_history: true }],
    client: { id: 741 },
  };
  const crmV2Result = { status: 'not_found', identity: null, client: null, audit: null };
  const runtime = await loadSyntheticOnboarding({ initialSession: staleSession, legacyResult, crmV2Result });

  let result;
  try {
    result = await runtime.onboarding.processClientIdentityMessage('27820000000', 'booking');
    assert.equal(result.handled, true);
    assert.equal(result.identityStatus, undefined);
    assert.deepEqual(runtime.calls, { legacy: 1, crmV2: 0, sessionWrites: 2 });
    const durable = runtime.currentSession();
    assert.equal(durable.client_id, null);
    assert.equal(durable.crm_v2_client_id, null);
    assert.equal(durable.identity_model, null);
    assert.equal(durable.state, 'collect_name');
    assert.equal(durable.authority_version, AUTHORITY_VERSION);
  } finally {
    runtime.restore();
  }

  const observer = createWhatsAppIdentityDecisionObservability({
    db: fakeDb(staleSession),
    legacyResolver: async () => structuredClone(legacyResult),
    crmV2Resolver: async () => structuredClone(crmV2Result),
  });
  const logger = capturingLogger();
  const sessionBefore = await observer.captureSession('27820000000', AUTHORITY_VERSION);
  const event = await observer.observeAndLog({
    logger,
    phone: '27820000000',
    currentAuthorityVersion: AUTHORITY_VERSION,
    sessionBefore,
    originalResult: result,
    finalResult: result,
  });

  assert.equal(event.selectedRoute, 'stale_session_reset_reentry');
  assert.equal(event.legacyResolutionClass, 'historical_unverified');
  assert.equal(event.crmV2ResolutionClass, 'not_found');
  assert.equal(event.durableVerifiedLegacyAuthority, false);
  assert.equal(event.onboardingSessionPresent, true);
  assert.equal(event.authorityVersionClass, 'stale');
  assert.equal(event.clientIdPresent, true);
  assert.equal(event.crmV2ClientIdPresent, false);
  assert.equal(event.identityModelPresent, true);
  assert.equal(logger.records.length, 1);
});

test('ordinary historical_unverified with no exact CRM V2 authority still enters fresh registration', async () => {
  const runtime = await loadSyntheticOnboarding({
    initialSession: null,
    legacyResult: {
      status: 'historical_unverified',
      reason: 'history_without_explicit_verification',
      clients: [{ id: 741, has_appointment_history: true }],
      client: { id: 741 },
    },
    crmV2Result: { status: 'not_found', identity: null, client: null, audit: null },
  });

  try {
    const result = await runtime.onboarding.processClientIdentityMessage('27820000000', 'booking');
    assert.equal(result.identityStatus, 'registration_required');
    assert.equal(result.client, null);
    assert.deepEqual(runtime.calls, { legacy: 1, crmV2: 1, sessionWrites: 1 });
    const durable = runtime.currentSession();
    assert.equal(durable.client_id, null);
    assert.equal(durable.crm_v2_client_id, null);
    assert.equal(durable.identity_model, null);
    assert.equal(durable.authority_version, AUTHORITY_VERSION);
  } finally {
    runtime.restore();
  }
});

test('genuine ambiguity, manual review and CRM V2 conflict remain fail closed', async () => {
  const cases = [
    {
      legacyResult: { status: 'ambiguous', reason: 'multiple_active_clients_for_exact_phone', clients: [{ id: 1 }, { id: 2 }] },
      crmV2Result: { status: 'not_found', identity: null, client: null, audit: null },
      expectedStatus: 'ambiguous',
      expectedReply: 'IDENTITY_CONFLICT_REPLY',
    },
    {
      legacyResult: { status: 'manual_review', reason: 'non_reclaimable_exact_phone_owner', clients: [{ id: 1 }] },
      crmV2Result: { status: 'not_found', identity: null, client: null, audit: null },
      expectedStatus: 'manual_review',
      expectedReply: 'HUMAN_VERIFICATION_REPLY',
    },
    {
      legacyResult: { status: 'historical_unverified', reason: 'history_without_explicit_verification', clients: [{ id: 1 }] },
      crmV2Result: { status: 'conflict', identity: null, client: null, audit: null },
      expectedStatus: 'crm_v2_conflict',
      expectedReply: 'IDENTITY_CONFLICT_REPLY',
    },
  ];

  for (const scenario of cases) {
    const runtime = await loadSyntheticOnboarding({ initialSession: null, ...scenario });
    try {
      const result = await runtime.onboarding.processClientIdentityMessage('27820000000', 'booking');
      assert.equal(result.identityStatus, scenario.expectedStatus);
      assert.equal(result.reply, runtime.onboarding[scenario.expectedReply]);
      assert.equal(runtime.calls.sessionWrites, 0);
    } finally {
      runtime.restore();
    }
  }
});
