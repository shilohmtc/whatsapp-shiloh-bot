const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createCalendarCreateBookingService } = require('../src/services/calendarCreateBooking');

const env = { SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true' };
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

function eligibleRow(staffId, serviceId) {
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
  };
}

function matrixDb({ admin, ownServiceIds = [], targetStaffId = 20, serviceId = 101 } = {}) {
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
      if (text.includes('JOIN staff_services ss') && text.includes('st.id = $1')) {
        if (Number(params[0]) !== targetStaffId || Number(params[1]) !== serviceId) return { rows: [], rowCount: 0 };
        return { rows: [eligibleRow(targetStaffId, serviceId)], rowCount: 1 };
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

async function exercise(admin, serviceId, targetStaffId, ownServiceIds = []) {
  const db = matrixDb({ admin, ownServiceIds, targetStaffId, serviceId });
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
  test(`${name}: all-business/all-services capability can internally book active mapped practitioners`, async () => {
    for (const [serviceId, staffId] of [[101, 20], [102, 21], [103, 22]]) {
      const run = await exercise(admin, serviceId, staffId);
      const result = await run.service.prepare(run.input);
      assert.equal(result.status, 'pending_confirmation');
      assert.equal(run.prepareCalls[0].adminId, admin.id);
    }
  });
}

test('Marietjie own-services capability is data-scoped without a name branch', async () => {
  const allowed = await exercise(admins.marietjie, 103, 22, [103]);
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

test('changing a browser-supplied target cannot invent a missing canonical staff/service mapping', async () => {
  const run = await exercise(admins.naomi, 101, 999);
  run.db.query = async (sql) => {
    if (String(sql).includes('calendarAuthorization:principal')) return { rows: [admins.naomi], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  };
  await assert.rejects(run.service.prepare(run.input), (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION');
  assert.equal(run.prepareCalls.length, 0);
});
