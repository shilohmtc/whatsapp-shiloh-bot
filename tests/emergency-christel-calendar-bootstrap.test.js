const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrap = require('../src/services/emergencyCalendarBootstrap');
const staffSession = require('../src/services/staffBrowserSession');
const sessionMiddleware = require('../src/middleware/staffBrowserSession');
const { emergencyCalendarBootstrapClientScript } = require('../src/presentation/emergencyCalendarBootstrapUx');

function deterministicRandom() {
  let n = 1;
  return (size) => {
    const value = Buffer.alloc(size, n);
    n += 1;
    return value;
  };
}

function scriptedClient(responses = []) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next || { rows: [], rowCount: 0 };
    },
    release() {},
  };
}

function scriptedDb(transaction = []) {
  const client = scriptedClient(transaction);
  return {
    txCalls: client.calls,
    async query() { throw new Error('unexpected direct query'); },
    async connect() { return client; },
  };
}

function authorityRow(overrides = {}) {
  return {
    id: 2,
    staff_id: 9,
    display_name: 'Christel',
    role: 'admin',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
    admin_active: true,
    staff_status: 'active',
    client_bookable: true,
    ...overrides,
  };
}

const enabledEnv = {
  SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true',
  SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://shiloh.example.test',
  SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'false',
};

test('1/4 exact canonical Christel Admin gets a 256-bit-shaped short-lived bootstrap and only its hash is stored', async () => {
  const db = scriptedDb([
    { rows: [] },
    { rows: [] },
    { rows: [authorityRow()], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [] },
  ]);
  const now = new Date('2026-08-25T04:00:00Z');
  const service = bootstrap.createEmergencyCalendarBootstrapService({
    db,
    env: enabledEnv,
    now: () => now,
    randomBytes: deterministicRandom(),
  });
  const result = await service.issueForWhatsapp({ whatsapp: '+27 82 123 4567' });
  assert.equal(result.ok, true);
  assert.equal(result.adminId, 2);
  assert.match(result.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(new Date(result.expiresAt).getTime() - now.getTime(), bootstrap.DEFAULT_BOOTSTRAP_TTL_MS);
  const insert = db.txCalls.find((call) => call.sql.includes('INSERT INTO staff_browser_emergency_bootstraps'));
  assert.ok(insert);
  assert.equal(insert.params.includes(result.token), false);
  assert.equal(insert.params.includes(staffSession.sha256(result.token)), true);
  assert.equal(insert.params[0], 2);
});

test('2 another Admin/sender cannot obtain the Christel bootstrap', async () => {
  const db = scriptedDb([
    { rows: [] },
    { rows: [] },
    { rows: [], rowCount: 0 },
    { rows: [] },
  ]);
  const service = bootstrap.createEmergencyCalendarBootstrapService({ db, env: enabledEnv, randomBytes: deterministicRandom() });
  const result = await service.issueForWhatsapp({ whatsapp: '+27 82 000 0000' });
  assert.deepEqual(result, { ok: false, code: 'EMERGENCY_CALENDAR_FORBIDDEN' });
  assert.equal(db.txCalls.some((call) => call.sql.includes('INSERT INTO staff_browser_emergency_bootstraps')), false);
});

test('3 anonymous/malformed browser bootstrap fails before database access', async () => {
  const db = scriptedDb();
  const service = bootstrap.createEmergencyCalendarBootstrapService({ db, env: enabledEnv });
  assert.deepEqual(await service.exchange({ token: '' }), { ok: false, code: 'EMERGENCY_CALENDAR_INVALID_BOOTSTRAP' });
  assert.deepEqual(await service.exchange({ token: 'browser-claims-adminId-2' }), { ok: false, code: 'EMERGENCY_CALENDAR_INVALID_BOOTSTRAP' });
  assert.equal(db.txCalls.length, 0);
});

test('5/8 valid bootstrap is consumed once and exchanges into the existing opaque staff_browser_sessions architecture', async () => {
  const rawBootstrap = Buffer.alloc(32, 9).toString('base64url');
  const db = scriptedDb([
    { rows: [] },
    { rows: [{ id: 71, admin_id: 2, expires_at: '2026-08-25T04:02:00Z', consumed_at: null, revoked_at: null }], rowCount: 1 },
    { rows: [] },
    { rows: [authorityRow()], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [{ id: 18 }], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [{ id: 19 }], rowCount: 1 },
    { rows: [] },
  ]);
  const service = bootstrap.createEmergencyCalendarBootstrapService({
    db,
    env: enabledEnv,
    now: () => new Date('2026-08-25T04:01:00Z'),
    randomBytes: deterministicRandom(),
  });
  const result = await service.exchange({ token: rawBootstrap, requestFingerprintHash: 'a'.repeat(64) });
  assert.equal(result.ok, true);
  assert.equal(result.adminId, 2);
  assert.deepEqual(result.viewer, { calendarScope: 'business_all_staff' });
  const consume = db.txCalls.find((call) => call.sql.includes('SET consumed_at'));
  const rotate = db.txCalls.find((call) => call.sql.includes("revoke_reason = 'rotated'"));
  const sessionInsert = db.txCalls.find((call) => call.sql.includes('INSERT INTO staff_browser_sessions'));
  assert.ok(consume);
  assert.ok(rotate);
  assert.ok(sessionInsert);
  assert.equal(sessionInsert.params[0], 2);
  assert.equal(sessionInsert.params.includes(result.sessionToken), false);
  assert.equal(sessionInsert.params.includes(result.csrfToken), false);
  assert.equal(sessionInsert.params.includes(staffSession.sha256(result.sessionToken)), true);
  assert.equal(sessionInsert.params.includes(staffSession.sha256(result.csrfToken)), true);
  assert.equal(staffSession.createStaffBrowserSessionService({ db: { query: async () => ({ rows: [] }), connect: async () => ({ query: async () => ({ rows: [] }), release() {} }) } }).validateCsrfToken({ ok: true, csrfHash: staffSession.sha256(result.csrfToken) }, result.csrfToken), true);
});

test('5 replay of a consumed bootstrap fails closed without issuing another session', async () => {
  const rawBootstrap = Buffer.alloc(32, 9).toString('base64url');
  const db = scriptedDb([
    { rows: [] },
    { rows: [{ id: 71, admin_id: 2, expires_at: '2026-08-25T04:02:00Z', consumed_at: '2026-08-25T04:00:30Z', revoked_at: null }], rowCount: 1 },
    { rows: [] },
  ]);
  const service = bootstrap.createEmergencyCalendarBootstrapService({ db, env: enabledEnv, now: () => new Date('2026-08-25T04:01:00Z') });
  const result = await service.exchange({ token: rawBootstrap });
  assert.equal(result.ok, false);
  assert.equal(db.txCalls.some((call) => call.sql.includes('INSERT INTO staff_browser_sessions')), false);
});

test('6 expired bootstrap is revoked and fails closed', async () => {
  const rawBootstrap = Buffer.alloc(32, 9).toString('base64url');
  const db = scriptedDb([
    { rows: [] },
    { rows: [{ id: 71, admin_id: 2, expires_at: '2026-08-25T03:59:00Z', consumed_at: null, revoked_at: null }], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [] },
  ]);
  const service = bootstrap.createEmergencyCalendarBootstrapService({ db, env: enabledEnv, now: () => new Date('2026-08-25T04:01:00Z') });
  const result = await service.exchange({ token: rawBootstrap });
  assert.equal(result.ok, false);
  assert.ok(db.txCalls.find((call) => call.sql.includes('SET revoked_at')));
  assert.equal(db.txCalls.some((call) => call.sql.includes('INSERT INTO staff_browser_sessions')), false);
});

test('7 revoked/current-authority-invalid Christel fails closed before session issuance', async () => {
  const rawBootstrap = Buffer.alloc(32, 9).toString('base64url');
  const db = scriptedDb([
    { rows: [] },
    { rows: [{ id: 71, admin_id: 2, expires_at: '2026-08-25T04:02:00Z', consumed_at: null, revoked_at: null }], rowCount: 1 },
    { rows: [] },
    { rows: [authorityRow({ permissions: { 'appointment:create': false, 'client:lookup': true } })], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [] },
  ]);
  const service = bootstrap.createEmergencyCalendarBootstrapService({ db, env: enabledEnv, now: () => new Date('2026-08-25T04:01:00Z') });
  const result = await service.exchange({ token: rawBootstrap });
  assert.equal(result.ok, false);
  assert.equal(db.txCalls.some((call) => call.sql.includes('INSERT INTO staff_browser_sessions')), false);
});

test('9 browser claims never establish bootstrap membership or authority', () => {
  assert.equal(bootstrap.isEmergencyChristelAuthority(authorityRow({ id: 3 }), enabledEnv), false);
  assert.equal(bootstrap.isEmergencyChristelAuthority(authorityRow({ calendar_scope: 'own' }), enabledEnv), false);
  assert.equal(bootstrap.isEmergencyChristelAuthority(authorityRow({ service_scope: 'own_services' }), enabledEnv), false);
  const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/staffBrowserSession.js'), 'utf8');
  assert.doesNotMatch(routeSource, /req\.body\?\.(adminId|staffId|role|businessRole|calendarScope|serviceScope|practitioner)/);
});

test('4/8 URL handoff uses fragment only, clears history before exchange, and never uses persistent browser storage', () => {
  const token = Buffer.alloc(32, 4).toString('base64url');
  const url = bootstrap.buildEmergencyCalendarUrl(token, enabledEnv);
  assert.equal(url, `https://shiloh.example.test/calendar/staff#bootstrap=${token}`);
  assert.equal(new URL(url).search, '');
  const script = emergencyCalendarBootstrapClientScript();
  assert.match(script, /window\.history\.replaceState/);
  assert.match(script, /emergency-bootstrap\/exchange/);
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
});

test('10 existing secure cookie, CSRF, logout and revocation boundary remains the session authority', () => {
  const cookie = sessionMiddleware.serializeSessionCookie('opaque', { env: { NODE_ENV: 'production' }, maxAgeSeconds: 120 });
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/staffBrowserSession.js'), 'utf8');
  assert.match(routeSource, /router\.post\('\/logout'/);
  assert.match(routeSource, /requireCsrf/);
  assert.match(routeSource, /serializeSessionCookie/);
  assert.doesNotMatch(routeSource, /ADMIN_API_KEY/);
});

test('production activation stays dark until the dedicated emergency feature flag is enabled', async () => {
  const db = scriptedDb();
  const service = bootstrap.createEmergencyCalendarBootstrapService({ db, env: {} });
  assert.deepEqual(await service.issueForWhatsapp({ whatsapp: '+27821234567' }), { ok: false, code: 'EMERGENCY_CALENDAR_DISABLED' });
  assert.equal(db.txCalls.length, 0);
});
