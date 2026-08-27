const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createCalendarCreateBookingService,
  staticScopeForAdmin,
} = require('../src/services/calendarCreateBooking');

const enabledEnv = {
  SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true',
};

const principals = {
  christel: {
    id: 2, staff_id: 9, display_name: 'Christel', role: 'owner', business_role: 'owner',
    calendar_scope: 'all_business', service_scope: 'all_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
    admin_active: true, staff_status: 'active', client_bookable: true,
  },
  abigail: {
    id: 3, staff_id: 10, display_name: 'Abigail', role: 'practitioner', business_role: 'employee_practitioner',
    calendar_scope: 'all_business', service_scope: 'own_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
    admin_active: true, staff_status: 'active', client_bookable: true,
  },
  marietjie: {
    id: 4, staff_id: 11, display_name: 'Marietjie', role: 'practitioner', business_role: 'tenant_practitioner',
    calendar_scope: 'all_business', service_scope: 'own_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
    admin_active: true, staff_status: 'active', client_bookable: true,
  },
  jp: {
    id: 5, staff_id: null, display_name: 'Jean-Pierre', role: 'admin', business_role: 'business_admin',
    calendar_scope: 'all_business', service_scope: 'all_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
    admin_active: true, staff_status: null, client_bookable: null,
  },
};

function eligibleRow(overrides = {}) {
  return {
    staff_id: 20,
    staff_name: 'Target Practitioner',
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

function scriptedDb(handler) {
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

function bookingDb({ admin, pending = null, selection = eligibleRow(), optionRows = null, unionRows = null } = {}) {
  return scriptedDb(async (call) => {
    if (call.sql.includes('FROM staff_admin_accounts a')) {
      return Number(call.params[0]) === Number(admin?.id)
        ? { rows: [admin], rowCount: 1 }
        : { rows: [], rowCount: 0 };
    }
    if (call.sql.includes('LOWER(st.display_name) = ANY')) {
      return { rows: unionRows || [
        { id: 9, principal: 'christel' },
        { id: 10, principal: 'abigail' },
      ], rowCount: (unionRows || [1, 2]).length };
    }
    if (call.sql.includes('FROM admin_booking_sessions abs')) {
      return pending ? { rows: [pending], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    if (call.sql.includes('JOIN staff_services ss')) {
      if (call.sql.includes('st.id = $1')) return selection ? { rows: [selection], rowCount: 1 } : { rows: [], rowCount: 0 };
      const rows = optionRows || [selection];
      return { rows, rowCount: rows.length };
    }
    return { rows: [], rowCount: 0 };
  });
}

function pending(overrides = {}) {
  return {
    id: 123,
    source: 'goldie_import',
    staff_id: 20,
    service_id: 44,
    location_id: 1,
    starts_at: '2026-08-28T08:15:00.000Z',
    ends_at: '2026-08-28T09:15:00.000Z',
    state: 'confirm',
    ...overrides,
  };
}

function authorityService({ confirmationSafe = true, bookingContext = { version: 'booking_bound_client_authority_v1', adminId: 3 } } = {}) {
  const calls = { issue: [], load: [] };
  return {
    calls,
    async issueBookingAuthorityContext(input) {
      calls.issue.push(input);
      return { authorityMode: 'booking_bound', operatorRole: 'booking_operator', bookingContext };
    },
    async loadClientAuthorityState(input) {
      calls.load.push(input);
      return {
        confirmationSafe,
        stage: confirmationSafe ? 'confirmation_safe' : 'contact_unverified',
        contacts: [],
        nameAuthority: confirmationSafe ? { status: 'authoritative' } : { status: 'unconfirmed' },
      };
    },
  };
}

const serviceSource = fs.readFileSync(path.join(__dirname, '../src/services/calendarCreateBooking.js'), 'utf8');
const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendarCreateBooking.js'), 'utf8');

test('frozen #505 principal matrix is explicit and fail-closed', () => {
  assert.deepEqual(staticScopeForAdmin(principals.christel), { key: 'christel_own_services', sourceStaffIds: [9] });
  assert.deepEqual(staticScopeForAdmin(principals.abigail), { key: 'abigail_own_services', sourceStaffIds: [10] });
  assert.deepEqual(staticScopeForAdmin(principals.marietjie), { key: 'marietjie_own_services', sourceStaffIds: [11] });
  assert.deepEqual(staticScopeForAdmin(principals.jp), { key: 'jp_christel_abigail_union', sourceStaffIds: null });
  assert.equal(staticScopeForAdmin({ ...principals.abigail, service_scope: 'all_services' }), null);
  assert.equal(staticScopeForAdmin({ ...principals.marietjie, permissions: { 'appointment:create': false, 'client:lookup': true } }), null);
  assert.equal(staticScopeForAdmin({ ...principals.jp, business_role: 'owner' }), null);
  assert.equal(staticScopeForAdmin({ ...principals.christel, display_name: 'Other Admin' }), null);
});

test('JP union resolves to exactly one active canonical Christel and Abigail practitioner record', async () => {
  const db = bookingDb({ admin: principals.jp });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv });
  const admin = await service.resolveOperator(principals.jp.id);
  assert.deepEqual(admin.bookingScope, { key: 'jp_christel_abigail_union', sourceStaffIds: [9, 10] });
  const unionCall = db.calls.find((call) => call.sql.includes('LOWER(st.display_name) = ANY'));
  assert.deepEqual(unionCall.params, [['christel', 'abigail']]);
});

test('JP union fails closed when either canonical practitioner identity is missing or ambiguous', async () => {
  const db = bookingDb({
    admin: principals.jp,
    unionRows: [{ id: 9, principal: 'christel' }, { id: 12, principal: 'christel' }, { id: 10, principal: 'abigail' }],
  });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv });
  await assert.rejects(
    service.resolveOperator(principals.jp.id),
    (error) => error?.code === 'CALENDAR_BOOKING_SCOPE_UNRESOLVED'
  );
});

test('bookable catalogue is bounded by operator service relationships, not target practitioner identity', async () => {
  const db = bookingDb({
    admin: principals.abigail,
    optionRows: [eligibleRow(), eligibleRow({ staff_id: 21, staff_name: 'Another Eligible Practitioner' })],
  });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv });
  const result = await service.listBookableOptions(principals.abigail.id);
  assert.deepEqual(result.staff.map((row) => row.id).sort((a, b) => a - b), [20, 21]);
  assert.equal(result.authority.operatorAdminId, principals.abigail.id);
  assert.equal(result.authority.serviceScope, 'abigail_own_services');
  const optionsCall = db.calls.find((call) => call.sql.includes('JOIN staff_services ss') && !call.sql.includes('st.id = $1'));
  assert.match(optionsCall.sql, /authority_ss\.service_id = sv\.id/);
  assert.match(optionsCall.sql, /authority_ss\.staff_id = ANY\(\$1::bigint\[\]\)/);
  assert.deepEqual(optionsCall.params, [[10]]);
  assert.doesNotMatch(optionsCall.sql, /LOWER\(st\.display_name\) IN/);
});

test('prepare propagates the authenticated operator id and server-derived service scope', async () => {
  const db = bookingDb({ admin: principals.abigail });
  const prepareCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    prepareBooking: async (payload) => {
      prepareCalls.push(payload);
      return {
        status: 'pending_confirmation',
        client: { id: 123, display_name: 'Jane Doe' },
        staff: { id: 20, display_name: 'Target Practitioner' },
        service: { id: 44, name: 'Deep Tissue Massage', price: '650.00', variable_price: false },
        startsAt: '2026-08-28T08:15:00.000Z',
        endsAt: '2026-08-28T09:15:00.000Z',
      };
    },
  });
  const result = await service.prepare({
    adminId: principals.abigail.id,
    clientId: 123,
    staffId: 20,
    serviceId: 44,
    date: '2026-08-28',
    time: '10:15',
  });
  assert.equal(result.status, 'pending_confirmation');
  assert.deepEqual(prepareCalls, [{
    adminId: principals.abigail.id,
    clientId: 123,
    staffName: 'Target Practitioner',
    serviceName: 'Deep Tissue Massage',
    localDateTime: '28/08/2026 10:15',
  }]);
  const selectionCall = db.calls.find((call) => call.sql.includes('st.id = $1'));
  assert.deepEqual(selectionCall.params, [20, 44, [10]]);
});

test('new-client CRM mutation is attributed to the actual authenticated operator', async () => {
  const db = bookingDb({ admin: principals.marietjie });
  const creatorCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    provisionalClientCreator: async (payload) => {
      creatorCalls.push(payload);
      return { status: 'created', client: { id: 701, display_name: 'Jane Doe' } };
    },
    provisionalClientCleanup: async () => ({ status: 'removed' }),
    prepareBooking: async () => ({
      status: 'pending_confirmation',
      client: { id: 701, display_name: 'Jane Doe' },
      staff: { id: 20, display_name: 'Target Practitioner' },
      service: { id: 44, name: 'Deep Tissue Massage', price: '650.00', variable_price: false },
      startsAt: '2026-08-28T08:15:00.000Z',
      endsAt: '2026-08-28T09:15:00.000Z',
    }),
  });
  await service.prepare({
    adminId: principals.marietjie.id,
    newClient: { fullName: 'Jane Doe', mobileNumber: '0821234567' },
    staffId: 20,
    serviceId: 44,
    date: '2026-08-28',
    time: '10:15',
  });
  assert.deepEqual(creatorCalls, [{ fullName: 'Jane Doe', mobileNumber: '0821234567', adminId: principals.marietjie.id }]);
});

test('booking-bound WS-20 context is issued server-side and passed unchanged into authoritative state', async () => {
  const context = {
    version: 'booking_bound_client_authority_v1', adminId: 3, clientId: 123,
    staffId: 20, serviceId: 44, locationId: 1,
    startsAt: '2026-08-28T08:15:00.000Z', endsAt: '2026-08-28T09:15:00.000Z', revision: '2026-08-27T10:00:00.000Z',
  };
  const contactAuthorityService = authorityService({ bookingContext: context, confirmationSafe: false });
  const db = bookingDb({ admin: principals.abigail, pending: pending() });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv, contactAuthorityService });
  const result = await service.preparedAuthority({ adminId: principals.abigail.id });
  assert.strictEqual(result.bookingContext, context);
  assert.deepEqual(contactAuthorityService.calls.issue, [{ actorAdminId: principals.abigail.id, clientId: 123 }]);
  assert.strictEqual(contactAuthorityService.calls.load[0].bookingContext, context);
  assert.equal(contactAuthorityService.calls.load[0].actorAdminId, principals.abigail.id);
  assert.equal(contactAuthorityService.calls.load[0].clientId, 123);
  assert.equal(result.authority.confirmationSafe, false);
});

test('direct JP/Christel CRM authority falls back only when frozen booking-context issuance rejects the direct role', async () => {
  const calls = { issue: 0, load: [] };
  const contactAuthorityService = {
    async issueBookingAuthorityContext() {
      calls.issue += 1;
      const error = new Error('direct operator');
      error.code = 'OPERATOR_AUTHORITY_FORBIDDEN';
      throw error;
    },
    async loadClientAuthorityState(input) {
      calls.load.push(input);
      return { confirmationSafe: true, contacts: [], nameAuthority: { status: 'authoritative' } };
    },
  };
  const db = bookingDb({ admin: principals.christel, pending: pending() });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv, contactAuthorityService });
  const result = await service.preparedAuthority({ adminId: principals.christel.id });
  assert.equal(calls.issue, 1);
  assert.deepEqual(calls.load, [{ actorAdminId: principals.christel.id, clientId: 123 }]);
  assert.equal(result.bookingContext, null);
  assert.equal(result.authority.confirmationSafe, true);
});

test('ordinary Calendar finalization fails closed before canonical booking when confirmationSafe is not true', async () => {
  const contactAuthorityService = authorityService({ confirmationSafe: false });
  const db = bookingDb({ admin: principals.abigail, pending: pending() });
  let confirmCalls = 0;
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    contactAuthorityService,
    confirmBooking: async () => { confirmCalls += 1; return { status: 'created' }; },
  });
  await assert.rejects(
    service.confirm({ adminId: principals.abigail.id }),
    (error) => error?.code === 'CALENDAR_BOOKING_CONFIRMATION_UNSAFE'
  );
  assert.equal(confirmCalls, 0);
});

test('confirmation-safe finalization delegates once to canonical #500-aware booking owner with actual operator identity', async () => {
  const contactAuthorityService = authorityService({ confirmationSafe: true });
  const db = bookingDb({ admin: principals.abigail, pending: pending() });
  const confirmCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    contactAuthorityService,
    confirmBooking: async (...args) => {
      confirmCalls.push(args);
      return { status: 'created', appointmentId: 777, customerConfirmation: { sent: true, deliveryStatus: 'sent' } };
    },
  });
  const result = await service.confirm({ adminId: principals.abigail.id });
  assert.equal(result.appointmentId, 777);
  assert.equal(confirmCalls.length, 1);
  assert.equal(confirmCalls[0][0].id, principals.abigail.id);
  assert.equal(confirmCalls[0][0].display_name, 'Abigail');
  assert.deepEqual(confirmCalls[0][1], { source: 'shiloh_calendar' });
});

test('browser cannot submit a booking context to the Calendar bridge or finalization endpoint', () => {
  const authorityRoute = routeSource.slice(routeSource.indexOf("router.post('/authority'"), routeSource.indexOf("router.post('/discard'"));
  const confirmRoute = routeSource.slice(routeSource.indexOf("router.post('/confirm'"));
  assert.match(authorityRoute, /bookingService\.preparedAuthority\(\{ adminId: req\.staffBrowserSession\.adminId \}\)/);
  assert.doesNotMatch(authorityRoute, /req\.body/);
  assert.doesNotMatch(confirmRoute, /bookingContext|clientId|staffId|serviceId/);
});

test('Calendar layer never writes appointments directly and final source remains bounded', () => {
  assert.doesNotMatch(serviceSource, /INSERT INTO appointments|INSERT INTO appointment_services|INSERT INTO appointment_staff/);
  assert.doesNotMatch(routeSource, /INSERT INTO appointments|INSERT INTO appointment_services|INSERT INTO appointment_staff/);
  assert.match(serviceSource, /confirmBooking\(admin, \{ source: 'shiloh_calendar' \}\)/);
  assert.match(serviceSource, /confirmationSafe !== true/);
});
