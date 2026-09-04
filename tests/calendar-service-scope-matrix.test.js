const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createCalendarCreateBookingService } = require('../src/services/calendarCreateBooking');

const env = {};
const createPermissions = { 'appointment:view': true, 'appointment:create': true, 'client:lookup': true };

const admins = {
  christel: {
    id: 2, staff_id: 9, display_name: 'Christel', business_role: 'owner',
    calendar_scope: 'all_business', service_scope: 'all_services', permissions: createPermissions,
    admin_active: true, staff_status: 'active',
  },
  marietjie: {
    id: 4, staff_id: 11, display_name: 'Marietjie', business_role: 'tenant_practitioner',
    calendar_scope: 'own_services', service_scope: 'own_services', permissions: createPermissions,
    admin_active: true, staff_status: 'active',
  },
  naomi: {
    id: 6, staff_id: null, display_name: 'Naomi', business_role: 'booking_operator',
    calendar_scope: 'all_business', service_scope: 'all_services', permissions: createPermissions,
    admin_active: true, staff_status: null,
  },
  jp: {
    id: 5, staff_id: null, display_name: 'Jean-Pierre', business_role: 'business_admin',
    calendar_scope: 'all_business', service_scope: 'all_services', permissions: createPermissions,
    admin_active: true, staff_status: null,
  },
  abigail: {
    id: 3, staff_id: 10, display_name: 'Abigail', business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments', service_scope: 'own_services',
    permissions: { 'appointment:view': true, 'client:lookup': true },
    admin_active: true, staff_status: 'active',
  },
};

const services = new Map([[101, 'Pieter massage'], [102, 'Savanna massage'], [103, 'Marietjie treatment']]);

function eligibleRow(staffId, serviceId, overrides = {}) {
  return {
    staff_id: staffId,
    staff_name: `Target ${staffId}`,
    service_id: serviceId,
    service_name: services.get(serviceId),
    duration_minutes: 60,
    processing_time_minutes: 0,
    extra_time_minutes: 0,
    price: '500.00',
    variable_price: false,
    private_owner_staff_id: null,
    ...overrides,
  };
}

function matrixDb({ admin, ownServiceIds = [], targetStaffId = 20, serviceId = 101, privateOwnerStaffId = null, catalogueRows = null } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      const text = String(sql);
      calls.push({ sql: text, params });
      if (text.includes('calendarAuthorization:principal')) return { rows: [admin], rowCount: 1 };
      if (text.includes('calendarAuthorization:services')) {
        return { rows: ownServiceIds.map((id) => ({ service_id: id })), rowCount: ownServiceIds.length };
      }
      if (text.includes('JOIN staff_services ss')) {
        if (text.includes('st.id = $1')) {
          if (Number(params[0]) !== targetStaffId || Number(params[1]) !== serviceId) return { rows: [], rowCount: 0 };
          return { rows: [eligibleRow(targetStaffId, serviceId, { private_owner_staff_id: privateOwnerStaffId })], rowCount: 1 };
        }
        const rows = catalogueRows || [eligibleRow(targetStaffId, serviceId, { private_owner_staff_id: privateOwnerStaffId })];
        return { rows, rowCount: rows.length };
      }
      return { rows: [], rowCount: 0 };
    },
  };
}

const client = { id: '700', name: 'Matrix Client', normalizedMobile: '27821234567', profileStatus: 'minimal', status: 'active' };
const crmV2 = {
  async searchClients() { return []; },
  async getClientById() { return client; },
  async createClient() { return { status: 'existing', client }; },
};

async function exercise(admin, serviceId, targetStaffId, ownServiceIds = [], privateOwnerStaffId = null) {
  const db = matrixDb({ admin, ownServiceIds, targetStaffId, serviceId, privateOwnerStaffId });
  const prepareCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env,
    crmV2Service: crmV2,
    prepareBooking: async (payload) => {
      prepareCalls.push(payload);
      return {
        status: 'pending_confirmation',
        client: payload.crmV2Client,
        staff: { id: targetStaffId, display_name: `Target ${targetStaffId}` },
        service: { id: serviceId, name: services.get(serviceId), price: '500.00', variable_price: false },
        startsAt: '2026-08-28T08:00:00.000Z',
        endsAt: '2026-08-28T09:00:00.000Z',
      };
    },
  });
  const input = { adminId: admin.id, clientId: 700, staffId: targetStaffId, serviceId, date: '2026-08-28', time: '10:00' };
  return { db, prepareCalls, service, input };
}

for (const [name, admin] of [['Christel', admins.christel], ['Naomi', admins.naomi], ['JP', admins.jp]]) {
  test(`${name}: all-business/all-services capability can internally book ordinary active mapped practitioners`, async () => {
    for (const [serviceId, staffId] of [[101, 20], [102, 21], [103, 22]]) {
      const run = await exercise(admin, serviceId, staffId);
      const result = await run.service.prepare(run.input);
      assert.equal(result.status, 'pending_confirmation');
      assert.equal(run.prepareCalls[0].adminId, admin.id);
    }
  });
}

test('tenant-private service visibility is role/data-driven: receptionist and owning tenant allowed; owner/admin denied', async () => {
  const ownerDenied = await exercise(admins.christel, 103, 22, [], 11);
  await assert.rejects(ownerDenied.service.prepare(ownerDenied.input), (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION');
  assert.equal(ownerDenied.prepareCalls.length, 0);

  const adminDenied = await exercise(admins.jp, 103, 22, [], 11);
  await assert.rejects(adminDenied.service.prepare(adminDenied.input), (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION');
  assert.equal(adminDenied.prepareCalls.length, 0);

  const receptionistAllowed = await exercise(admins.naomi, 103, 22, [], 11);
  assert.equal((await receptionistAllowed.service.prepare(receptionistAllowed.input)).status, 'pending_confirmation');

  const tenantAllowed = await exercise(admins.marietjie, 103, 22, [103], 11);
  assert.equal((await tenantAllowed.service.prepare(tenantAllowed.input)).status, 'pending_confirmation');

  const wrongTenantDenied = await exercise(admins.marietjie, 103, 22, [103], 12);
  await assert.rejects(wrongTenantDenied.service.prepare(wrongTenantDenied.input), (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION');
  assert.equal(wrongTenantDenied.prepareCalls.length, 0);
});

test('Calendar catalogue applies the same tenant-private visibility rule before rendering options', async () => {
  const privateRow = eligibleRow(22, 103, { private_owner_staff_id: 11 });
  const ordinaryRow = eligibleRow(20, 101);

  const christelDb = matrixDb({ admin: admins.christel, catalogueRows: [ordinaryRow, privateRow] });
  const christelService = createCalendarCreateBookingService({ db: christelDb, env, crmV2Service: crmV2 });
  const christelOptions = await christelService.listBookableOptions(admins.christel.id);
  assert.deepEqual(christelOptions.services.map((item) => item.id), [101]);

  const naomiDb = matrixDb({ admin: admins.naomi, catalogueRows: [ordinaryRow, privateRow] });
  const naomiService = createCalendarCreateBookingService({ db: naomiDb, env, crmV2Service: crmV2 });
  const naomiOptions = await naomiService.listBookableOptions(admins.naomi.id);
  assert.deepEqual(naomiOptions.services.map((item) => item.id), [101, 103]);

  const marietjieDb = matrixDb({ admin: admins.marietjie, ownServiceIds: [103], catalogueRows: [ordinaryRow, privateRow] });
  const marietjieService = createCalendarCreateBookingService({ db: marietjieDb, env, crmV2Service: crmV2 });
  const marietjieOptions = await marietjieService.listBookableOptions(admins.marietjie.id);
  assert.deepEqual(marietjieOptions.services.map((item) => item.id), [103]);
});

test('Marietjie own-services capability is data-scoped without a name branch', async () => {
  const allowed = await exercise(admins.marietjie, 103, 22, [103], 11);
  assert.equal((await allowed.service.prepare(allowed.input)).status, 'pending_confirmation');

  const denied = await exercise(admins.marietjie, 101, 20, [103]);
  await assert.rejects(denied.service.prepare(denied.input), (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION');
  assert.equal(denied.prepareCalls.length, 0);
});

test('Abigail lacks Calendar Create Booking capability even while view/client lookup remain', async () => {
  const run = await exercise(admins.abigail, 101, 20, [101]);
  await assert.rejects(run.service.prepare(run.input), (error) => error?.code === 'CALENDAR_BOOKING_FORBIDDEN');
  assert.equal(run.prepareCalls.length, 0);
});

test('internal Calendar selection never uses client_bookable while client paths retain it', () => {
  const calendar = fs.readFileSync(path.join(__dirname, '../src/services/calendarCreateBooking.js'), 'utf8');
  const clientAvailability = fs.readFileSync(path.join(__dirname, '../src/services/clientBookingAvailability.js'), 'utf8');
  assert.doesNotMatch(calendar, /client_bookable/);
  assert.match(clientAvailability, /client_bookable\s*=\s*TRUE/);
});

test('tenant-private migration backfill is canonical and conservative, without person/service-name policy', () => {
  const migration = fs.readFileSync(path.join(__dirname, '../migrations/097_tenant_private_service_visibility.sql'), 'utf8');
  assert.match(migration, /service_visibility_policies/);
  assert.match(migration, /visibility_scope\s*=\s*'tenant_private'/);
  assert.match(migration, /active_practitioner_count\s*=\s*1/);
  assert.match(migration, /business_role\s*=\s*'tenant_practitioner'/);
  assert.doesNotMatch(migration, /Marietjie|Christel|Naomi|Jean-Pierre|MediHeel|Elim/i);
});

test('changing a browser-supplied target cannot invent a missing canonical staff/service mapping', async () => {
  const run = await exercise(admins.naomi, 101, 999);
  run.db.query = async (sql) => {
    if (String(sql).includes('calendarAuthorization:principal')) return { rows: [admins.naomi], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  };
  await assert.rejects(run.service.prepare(run.input), (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION');
  assert.equal(run.prepareCalls.length, 0);
});
