const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createCalendarCreateBookingService: createRawCalendarCreateBookingService,
  localDateTimeFromInputs,
} = require('../src/services/calendarCreateBooking');
const TEST_ADMIN_ID = 2;
const {
  checkAuthoritativeSchedule,
} = require('../src/services/adminAvailability');

const enabledEnv = {
  SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://shiloh.example.test',
};

function authorityRow(overrides = {}) {
  return {
    id: TEST_ADMIN_ID,
    staff_id: 9,
    display_name: 'Christel',
    role: 'admin',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:view': true, 'appointment:create': true, 'client:lookup': true },
    admin_active: true,
    staff_status: 'active',
    client_bookable: true,
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

function crmV2Client(overrides = {}) {
  return {
    id: '123',
    name: 'Jane Doe',
    normalizedMobile: '27821234567',
    profileStatus: 'minimal',
    status: 'active',
    ...overrides,
  };
}

function defaultCrmV2Service() {
  return {
    async searchClients() { return []; },
    async getClientById() { return crmV2Client(); },
    async createClient() { return { status: 'created', client: crmV2Client() }; },
  };
}

function createCalendarCreateBookingService(options = {}) {
  return createRawCalendarCreateBookingService({
    ...options,
    crmV2Service: options.crmV2Service || defaultCrmV2Service(),
  });
}

function pendingRow(overrides = {}) {
  return {
    crm_v2_client_id: 123,
    source_client_name: 'Jane Doe',
    client_mobile_snapshot: '27821234567',
    acknowledged_mobile: '27821234567',
    mobile_acknowledged_at: '2026-08-28T07:00:00.000Z',
    current_client_name: 'Jane Doe',
    current_client_mobile: '27821234567',
    current_client_status: 'active',
    staff_id: 9,
    service_id: 44,
    location_id: 1,
    starts_at: '2026-08-28T08:15:00.000Z',
    ends_at: '2026-08-28T09:15:00.000Z',
    state: 'confirm',
    ...overrides,
  };
}

const calendarServiceSource = fs.readFileSync(path.join(__dirname, '../src/services/calendarCreateBooking.js'), 'utf8');
const calendarRouteSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendarCreateBooking.js'), 'utf8');
const adminBookingSource = fs.readFileSync(path.join(__dirname, '../src/services/adminBooking.js'), 'utf8');
const adminAvailabilitySource = fs.readFileSync(path.join(__dirname, '../src/services/adminAvailability.js'), 'utf8');
const adminScheduleUxSource = fs.readFileSync(path.join(__dirname, '../src/services/adminScheduleUx.js'), 'utf8');

test('11 retired emergency feature value cannot disable canonical Create Booking authority', async () => {
  const db = scriptedDb(async (call) => {
    if (call.sql.includes('FROM staff_admin_accounts a')) return { rows: [authorityRow()], rowCount: 1 };
    throw new Error('unexpected query');
  });
  const service = createCalendarCreateBookingService({
    db,
    env: { SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'false' },
  });
  const operator = await service.resolveOperator(TEST_ADMIN_ID);
  assert.equal(operator.id, TEST_ADMIN_ID);
  assert.equal(operator.bookingScope.key, 'all_business:all_services');
});

test('12 booking routes stay private and mutating operations retain same-origin, staff-session and CSRF guards', () => {
  assert.match(calendarRouteSource, /requireStaffSession/);
  assert.match(calendarRouteSource, /sameOriginGuard/);
  assert.match(calendarRouteSource, /csrfGuard/);
  assert.match(calendarRouteSource, /router\.get\('\/'\s*,\s*requireSession/);
  assert.match(calendarRouteSource, /router\.post\('\/prepare'\s*,\s*sameOrigin\s*,\s*requireSession\s*,\s*requireCsrf/);
  assert.match(calendarRouteSource, /router\.post\('\/confirm'\s*,\s*sameOrigin\s*,\s*requireSession\s*,\s*requireCsrf/);
  assert.doesNotMatch(calendarRouteSource, /ADMIN_API_KEY|publicBooking|allowAnonymous/);
});

test('13 Calendar Create Booking accepts any canonically configured principal without a source-name matrix', async () => {
  const db = scriptedDb(async (call) => {
    if (call.sql.includes('FROM staff_admin_accounts a')) {
      return { rows: [authorityRow({ id: 99, display_name: 'Other Admin' })], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv });
  const result = await service.listBookableOptions(99);
  assert.deepEqual(result.staff, []);
  assert.deepEqual(result.services, []);
  assert.equal(result.authority.operatorAdminId, 99);
  assert.equal(db.calls.length, 2);
  assert.match(db.calls[0].sql, /FROM staff_admin_accounts a/);
});

test('14 current canonical Christel authority is revalidated on every booking operation', async () => {
  let authorityChecks = 0;
  const db = scriptedDb(async (call) => {
    if (call.sql.includes('FROM staff_admin_accounts a')) {
      authorityChecks += 1;
      return {
        rows: [authorityChecks === 1
          ? authorityRow()
          : authorityRow({ permissions: { 'appointment:create': false, 'client:lookup': true } })],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
  });
  await service.searchClients(TEST_ADMIN_ID, 'Cl');
  await assert.rejects(
    service.listBookableOptions(TEST_ADMIN_ID),
    (error) => error?.code === 'CALENDAR_BOOKING_FORBIDDEN'
  );
  assert.equal(authorityChecks, 2);
});

test('15 internal bookable options require active staff/service mappings and do not reuse client self-service policy', async () => {
  let optionsSql = '';
  let optionsParams = null;
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) {
      optionsSql = call.sql;
      optionsParams = call.params;
      return { rows: [eligibleRow(), eligibleRow({ staff_id: 10, staff_name: 'Christel' })], rowCount: 2 };
    }
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv });
  const result = await service.listBookableOptions(TEST_ADMIN_ID);
  assert.deepEqual(result.staff.map((row) => row.displayName).sort(), ['Abigail', 'Christel']);
  assert.match(optionsSql, /JOIN staff_services ss/);
  assert.match(optionsSql, /st\.status = 'active'/);
  assert.doesNotMatch(optionsSql, /client_bookable/);
  assert.match(optionsSql, /sv\.status = 'active'/);
  assert.doesNotMatch(optionsSql, /authority_ss/);
  assert.doesNotMatch(optionsSql, /LOWER\(st\.display_name\) IN/);
  assert.deepEqual(optionsParams, []);
});

test('16 client search delegates to CRM V2 with a bounded normalized query', async () => {
  const db = authorityDb();
  const finderCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    crmV2Service: {
      ...defaultCrmV2Service(),
      async searchClients(...args) {
      finderCalls.push(args);
        return [];
      },
    },
  });
  await service.searchClients(TEST_ADMIN_ID, '  Jane   Doe  ');
  assert.deepEqual(finderCalls, [[{ query: 'Jane Doe', status: 'active', limit: 10 }]]);
});

test('17 one-character CRM searches do not execute lookup and all search results require explicit selection', async () => {
  let finderCalls = 0;
  const service = createCalendarCreateBookingService({
    db: authorityDb(),
    env: enabledEnv,
    crmV2Service: {
      ...defaultCrmV2Service(),
      async searchClients() { finderCalls += 1; return []; },
    },
  });
  const result = await service.searchClients(TEST_ADMIN_ID, 'J');
  assert.equal(finderCalls, 0);
  assert.deepEqual(result, { clients: [], requiresExplicitSelection: true });
});

test('18 CRM search serialization exposes only a masked contact hint and never the raw contact value', async () => {
  const rawNumber = '+27821234567';
  const service = createCalendarCreateBookingService({
    db: authorityDb(),
    env: enabledEnv,
    crmV2Service: {
      ...defaultCrmV2Service(),
      async searchClients() { return [crmV2Client()]; },
    },
  });
  const result = await service.searchClients(TEST_ADMIN_ID, 'Jane');
  assert.equal(result.requiresExplicitSelection, true);
  assert.equal(result.clients[0].contactHint, 'ending in 4567');
  assert.equal(JSON.stringify(result).includes(rawNumber), false);
});

test('19 prepare rejects a missing or non-positive canonical CRM client id before provider selection', async () => {
  const db = authorityDb(async () => { throw new Error('provider selection must not run for invalid client id'); });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv });
  await assert.rejects(
    service.prepare({ adminId: TEST_ADMIN_ID, clientId: '0', staffId: 9, serviceId: 44, date: '2026-08-28', time: '10:15' }),
    (error) => error?.code === 'CALENDAR_BOOKING_CLIENT_REQUIRED'
  );
  assert.equal(db.calls.length, 1);
});

test('20 date and time input is strict, Johannesburg-local shaped, and rejects impossible slots', () => {
  assert.equal(localDateTimeFromInputs('2026-08-28', '10:15'), '28/08/2026 10:15');
  assert.throws(() => localDateTimeFromInputs('2026-02-30', '10:15'), (error) => error?.code === 'CALENDAR_BOOKING_INVALID_SLOT');
  assert.throws(() => localDateTimeFromInputs('2026-08-28', '24:00'), (error) => error?.code === 'CALENDAR_BOOKING_INVALID_SLOT');
});

test('21 exact active staff-service eligibility and operator service authority are revalidated immediately before canonical prepare delegation', async () => {
  let selectionSql = '';
  let selectionParams = null;
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) {
      selectionSql = call.sql;
      selectionParams = call.params;
      return { rows: [], rowCount: 0 };
    }
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv });
  await assert.rejects(
    service.prepare({ adminId: TEST_ADMIN_ID, clientId: '123', staffId: 9, serviceId: 44, date: '2026-08-28', time: '10:15' }),
    (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION'
  );
  assert.match(selectionSql, /st\.id = \$1/);
  assert.match(selectionSql, /sv\.id = \$2/);
  assert.match(selectionSql, /st\.status = 'active'/);
  assert.doesNotMatch(selectionSql, /client_bookable/);
  assert.match(selectionSql, /sv\.status = 'active'/);
  assert.doesNotMatch(selectionSql, /authority_ss/);
  assert.doesNotMatch(selectionSql, /LOWER\(st\.display_name\) IN/);
  assert.deepEqual(selectionParams, [9, 44]);
});

test('22 Calendar prepare delegates exact client, provider, service and local slot to the canonical Admin booking engine', async () => {
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const prepareCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    prepareBooking: async (payload) => {
      prepareCalls.push(payload);
      return {
        status: 'pending_confirmation',
        client: payload.crmV2Client,
        staff: { id: 9, display_name: 'Abigail' },
        service: { id: 44, name: 'Deep Tissue Massage', price: '650.00', variable_price: false },
        startsAt: '2026-08-28T08:15:00.000Z',
        endsAt: '2026-08-28T09:15:00.000Z',
      };
    },
  });
  const result = await service.prepare({ adminId: TEST_ADMIN_ID, clientId: '123', staffId: 9, serviceId: 44, date: '2026-08-28', time: '10:15' });
  assert.deepEqual(prepareCalls, [{
    adminId: TEST_ADMIN_ID,
    crmV2Client: crmV2Client(),
    staffName: 'Abigail',
    serviceName: 'Deep Tissue Massage',
    localDateTime: '28/08/2026 10:15',
  }]);
  assert.equal(result.status, 'pending_confirmation');
  assert.equal(result.review.practitioner.displayName, 'Abigail');
});

test('23 canonical prepare denials pass through unchanged and Calendar code cannot write an appointment directly', async () => {
  const db = authorityDb(async (call) => {
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const canonicalDenial = { status: 'schedule_exception', reply: 'Not available.' };
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    crmV2Service: defaultCrmV2Service(),
    prepareBooking: async () => canonicalDenial,
  });
  const result = await service.prepare({ adminId: TEST_ADMIN_ID, clientId: '123', staffId: 9, serviceId: 44, date: '2026-08-28', time: '10:15' });
  assert.strictEqual(result, canonicalDenial);
  assert.doesNotMatch(calendarServiceSource, /INSERT INTO appointments/);
  assert.doesNotMatch(calendarRouteSource, /INSERT INTO appointments/);
});

test('24 Calendar confirm requires confirmation-safe authority then delegates with the bounded shiloh_calendar source', async () => {
  const confirmCalls = [];
  const db = authorityDb(async (call) => {
    if (call.sql.includes('FROM admin_booking_sessions abs')) return { rows: [pendingRow()], rowCount: 1 };
    if (call.sql.includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    confirmBooking: async (...args) => {
      confirmCalls.push(args);
      return { status: 'created', appointmentId: 777 };
    },
  });
  const result = await service.confirm({ adminId: TEST_ADMIN_ID });
  assert.equal(result.appointmentId, 777);
  assert.equal(confirmCalls.length, 1);
  assert.equal(confirmCalls[0][0].id, TEST_ADMIN_ID);
  assert.deepEqual(confirmCalls[0][1], { source: 'shiloh_calendar' });
});

test('25 approved leave is applied atomically as full-day canonical staff_schedule_exceptions before request approval commits', () => {
  const start = adminScheduleUxSource.indexOf('async function approveLeave');
  const end = adminScheduleUxSource.indexOf('async function declineLeave');
  const approveSource = adminScheduleUxSource.slice(start, end);
  const insertAt = approveSource.indexOf('INSERT INTO staff_schedule_exceptions');
  const approveAt = approveSource.indexOf("status='approved'");
  assert.ok(start >= 0 && end > start);
  assert.match(approveSource, /await db\.query\('BEGIN'\)/);
  assert.match(approveSource, /exception_type,starts_local,ends_local,reason\) VALUES\(\$1,\$2::date,'unavailable',NULL,NULL,\$3\)/);
  assert.ok(insertAt >= 0 && approveAt > insertAt);
  assert.match(approveSource, /await db\.query\('COMMIT'\)/);
  assert.match(approveSource, /await db\.query\('ROLLBACK'\)/);
});

test('26 the canonical scheduling engine treats a full-day approved-leave exception as unavailable', async () => {
  const db = {
    async query(sql) {
      assert.match(String(sql), /staff_schedule_exceptions/);
      return {
        rows: [{
          scheduling_type: 'regular',
          has_base_override: true,
          inside_base_hours: true,
          recurring_closed: false,
          inside_available_exception: false,
          all_day_unavailable: true,
          partial_unavailable: false,
        }],
        rowCount: 1,
      };
    },
  };
  const result = await checkAuthoritativeSchedule({
    db,
    staffId: 9,
    locationId: 1,
    startsAt: '2026-08-28T08:15:00.000Z',
    endsAt: '2026-08-28T09:15:00.000Z',
  });
  assert.equal(result.allDayUnavailable, true);
  assert.equal(result.insideAvailableException, false);
  assert.equal(result.covered, false);
});

test('27 approved-leave parity is single-source: approval writes the same exception table and unavailable shape consumed by availability', () => {
  assert.match(adminScheduleUxSource, /INSERT INTO staff_schedule_exceptions[\s\S]*'unavailable',NULL,NULL/);
  assert.match(adminAvailabilitySource, /FROM staff_schedule_exceptions ex[\s\S]*ex\.exception_type='unavailable'[\s\S]*ex\.starts_local IS NULL[\s\S]*ex\.ends_local IS NULL/);
  assert.match(adminAvailabilitySource, /schedule\.partialUnavailable\|\|\(schedule\.allDayUnavailable&&!schedule\.insideAvailableException\)/);
});

test('28 canonical confirmation revalidates eligibility, clinic hours, staff schedule and conflicts after locking and before appointment insertion', () => {
  const confirmStart = adminBookingSource.indexOf('async function confirmAdminBooking');
  const confirmSource = adminBookingSource.slice(confirmStart);
  const lockAt = confirmSource.indexOf('FOR UPDATE OF abs');
  const eligibilityAt = confirmSource.indexOf('SELECT 1 FROM staff_services');
  const clinicAt = confirmSource.indexOf('await checkClinicHours');
  const scheduleAt = confirmSource.indexOf('await checkAuthoritativeSchedule');
  const conflictsAt = confirmSource.indexOf('await getConflicts');
  const appointmentInsertAt = confirmSource.indexOf('INSERT INTO appointments');
  assert.ok(confirmStart >= 0);
  assert.ok(lockAt >= 0);
  assert.ok(eligibilityAt > lockAt);
  assert.ok(clinicAt > eligibilityAt);
  assert.ok(scheduleAt > clinicAt);
  assert.ok(conflictsAt > scheduleAt);
  assert.ok(appointmentInsertAt > conflictsAt);
});

test('29 stale-slot schedule or conflict changes fail closed by discarding the pending session before any final appointment write', () => {
  const confirmStart = adminBookingSource.indexOf('async function confirmAdminBooking');
  const confirmSource = adminBookingSource.slice(confirmStart);
  const scheduleAt = confirmSource.indexOf('const schedule = await checkAuthoritativeSchedule');
  const conflictAt = confirmSource.indexOf('const conflicts = await getConflicts');
  const appointmentInsertAt = confirmSource.indexOf('INSERT INTO appointments');
  const scheduleBranch = confirmSource.slice(scheduleAt, conflictAt);
  const conflictBranch = confirmSource.slice(conflictAt, appointmentInsertAt);
  assert.match(scheduleBranch, /DELETE FROM admin_booking_sessions/);
  assert.match(scheduleBranch, /status: "schedule_changed"/);
  assert.match(scheduleBranch, /Nothing was written/);
  assert.match(conflictBranch, /DELETE FROM admin_booking_sessions/);
  assert.match(conflictBranch, /status: "conflict"/);
  assert.match(conflictBranch, /Nothing was written/);
  assert.ok(appointmentInsertAt > conflictAt);
});

test('30 final booking writes remain exclusively canonical with no external provider guard or mirror', () => {
  const confirmStart = adminBookingSource.indexOf('async function confirmAdminBooking');
  const confirmSource = adminBookingSource.slice(confirmStart);
  const appointmentInsertAt = confirmSource.indexOf('INSERT INTO appointments');
  assert.doesNotMatch(calendarServiceSource, /INSERT INTO appointments|INSERT INTO appointment_services|INSERT INTO appointment_staff/);
  assert.doesNotMatch(calendarRouteSource, /INSERT INTO appointments|INSERT INTO appointment_services|INSERT INTO appointment_staff/);
  assert.match(confirmSource, /INSERT INTO appointments/);
  assert.match(confirmSource, /INSERT INTO appointment_services/);
  assert.match(confirmSource, /INSERT INTO appointment_staff/);
  assert.ok(appointmentInsertAt >= 0);
  assert.doesNotMatch(confirmSource, /checkCalendarAvailability|checkPractitionerCalendarAvailability|appointment_calendar_events/);
  assert.match(confirmSource, /bookingSource = options\.source \|\| "shiloh_admin_whatsapp"/);
});
