const test = require('node:test');
const assert = require('node:assert/strict');

const sessionModule = require('../src/services/staffBrowserSession');
const pilot = require('../src/services/staffBrowserPilotGate');
const challengeDelivery = require('../src/services/staffBrowserChallengeDelivery');
const sessionMiddleware = require('../src/middleware/staffBrowserSession');

function deterministicRandom() {
  let n = 1;
  return (size) => {
    const value = Buffer.alloc(size, n);
    n = (n + 1) % 255 || 1;
    return value;
  };
}

function scriptedClient(responses) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      return responses.shift() || { rows: [], rowCount: 0 };
    },
    release() {},
  };
}

function scriptedDb({ direct = [], transaction = [] } = {}) {
  const directClient = scriptedClient(direct);
  const txClient = scriptedClient(transaction);
  return {
    calls: directClient.calls,
    txCalls: txClient.calls,
    query: directClient.query.bind(directClient),
    async connect() { return txClient; },
  };
}

function baseStub(overrides = {}) {
  return {
    beginChallenge: async () => ({ ok: true, accepted: true, delivered: true }),
    verifyChallenge: async () => ({ ok: true, sessionToken: 'token' }),
    validateSessionToken: async () => ({ ok: true, adminId: 7, viewer: { calendarScope: 'own_staff', staffId: 3 } }),
    rotateCsrfToken: async () => ({ ok: true }),
    revokeSession: async () => ({ ok: true }),
    revokeAllForAdmin: async () => ({ ok: true }),
    validateCsrfToken: () => true,
    ...overrides,
  };
}

const enabledFor7 = {
  SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: '7',
};

test('pilot mode defaults off and preserves existing broad architecture without pilot lookup', async () => {
  let baseCalls = 0;
  const db = scriptedDb();
  const service = pilot.createPilotGuardedStaffBrowserSessionService({
    service: baseStub({ beginChallenge: async () => { baseCalls += 1; return { ok: true, accepted: true, delivered: false }; } }),
    db,
    env: {},
  });
  assert.deepEqual(pilot.pilotPolicy({}), { enabled: false, valid: true, ids: new Set() });
  await service.beginChallenge({ whatsapp: '+27821234567' });
  assert.equal(baseCalls, 1);
  assert.equal(db.calls.length, 0);
});

test('pilot mode with missing or invalid allowlist fails closed for challenge, verification and session use', async () => {
  for (const value of ['', '0', '-1', '7,invalid', '7.5']) {
    let baseCalls = 0;
    const db = scriptedDb();
    const service = pilot.createPilotGuardedStaffBrowserSessionService({
      service: baseStub({
        beginChallenge: async () => { baseCalls += 1; return { ok: true }; },
        verifyChallenge: async () => { baseCalls += 1; return { ok: true }; },
        validateSessionToken: async () => { baseCalls += 1; return { ok: true, adminId: 7 }; },
      }),
      db,
      env: {
        SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'true',
        SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: value,
      },
    });
    assert.deepEqual(await service.beginChallenge({ whatsapp: '+27821234567' }), { ok: true, accepted: true, delivered: false });
    assert.deepEqual(await service.verifyChallenge({ whatsapp: '+27821234567', code: 'ABCDEFGHJK' }), { ok: false, code: 'STAFF_AUTH_INVALID_CHALLENGE' });
    assert.deepEqual(await service.validateSessionToken('opaque'), { ok: false, code: 'STAFF_SESSION_INVALID' });
    assert.equal(baseCalls, 0);
    assert.equal(db.calls.length, 0);
  }
});

test('one allowlisted canonical admin can request and verify a challenge with mocked delivery', async () => {
  let delivered;
  const correctCode = 'BBBBBBBBBB';
  const db = scriptedDb({
    direct: [
      { rows: [{ id: 7 }], rowCount: 1 },
      { rows: [{ id: 7, whatsapp_number: '+27821234567' }], rowCount: 1 },
      { rows: [{ id: 7 }], rowCount: 1 },
    ],
    transaction: [
      { rows: [] },
      { rows: [] },
      { rows: [{ count: 0 }], rowCount: 1 },
      { rows: [], rowCount: 0 },
      { rows: [{ id: 91 }], rowCount: 1 },
      { rows: [] },
      { rows: [] },
      { rows: [{
        id: 7,
        staff_id: 3,
        role: 'admin',
        business_role: 'practitioner',
        calendar_scope: 'own',
        service_scope: 'own_services',
        permissions: { 'appointment:view': true },
        admin_active: true,
        staff_status: 'active',
      }], rowCount: 1 },
      { rows: [] },
      { rows: [{ id: 91, challenge_hash: sessionModule.sha256(correctCode), expires_at: '2026-08-24T18:05:00Z', attempt_count: 0, max_attempts: 5 }], rowCount: 1 },
      { rows: [], rowCount: 1 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [{ id: 101 }], rowCount: 1 },
      { rows: [] },
    ],
  });
  const base = sessionModule.createStaffBrowserSessionService({
    db,
    randomBytes: deterministicRandom(),
    challengeDispatcher: async (payload) => { delivered = payload; },
    now: () => new Date('2026-08-24T18:01:00Z'),
  });
  const service = pilot.createPilotGuardedStaffBrowserSessionService({ service: base, db, env: enabledFor7 });

  const requested = await service.beginChallenge({ whatsapp: '+27 82 123 4567' });
  assert.equal(requested.delivered, true);
  assert.equal(delivered.code, correctCode);

  const verified = await service.verifyChallenge({ whatsapp: '+27 82 123 4567', code: delivered.code });
  assert.equal(verified.ok, true);
  assert.deepEqual(verified.viewer, { calendarScope: 'own_staff', staffId: 3 });
  assert.equal(db.txCalls.some((call) => call.sql.includes('INSERT INTO staff_browser_sessions')), true);
});

test('a different active canonical admin gets non-enumerating challenge denial and cannot verify', async () => {
  let baseCalls = 0;
  const db = scriptedDb({ direct: [
    { rows: [{ id: 8 }], rowCount: 1 },
    { rows: [{ id: 8 }], rowCount: 1 },
  ] });
  const service = pilot.createPilotGuardedStaffBrowserSessionService({
    service: baseStub({
      beginChallenge: async () => { baseCalls += 1; return { ok: true }; },
      verifyChallenge: async () => { baseCalls += 1; return { ok: true }; },
    }),
    db,
    env: enabledFor7,
  });
  assert.deepEqual(await service.beginChallenge({ whatsapp: '+27820000008' }), { ok: true, accepted: true, delivered: false });
  assert.deepEqual(await service.verifyChallenge({ whatsapp: '+27820000008', code: 'ABCDEFGHJK' }), { ok: false, code: 'STAFF_AUTH_INVALID_CHALLENGE' });
  assert.equal(baseCalls, 0);
});

test('disallowed sessions fail closed while allowlisted sessions retain canonical viewer authority', async () => {
  const denied = pilot.createPilotGuardedStaffBrowserSessionService({
    service: baseStub({ validateSessionToken: async () => ({ ok: true, adminId: 8, viewer: { calendarScope: 'business_all_staff' } }) }),
    db: scriptedDb(),
    env: enabledFor7,
  });
  assert.deepEqual(await denied.validateSessionToken('opaque'), { ok: false, code: 'STAFF_SESSION_INVALID' });

  const allowed = pilot.createPilotGuardedStaffBrowserSessionService({
    service: baseStub({ validateSessionToken: async () => ({ ok: true, adminId: 7, viewer: { calendarScope: 'own_staff', staffId: 3 } }) }),
    db: scriptedDb(),
    env: enabledFor7,
  });
  assert.deepEqual(await allowed.validateSessionToken('opaque'), {
    ok: true,
    adminId: 7,
    viewer: { calendarScope: 'own_staff', staffId: 3 },
  });
});

test('browser-supplied identity or scope claims cannot join the canonical pilot allowlist', async () => {
  let baseCalled = false;
  const db = scriptedDb({ direct: [{ rows: [{ id: 8 }], rowCount: 1 }] });
  const service = pilot.createPilotGuardedStaffBrowserSessionService({
    service: baseStub({ beginChallenge: async () => { baseCalled = true; return { ok: true }; } }),
    db,
    env: enabledFor7,
  });
  const result = await service.beginChallenge({
    whatsapp: '+27820000008',
    adminId: 7,
    staffId: 3,
    business_role: 'business_admin',
    calendarScope: 'business_all_staff',
  });
  assert.deepEqual(result, { ok: true, accepted: true, delivered: false });
  assert.equal(baseCalled, false);
  assert.deepEqual(db.calls[0].params, ['27820000008']);
});

test('revoked or current-authority-invalid allowlisted sessions remain invalid', async () => {
  const service = pilot.createPilotGuardedStaffBrowserSessionService({
    service: baseStub({ validateSessionToken: async () => ({ ok: false, code: 'STAFF_SESSION_INVALID' }) }),
    db: scriptedDb(),
    env: enabledFor7,
  });
  assert.deepEqual(await service.validateSessionToken('opaque'), { ok: false, code: 'STAFF_SESSION_INVALID' });
});

test('all production activation and pilot controls remain inactive unless explicitly injected', () => {
  const env = {
    SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED: 'false',
    SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'false',
    SHILOH_CALENDAR_READONLY_UX_ENABLED: 'false',
    SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'false',
    SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: '',
  };
  assert.equal(challengeDelivery.isStaffBrowserWhatsAppDeliveryEnabled(env), false);
  assert.equal(sessionMiddleware.isCalendarBridgeEnabled(env), false);
  assert.equal(pilot.isPilotModeEnabled(env), false);
  assert.equal(pilot.parsePilotAdminIds(env).valid, false);
});
