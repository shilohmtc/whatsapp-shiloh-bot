const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createEmergencyCalendarBootstrapService,
} = require('../src/services/emergencyCalendarBootstrap');
const {
  createCalendarReadOnlyUxService,
  normalizeViewerForTimeline,
} = require('../src/services/calendarReadOnlyUx');
const {
  resolveViewerFilter,
} = require('../src/services/schedulingEngine');
const {
  isAdminAllowedByPilot,
} = require('../src/services/staffBrowserPilotGate');
const {
  CALENDAR_VIEWER_CONTEXT,
  createCalendarReadOnlyHandler,
} = require('../src/routes/calendarReadOnlyUx');

const productionShapeEnv = {
  SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true',
  SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: '2',
  SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://shiloh.example.test',
};

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

function emptyTimeline(viewerScope = 'all_business') {
  return {
    meta: {
      from: '2026-08-24T22:00:00.000Z',
      to: '2026-08-25T22:00:00.000Z',
      viewerScope,
      canonicalSources: [],
      nonCanonicalSources: [],
      googleCalendarRequired: true,
    },
    staff: [],
    workingWindows: [],
    scheduleExceptions: [],
    recurringClosures: [],
    leave: [],
    closures: [],
    appointments: [],
    blocks: [],
    externalBusy: [],
    events: [],
  };
}

function fakeResponse() {
  return {
    statusCode: null,
    contentType: null,
    body: null,
    headers: {},
    headersSent: false,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    type(value) { this.contentType = value; return this; },
    send(value) { this.body = String(value); this.headersSent = true; return this; },
  };
}

function authenticatedRequest(viewer, adminId = 2) {
  const req = {
    query: { view: 'day', date: '2026-08-25' },
    baseUrl: '/calendar/read-only',
    staffBrowserSession: { adminId },
  };
  req[CALENDAR_VIEWER_CONTEXT] = {
    authenticated: true,
    source: 'server_staff_session',
    viewer,
  };
  return req;
}

test('1 Christel all-business browser-session scope translates explicitly to SchedulingTimeline all_business', () => {
  assert.deepEqual(
    normalizeViewerForTimeline({ calendarScope: 'business_all_staff' }),
    { calendarScope: 'all_business' },
  );
  assert.deepEqual(
    resolveViewerFilter(normalizeViewerForTimeline({ calendarScope: 'business_all_staff' }), null),
    { scope: 'all_business', staffIds: null },
  );
});

test('2 emergency bootstrap exchange viewer crosses the adapter and Calendar read-only returns 200', async () => {
  const rawBootstrap = Buffer.alloc(32, 9).toString('base64url');
  const db = scriptedDb([
    { rows: [] },
    { rows: [{ id: 71, admin_id: 2, expires_at: '2026-08-25T04:32:00Z', consumed_at: null, revoked_at: null }], rowCount: 1 },
    { rows: [] },
    { rows: [authorityRow()], rowCount: 1 },
    { rows: [], rowCount: 1 },
    { rows: [], rowCount: 0 },
    { rows: [], rowCount: 1 },
    { rows: [{ id: 19 }], rowCount: 1 },
    { rows: [] },
  ]);
  const bootstrapService = createEmergencyCalendarBootstrapService({
    db,
    env: productionShapeEnv,
    now: () => new Date('2026-08-25T04:31:00Z'),
    randomBytes: deterministicRandom(),
  });
  const exchanged = await bootstrapService.exchange({ token: rawBootstrap, requestFingerprintHash: 'a'.repeat(64) });
  assert.equal(exchanged.ok, true);
  assert.deepEqual(exchanged.viewer, { calendarScope: 'business_all_staff' });

  const timelineCalls = [];
  const calendarUx = createCalendarReadOnlyUxService({
    listTimeline: async (input) => {
      timelineCalls.push(input);
      return emptyTimeline(input.viewer.calendarScope);
    },
  });
  const handler = createCalendarReadOnlyHandler({
    env: productionShapeEnv,
    buildModel: calendarUx.buildModel,
    renderPage: () => '<main><div class="access-controls"></div><p>Calendar</p></main>',
    bookingService: {
      async resolveOperator(adminId) {
        assert.equal(adminId, exchanged.adminId);
        return { id: adminId };
      },
    },
  });
  const res = fakeResponse();
  await handler(authenticatedRequest(exchanged.viewer, exchanged.adminId), res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(timelineCalls.length, 1);
  assert.deepEqual(timelineCalls[0].viewer, { calendarScope: 'all_business' });
  assert.match(res.body, /Create booking/);
});

test('3 unknown browser viewer scopes remain forbidden before SchedulingTimeline is called', async () => {
  let timelineCalls = 0;
  const service = createCalendarReadOnlyUxService({
    listTimeline: async () => { timelineCalls += 1; return emptyTimeline(); },
  });
  await assert.rejects(
    service.buildModel({
      view: 'day',
      date: '2026-08-25',
      viewer: { calendarScope: 'browser_superuser' },
    }),
    (error) => error?.code === 'SCHEDULING_TIMELINE_FORBIDDEN',
  );
  assert.equal(timelineCalls, 0);
});

test('4 own_staff browser scope normalizes only to canonical own-scope and remains staff constrained', () => {
  const normalized = normalizeViewerForTimeline({ calendarScope: 'own_staff', staffId: 7 });
  assert.deepEqual(normalized, { calendarScope: 'own_appointments', staffId: 7 });
  assert.deepEqual(resolveViewerFilter(normalized, null), { scope: 'own_appointments', staffIds: [7] });
  assert.deepEqual(resolveViewerFilter(normalized, [8]), { scope: 'own_appointments', staffIds: [] });
  assert.throws(
    () => normalizeViewerForTimeline({ calendarScope: 'own_staff' }),
    (error) => error?.code === 'SCHEDULING_TIMELINE_FORBIDDEN',
  );
});

test('5 SchedulingTimeline itself still rejects raw browser-only scopes; the adapter is the only compatibility boundary', () => {
  assert.throws(
    () => resolveViewerFilter({ calendarScope: 'business_all_staff' }, null),
    (error) => error?.code === 'SCHEDULING_TIMELINE_FORBIDDEN',
  );
  assert.throws(
    () => resolveViewerFilter({ calendarScope: 'own_staff', staffId: 7 }, null),
    (error) => error?.code === 'SCHEDULING_TIMELINE_FORBIDDEN',
  );
});

test('6 production-shaped pilot remains unchanged by WS-10 booking write authority', () => {
  assert.equal(isAdminAllowedByPilot(2, productionShapeEnv), true);
  assert.equal(isAdminAllowedByPilot(3, productionShapeEnv), false);
  assert.equal(isAdminAllowedByPilot(99, productionShapeEnv), false);
});

test('7 Create Booking presentation follows canonical booking authority, not whole-Calendar visibility or a hard-coded Admin ID', async () => {
  const buildModel = async () => ({ dateKey: '2026-08-25' });
  const renderPage = () => '<main><div class="access-controls"></div><p>Calendar</p></main>';
  const authorityCalls = [];
  const bookingService = {
    async resolveOperator(adminId) {
      authorityCalls.push(adminId);
      if ([2, 3].includes(Number(adminId))) return { id: Number(adminId) };
      const error = new Error('forbidden');
      error.code = 'CALENDAR_BOOKING_FORBIDDEN';
      throw error;
    },
  };
  const handler = createCalendarReadOnlyHandler({
    env: productionShapeEnv,
    buildModel,
    renderPage,
    bookingService,
  });

  const christel = fakeResponse();
  await handler(authenticatedRequest({ calendarScope: 'business_all_staff' }, 2), christel, () => {});
  assert.equal(christel.statusCode, 200);
  assert.match(christel.body, /Create booking/);

  const otherAuthorizedOperator = fakeResponse();
  await handler(authenticatedRequest({ calendarScope: 'business_all_staff' }, 3), otherAuthorizedOperator, () => {});
  assert.equal(otherAuthorizedOperator.statusCode, 200);
  assert.match(otherAuthorizedOperator.body, /Create booking/);

  const wholeCalendarOnlyViewer = fakeResponse();
  await handler(authenticatedRequest({ calendarScope: 'business_all_staff' }, 99), wholeCalendarOnlyViewer, () => {});
  assert.equal(wholeCalendarOnlyViewer.statusCode, 200);
  assert.doesNotMatch(wholeCalendarOnlyViewer.body, /Create booking/);
  assert.deepEqual(authorityCalls, [2, 3, 99]);
});

test('8 repair does not broaden SchedulingTimeline or create a second appointment-write path', () => {
  const schedulingSource = fs.readFileSync(path.join(__dirname, '../src/services/schedulingEngine.js'), 'utf8');
  const calendarBookingSource = fs.readFileSync(path.join(__dirname, '../src/services/calendarCreateBooking.js'), 'utf8');
  const calendarRouteSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendarReadOnlyUx.js'), 'utf8');
  assert.match(schedulingSource, /const KNOWN_SCOPES = new Set\(\[ALL_BUSINESS_SCOPE, \.\.\.OWN_SCOPES, 'none'\]\)/);
  assert.doesNotMatch(schedulingSource, /business_all_staff|own_staff/);
  assert.doesNotMatch(calendarBookingSource, /INSERT INTO appointments|INSERT INTO appointment_services|INSERT INTO appointment_staff/);
  assert.match(calendarBookingSource, /prepareBooking/);
  assert.match(calendarBookingSource, /confirmBooking/);
  assert.match(calendarRouteSource, /bookingService\.resolveOperator\(req\.staffBrowserSession\?\.adminId\)/);
  assert.doesNotMatch(calendarRouteSource, /EMERGENCY_ADMIN_ID/);
});