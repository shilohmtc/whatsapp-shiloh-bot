const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createCalendarCreateBookingService,
  normalizeNewClientInput,
} = require('../src/services/calendarCreateBooking');
const { EMERGENCY_ADMIN_ID } = require('../src/services/emergencyCalendarBootstrap');

const enabledEnv = {
  SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true',
  SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://shiloh.example.test',
  SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'false',
};

function authorityRow(overrides = {}) {
  return {
    id: EMERGENCY_ADMIN_ID,
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

function eligibleRow(overrides = {}) {
  return {
    staff_id: 9,
    staff_name: 'Abigail',
    service_id: 44,
    service_name: 'Deep Tissue Massage',
    duration_minutes: 60,
    processing_time_minutes: 0,
    extra_time_minutes: 0,
    price: '650.00',
    variable_price: false,
    ...overrides,
  };
}

function scriptedDb(handler = async () => ({ rows: [], rowCount: 0 })) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      const call = { sql: String(sql), params };
      calls.push(call);
      return (await handler(call, calls)) || { rows: [], rowCount: 0 };
    },
  };
}

function authorityDb(extraHandler) {
  return scriptedDb(async (call, calls) => {
    if (call.sql.includes('FROM staff_admin_accounts a')) {
      return { rows: [authorityRow()], rowCount: 1 };
    }
    if (extraHandler) return extraHandler(call, calls);
    return { rows: [], rowCount: 0 };
  });
}

function pendingResult(clientId, source = 'admin_provisional_booking') {
  return { rows: [{ id: clientId, source }], rowCount: 1 };
}

function preparedResult(clientId, displayName = 'Jane Doe') {
  return {
    status: 'pending_confirmation',
    client: { id: clientId, display_name: displayName },
    staff: { id: 9, display_name: 'Abigail' },
    service: { id: 44, name: 'Deep Tissue Massage', price: '650.00', variable_price: false },
    startsAt: '2026-08-28T08:15:00.000Z',
    endsAt: '2026-08-28T09:15:00.000Z',
  };
}

const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendarCreateBooking.js'), 'utf8');
const serviceSource = fs.readFileSync(path.join(__dirname, '../src/services/calendarCreateBooking.js'), 'utf8');
const uxSource = fs.readFileSync(path.join(__dirname, '../src/presentation/calendarCreateBookingUx.js'), 'utf8');

test('Calendar new-client UX stays draft-only until the existing guarded prepare action', () => {
  assert.match(uxSource, /data-new-client-panel/);
  assert.match(uxSource, /Nothing is written to CRM when search returns no results/);
  assert.match(uxSource, /payload\.newClient=/);
  assert.doesNotMatch(routeSource, /router\.post\('\/new-client'/);
  assert.match(routeSource, /router\.post\('\/prepare'\s*,\s*sameOrigin\s*,\s*requireSession\s*,\s*requireCsrf/);
  assert.match(routeSource, /router\.post\('\/discard'\s*,\s*sameOrigin\s*,\s*requireSession\s*,\s*requireCsrf/);
  assert.match(routeSource, /newClient:\s*req\.body\?\.newClient/);
});

test('new-client draft normalization is bounded and does not invent a client', () => {
  assert.deepEqual(normalizeNewClientInput({ fullName: '  Jane   Doe ', mobileNumber: ' 082 123 4567 ' }), {
    fullName: 'Jane Doe',
    mobileNumber: '082 123 4567',
  });
  assert.equal(normalizeNewClientInput(null), null);
  assert.equal(normalizeNewClientInput({}), null);
});

test('Calendar fails closed if canonical client id and new-client draft are supplied together', async () => {
  let creatorCalls = 0;
  const service = createCalendarCreateBookingService({
    db: authorityDb(),
    env: enabledEnv,
    provisionalClientCreator: async () => { creatorCalls += 1; },
  });
  await assert.rejects(
    service.prepare({
      adminId: EMERGENCY_ADMIN_ID,
      clientId: 123,
      newClient: { fullName: 'Jane Doe', mobileNumber: '0821234567' },
      staffId: 9,
      serviceId: 44,
      date: '2026-08-28',
      time: '10:15',
    }),
    (error) => error?.code === 'CALENDAR_BOOKING_INVALID_CLIENT_SELECTION'
  );
  assert.equal(creatorCalls, 0);
});

test('provider eligibility is validated before any provisional CRM mutation', async () => {
  let creatorCalls = 0;
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [], rowCount: 0 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    provisionalClientCreator: async () => { creatorCalls += 1; },
  });
  await assert.rejects(
    service.prepare({
      adminId: EMERGENCY_ADMIN_ID,
      newClient: { fullName: 'Jane Doe', mobileNumber: '0821234567' },
      staffId: 9,
      serviceId: 44,
      date: '2026-08-28',
      time: '10:15',
    }),
    (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION'
  );
  assert.equal(creatorCalls, 0);
});

test('new client is resolved through existing provisional authority and delegates its canonical id to Admin booking', async () => {
  const creatorCalls = [];
  const prepareCalls = [];
  const cleanupCalls = [];
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    provisionalClientCreator: async (payload) => {
      creatorCalls.push(payload);
      return { status: 'created', client: { id: 701, display_name: 'Jane Doe', status: 'active' } };
    },
    provisionalClientCleanup: async (payload) => { cleanupCalls.push(payload); return { status: 'removed' }; },
    prepareBooking: async (payload) => { prepareCalls.push(payload); return preparedResult(701); },
  });

  const result = await service.prepare({
    adminId: EMERGENCY_ADMIN_ID,
    newClient: { fullName: 'Jane Doe', mobileNumber: '082 123 4567' },
    staffId: 9,
    serviceId: 44,
    date: '2026-08-28',
    time: '10:15',
  });

  assert.deepEqual(creatorCalls, [{ fullName: 'Jane Doe', mobileNumber: '082 123 4567', adminId: EMERGENCY_ADMIN_ID }]);
  assert.deepEqual(prepareCalls, [{
    adminId: EMERGENCY_ADMIN_ID,
    clientId: 701,
    staffName: 'Abigail',
    serviceName: 'Deep Tissue Massage',
    localDateTime: '28/08/2026 10:15',
  }]);
  assert.equal(cleanupCalls.length, 0);
  assert.equal(result.review.client.id, 701);
  assert.equal(result.review.client.provisional, true);
  assert.equal(result.review.client.profileIncomplete, true);
  assert.equal(result.review.client.contactHint, 'ending in 4567');
});

test('mobile match reuses the existing canonical client and never marks it provisional', async () => {
  const prepareCalls = [];
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    provisionalClientCreator: async () => ({ status: 'existing', client: { id: 333, display_name: 'Existing Jane', status: 'active' } }),
    provisionalClientCleanup: async () => { throw new Error('existing canonical client must never be cleaned up'); },
    prepareBooking: async (payload) => { prepareCalls.push(payload); return preparedResult(333, 'Existing Jane'); },
  });

  const result = await service.prepare({
    adminId: EMERGENCY_ADMIN_ID,
    newClient: { fullName: 'Jane Doe', mobileNumber: '0821234567' },
    staffId: 9,
    serviceId: 44,
    date: '2026-08-28',
    time: '10:15',
  });

  assert.equal(prepareCalls[0].clientId, 333);
  assert.equal(result.review.client.provisional, false);
  assert.equal(result.review.client.matchedExisting, true);
});

test('ambiguous mobile identity fails closed before canonical booking preparation', async () => {
  let prepareCalls = 0;
  let cleanupCalls = 0;
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    provisionalClientCreator: async () => ({ status: 'ambiguous', clients: [{ id: 1 }, { id: 2 }] }),
    provisionalClientCleanup: async () => { cleanupCalls += 1; },
    prepareBooking: async () => { prepareCalls += 1; },
  });

  await assert.rejects(
    service.prepare({
      adminId: EMERGENCY_ADMIN_ID,
      newClient: { fullName: 'Jane Doe', mobileNumber: '0821234567' },
      staffId: 9,
      serviceId: 44,
      date: '2026-08-28',
      time: '10:15',
    }),
    (error) => error?.code === 'CALENDAR_BOOKING_NEW_CLIENT_AMBIGUOUS'
  );
  assert.equal(prepareCalls, 0);
  assert.equal(cleanupCalls, 0);
});

test('new provisional client is removed immediately when canonical preparation denies the slot', async () => {
  const cleanupCalls = [];
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const denial = { status: 'schedule_exception', reply: 'Not available.' };
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    provisionalClientCreator: async () => ({ status: 'created', client: { id: 702, display_name: 'Jane Doe' } }),
    provisionalClientCleanup: async (payload) => { cleanupCalls.push(payload); return { status: 'removed' }; },
    prepareBooking: async () => denial,
  });

  const result = await service.prepare({
    adminId: EMERGENCY_ADMIN_ID,
    newClient: { fullName: 'Jane Doe', mobileNumber: '0821234567' },
    staffId: 9,
    serviceId: 44,
    date: '2026-08-28',
    time: '10:15',
  });

  assert.strictEqual(result, denial);
  assert.deepEqual(cleanupCalls, [{ clientId: 702, adminId: EMERGENCY_ADMIN_ID, reason: 'calendar_booking_prepare_failed' }]);
});

test('new provisional client is also removed when canonical preparation throws', async () => {
  const cleanupCalls = [];
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    provisionalClientCreator: async () => ({ status: 'created', client: { id: 703, display_name: 'Jane Doe' } }),
    provisionalClientCleanup: async (payload) => { cleanupCalls.push(payload); return { status: 'removed' }; },
    prepareBooking: async () => { throw new Error('provider unavailable'); },
  });

  await assert.rejects(
    service.prepare({
      adminId: EMERGENCY_ADMIN_ID,
      newClient: { fullName: 'Jane Doe', mobileNumber: '0821234567' },
      staffId: 9,
      serviceId: 44,
      date: '2026-08-28',
      time: '10:15',
    }),
    /provider unavailable/
  );
  assert.deepEqual(cleanupCalls, [{ clientId: 703, adminId: EMERGENCY_ADMIN_ID, reason: 'calendar_booking_prepare_error' }]);
});

test('Edit/discard cancels the pending session and removes an unused provisional client', async () => {
  const cancelCalls = [];
  const cleanupCalls = [];
  const db = authorityDb(async (call) => {
    if (call.sql.includes('FROM admin_booking_sessions abs')) return pendingResult(704);
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    cancelBooking: async (adminId) => { cancelCalls.push(adminId); return true; },
    provisionalClientCleanup: async (payload) => { cleanupCalls.push(payload); return { status: 'removed' }; },
  });

  const result = await service.discard({ adminId: EMERGENCY_ADMIN_ID });
  assert.deepEqual(cancelCalls, [EMERGENCY_ADMIN_ID]);
  assert.deepEqual(cleanupCalls, [{ clientId: 704, adminId: EMERGENCY_ADMIN_ID, reason: 'calendar_booking_cancelled' }]);
  assert.deepEqual(result, { status: 'discarded', provisionalClientRemoved: true, cleanupStatus: 'removed' });
});

test('Edit/discard never deletes an existing canonical client', async () => {
  let cleanupCalls = 0;
  const db = authorityDb(async (call) => {
    if (call.sql.includes('FROM admin_booking_sessions abs')) return pendingResult(333, 'goldie_import');
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    cancelBooking: async () => true,
    provisionalClientCleanup: async () => { cleanupCalls += 1; },
  });

  const result = await service.discard({ adminId: EMERGENCY_ADMIN_ID });
  assert.equal(cleanupCalls, 0);
  assert.deepEqual(result, { status: 'discarded', provisionalClientRemoved: false, cleanupStatus: null });
});

test('failed final confirmation cleans a provisional client only after canonical pending session is gone', async () => {
  const cleanupCalls = [];
  const db = authorityDb(async (call) => {
    if (call.sql.includes('FROM admin_booking_sessions abs')) return pendingResult(705);
    if (call.sql.includes('FROM admin_booking_sessions') && call.sql.includes('client_id = $2')) return { rows: [], rowCount: 0 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    confirmBooking: async () => ({ status: 'conflict', reply: 'Slot changed.' }),
    provisionalClientCleanup: async (payload) => { cleanupCalls.push(payload); return { status: 'removed' }; },
  });

  const result = await service.confirm({ adminId: EMERGENCY_ADMIN_ID });
  assert.equal(result.status, 'conflict');
  assert.deepEqual(cleanupCalls, [{ clientId: 705, adminId: EMERGENCY_ADMIN_ID, reason: 'calendar_booking_confirm_conflict' }]);
});

test('successful final confirmation retains the provisional client as the booked canonical client', async () => {
  let cleanupCalls = 0;
  const db = authorityDb(async (call) => {
    if (call.sql.includes('FROM admin_booking_sessions abs')) return pendingResult(706);
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    confirmBooking: async () => ({ status: 'created', appointmentId: 9001 }),
    provisionalClientCleanup: async () => { cleanupCalls += 1; },
  });

  const result = await service.confirm({ adminId: EMERGENCY_ADMIN_ID });
  assert.equal(result.appointmentId, 9001);
  assert.equal(cleanupCalls, 0);
});

test('new-client enhancement preserves exclusive canonical booking writes and the shiloh_calendar confirmation source', () => {
  assert.doesNotMatch(serviceSource, /INSERT INTO appointments/);
  assert.doesNotMatch(routeSource, /INSERT INTO appointments/);
  assert.match(serviceSource, /confirmBooking\(admin, \{ source: 'shiloh_calendar' \}\)/);
  assert.match(serviceSource, /prepareBooking\(\{/);
  assert.match(serviceSource, /createProvisionalClient/);
  assert.match(serviceSource, /cleanupUnusedProvisionalClient/);
});
