const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createCalendarCreateBookingService, staticScopeForAdmin } = require('../src/services/calendarCreateBooking');

const enabledEnv = { SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true' };
const principals = {
  christel: { id: 2, staff_id: 9, display_name: 'Christel', role: 'owner', business_role: 'owner', calendar_scope: 'all_business', service_scope: 'all_services', permissions: { 'appointment:create': true, 'client:lookup': true }, admin_active: true, staff_status: 'active', client_bookable: true },
  abigail: { id: 3, staff_id: 10, display_name: 'Abigail', role: 'practitioner', business_role: 'employee_practitioner', calendar_scope: 'all_business', service_scope: 'own_services', permissions: { 'appointment:create': true, 'client:lookup': true }, admin_active: true, staff_status: 'active', client_bookable: true },
  marietjie: { id: 4, staff_id: 11, display_name: 'Marietjie', role: 'practitioner', business_role: 'tenant_practitioner', calendar_scope: 'all_business', service_scope: 'own_services', permissions: { 'appointment:create': true, 'client:lookup': true }, admin_active: true, staff_status: 'active', client_bookable: true },
  jp: { id: 5, staff_id: null, display_name: 'Jean-Pierre', role: 'admin', business_role: 'business_admin', calendar_scope: 'all_business', service_scope: 'all_services', permissions: { 'appointment:create': true, 'client:lookup': true }, admin_active: true, staff_status: null, client_bookable: null },
};

function eligibleRow(overrides = {}) {
  return { staff_id: 20, staff_name: 'Target Practitioner', service_id: 44, service_name: 'Deep Tissue Massage', duration_minutes: 60, processing_time_minutes: 0, extra_time_minutes: 0, price: '650.00', variable_price: false, ...overrides };
}

function scriptedDb(handler) {
  const calls = [];
  return { calls, async query(sql, params = []) { const call = { sql: String(sql), params }; calls.push(call); return (await handler(call)) || { rows: [], rowCount: 0 }; } };
}

function bookingDb({ admin, pending = null, selection = eligibleRow(), optionRows = null, unionRows = null } = {}) {
  return scriptedDb(async (call) => {
    if (call.sql.includes('FROM staff_admin_accounts a')) return Number(call.params[0]) === Number(admin?.id) ? { rows: [admin], rowCount: 1 } : { rows: [], rowCount: 0 };
    if (call.sql.includes('LOWER(st.display_name) = ANY')) {
      const rows = unionRows || [{ id: 9, principal: 'christel' }, { id: 10, principal: 'abigail' }];
      return { rows, rowCount: rows.length };
    }
    if (call.sql.includes('FROM admin_booking_sessions abs')) return pending ? { rows: [pending], rowCount: 1 } : { rows: [], rowCount: 0 };
    if (call.sql.includes('JOIN staff_services ss')) {
      if (call.sql.includes('st.id = $1')) return selection ? { rows: [selection], rowCount: 1 } : { rows: [], rowCount: 0 };
      const rows = optionRows || [selection]; return { rows, rowCount: rows.length };
    }
    return { rows: [], rowCount: 0 };
  });
}

function client(id = '123') {
  return { id, name: 'Jane Doe', normalizedMobile: '27821234567', profileStatus: 'minimal', status: 'active' };
}

function crmV2() {
  return { async searchClients() { return []; }, async getClientById(id) { return client(String(id)); }, async createClient() { return { status: 'created', client: client() }; } };
}

function pending(overrides = {}) {
  return { crm_v2_client_id: 123, source_client_name: 'Jane Doe', client_mobile_snapshot: '27821234567', acknowledged_mobile: '27821234567', mobile_acknowledged_at: '2026-08-28T07:00:00.000Z', staff_id: 20, service_id: 44, location_id: 1, starts_at: '2026-08-28T08:15:00.000Z', ends_at: '2026-08-28T09:15:00.000Z', state: 'confirm', current_client_name: 'Jane Doe', current_client_mobile: '27821234567', current_client_status: 'active', ...overrides };
}

test('frozen service-scope principal matrix remains explicit and fail-closed', () => {
  assert.deepEqual(staticScopeForAdmin(principals.christel), { key: 'christel_own_services', sourceStaffIds: [9] });
  assert.deepEqual(staticScopeForAdmin(principals.abigail), { key: 'abigail_own_services', sourceStaffIds: [10] });
  assert.deepEqual(staticScopeForAdmin(principals.marietjie), { key: 'marietjie_own_services', sourceStaffIds: [11] });
  assert.deepEqual(staticScopeForAdmin(principals.jp), { key: 'jp_christel_abigail_union', sourceStaffIds: null });
  assert.equal(staticScopeForAdmin({ ...principals.abigail, service_scope: 'all_services' }), null);
  assert.equal(staticScopeForAdmin({ ...principals.jp, business_role: 'owner' }), null);
});

test('JP union resolves exactly one active Christel and Abigail and rejects ambiguity', async () => {
  const db = bookingDb({ admin: principals.jp });
  const service = createCalendarCreateBookingService({ db, env: enabledEnv, crmV2Service: crmV2() });
  const admin = await service.resolveOperator(principals.jp.id);
  assert.deepEqual(admin.bookingScope.sourceStaffIds, [9, 10]);

  const ambiguous = createCalendarCreateBookingService({
    db: bookingDb({ admin: principals.jp, unionRows: [{ id: 9, principal: 'christel' }, { id: 12, principal: 'christel' }, { id: 10, principal: 'abigail' }] }),
    env: enabledEnv,
    crmV2Service: crmV2(),
  });
  await assert.rejects(ambiguous.resolveOperator(principals.jp.id), (error) => error?.code === 'CALENDAR_BOOKING_SCOPE_UNRESOLVED');
});

test('bookable catalogue and prepare remain bounded by authenticated service relationships', async () => {
  const db = bookingDb({ admin: principals.abigail, optionRows: [eligibleRow(), eligibleRow({ staff_id: 21 })] });
  const prepareCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    crmV2Service: crmV2(),
    prepareBooking: async (input) => {
      prepareCalls.push(input);
      return { status: 'pending_confirmation', client: input.crmV2Client, staff: { id: 20, display_name: 'Target Practitioner' }, service: { id: 44, name: 'Deep Tissue Massage', price: '650.00', variable_price: false }, startsAt: '2026-08-28T08:15:00.000Z', endsAt: '2026-08-28T09:15:00.000Z' };
    },
  });
  const options = await service.listBookableOptions(principals.abigail.id);
  assert.equal(options.authority.serviceScope, 'abigail_own_services');
  const result = await service.prepare({ adminId: principals.abigail.id, clientId: 123, staffId: 20, serviceId: 44, date: '2026-08-28', time: '10:15' });
  assert.equal(result.status, 'pending_confirmation');
  assert.equal(prepareCalls[0].adminId, principals.abigail.id);
  assert.equal(prepareCalls[0].crmV2Client.id, '123');
  const selection = db.calls.find((call) => call.sql.includes('st.id = $1'));
  assert.deepEqual(selection.params, [20, 44, [10]]);
});

test('out-of-scope service is rejected before CRM V2 lookup or booking preparation', async () => {
  let clientReads = 0; let prepares = 0;
  const service = createCalendarCreateBookingService({
    db: bookingDb({ admin: principals.marietjie, selection: null }),
    env: enabledEnv,
    crmV2Service: { ...crmV2(), async getClientById() { clientReads += 1; return client(); } },
    prepareBooking: async () => { prepares += 1; },
  });
  await assert.rejects(service.prepare({ adminId: principals.marietjie.id, clientId: 123, staffId: 20, serviceId: 44, date: '2026-08-28', time: '10:15' }), (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION');
  assert.equal(clientReads, 0);
  assert.equal(prepares, 0);
});

test('mobile acknowledgement and final confirmation are bound to session actor, scope and V2 pending state', async () => {
  const db = bookingDb({ admin: principals.abigail, pending: pending() });
  const ackCalls = []; const confirmCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    crmV2Service: crmV2(),
    acknowledgeBooking: async (adminId) => { ackCalls.push(adminId); return { status: 'acknowledged', client: client() }; },
    confirmBooking: async (...args) => { confirmCalls.push(args); return { status: 'created', appointmentId: 777 }; },
  });
  const acknowledgement = await service.acknowledgeMobile({ adminId: principals.abigail.id, actorAdminId: 99, clientId: 999 });
  const result = await service.confirm({ adminId: principals.abigail.id, actorAdminId: 99, clientId: 999 });
  assert.equal(acknowledgement.confirmationSafe, true);
  assert.deepEqual(ackCalls, [principals.abigail.id]);
  assert.equal(confirmCalls[0][0].id, principals.abigail.id);
  assert.deepEqual(confirmCalls[0][1], { source: 'shiloh_calendar' });
  assert.equal(result.appointmentId, 777);
});

test('Calendar endpoints never accept browser identity for acknowledgement or confirmation', () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendarCreateBooking.js'), 'utf8');
  const ack = routeSource.slice(routeSource.indexOf("router.post('/mobile-acknowledgement'"), routeSource.indexOf("router.post('/discard'"));
  const confirm = routeSource.slice(routeSource.indexOf("router.post('/confirm'"));
  assert.match(ack, /sameOrigin, requireSession, requireCsrf/);
  assert.match(ack, /adminId: req\.staffBrowserSession\.adminId/);
  assert.doesNotMatch(ack, /req\.body/);
  assert.doesNotMatch(confirm, /req\.body|clientId|mobile|actorAdminId/);
});

test('Calendar layer delegates V2 appointment writes and never writes legacy identity', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/calendarCreateBooking.js'), 'utf8');
  assert.doesNotMatch(source, /INSERT INTO appointments|INSERT INTO clients|INSERT INTO client_contacts/);
  assert.match(source, /confirmBooking\(admin, \{ source: 'shiloh_calendar' \}\)/);
  assert.match(source, /mobile_acknowledged_at/);
  assert.doesNotMatch(source, /operatorContactAuthority|client_identity_verifications/);
});
