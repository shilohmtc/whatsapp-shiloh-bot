const test = require('node:test');
const assert = require('node:assert/strict');

const { createCalendarCreateBookingService } = require('../src/services/calendarCreateBooking');

const env = { SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true' };

const admins = {
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

const serviceOwners = new Map([
  [101, [9]],
  [102, [10]],
  [103, [11]],
  [104, [9, 10]],
]);

const serviceNames = new Map([
  [101, 'Christel Service'],
  [102, 'Abigail Service'],
  [103, 'Marietjie Service'],
  [104, 'Christel Abigail Shared Service'],
]);

function eligibleRow(staffId, serviceId) {
  return {
    staff_id: staffId,
    staff_name: `Target ${staffId}`,
    service_id: serviceId,
    service_name: serviceNames.get(serviceId),
    duration_minutes: 60,
    processing_time_minutes: 0,
    extra_time_minutes: 0,
    price: '500.00',
    variable_price: false,
  };
}

function matrixDb() {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      const text = String(sql);
      calls.push({ sql: text, params });
      if (text.includes('FROM staff_admin_accounts a')) {
        const admin = Object.values(admins).find((item) => Number(item.id) === Number(params[0]));
        return admin ? { rows: [admin], rowCount: 1 } : { rows: [], rowCount: 0 };
      }
      if (text.includes('LOWER(st.display_name) = ANY')) {
        return {
          rows: [{ id: 9, principal: 'christel' }, { id: 10, principal: 'abigail' }],
          rowCount: 2,
        };
      }
      if (text.includes('JOIN staff_services ss') && text.includes('st.id = $1')) {
        const targetStaffId = Number(params[0]);
        const serviceId = Number(params[1]);
        const sourceStaffIds = (params[2] || []).map(Number);
        const owners = serviceOwners.get(serviceId) || [];
        const operatorOwnsService = owners.some((ownerId) => sourceStaffIds.includes(ownerId));
        const targetIsBookableAndAssigned = [20, 21, 22].includes(targetStaffId) && serviceOwners.has(serviceId);
        if (operatorOwnsService && targetIsBookableAndAssigned) {
          return { rows: [eligibleRow(targetStaffId, serviceId)], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    },
  };
}

const matrixClient = Object.freeze({
  id: '700',
  name: 'Matrix Client',
  normalizedMobile: '27821234567',
  profileStatus: 'minimal',
  status: 'active',
});

function crmV2() {
  return {
    async searchClients() { return []; },
    async getClientById() { return matrixClient; },
    async createClient() { return { status: 'existing', client: matrixClient }; },
  };
}

async function exercise(admin, serviceId, targetStaffId = 20) {
  const db = matrixDb();
  const prepareCalls = [];
  const service = createCalendarCreateBookingService({
    db,
    env,
    crmV2Service: crmV2(),
    prepareBooking: async (payload) => {
      prepareCalls.push(payload);
      return {
        status: 'pending_confirmation',
        client: payload.crmV2Client,
        staff: { id: targetStaffId, display_name: `Target ${targetStaffId}` },
        service: { id: serviceId, name: serviceNames.get(serviceId), price: '500.00', variable_price: false },
        startsAt: '2026-08-28T08:00:00.000Z',
        endsAt: '2026-08-28T09:00:00.000Z',
      };
    },
  });
  const input = {
    adminId: admin.id,
    clientId: 700,
    staffId: targetStaffId,
    serviceId,
    date: '2026-08-28',
    time: '10:00',
  };
  return { db, prepareCalls, service, input };
}

const matrix = [
  { name: 'Christel', admin: admins.christel, allowed: [101, 104], denied: [102, 103], expectedSources: [9] },
  { name: 'Abigail', admin: admins.abigail, allowed: [102, 104], denied: [101, 103], expectedSources: [10] },
  { name: 'Marietjie', admin: admins.marietjie, allowed: [103], denied: [101, 102, 104], expectedSources: [11] },
  { name: 'JP', admin: admins.jp, allowed: [101, 102, 104], denied: [103], expectedSources: [9, 10] },
];

for (const row of matrix) {
  test(`${row.name}: every in-scope service can reach canonical prepare and preserves actual operator provenance`, async () => {
    for (const serviceId of row.allowed) {
      const run = await exercise(row.admin, serviceId);
      const result = await run.service.prepare(run.input);
      assert.equal(result.status, 'pending_confirmation');
      assert.equal(run.prepareCalls.length, 1);
      assert.equal(run.prepareCalls[0].adminId, row.admin.id);
      const selection = run.db.calls.find((call) => call.sql.includes('JOIN staff_services ss') && call.sql.includes('st.id = $1'));
      assert.deepEqual(selection.params[2], row.expectedSources);
    }
  });

  test(`${row.name}: every out-of-scope service is rejected before any canonical booking write path`, async () => {
    for (const serviceId of row.denied) {
      const run = await exercise(row.admin, serviceId);
      await assert.rejects(
        run.service.prepare(run.input),
        (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION'
      );
      assert.equal(run.prepareCalls.length, 0);
    }
  });
}

test('JP union excludes Marietjie-only service authority even though JP has whole-Calendar visibility', async () => {
  const run = await exercise(admins.jp, 103);
  await assert.rejects(
    run.service.prepare(run.input),
    (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION'
  );
  assert.equal(run.prepareCalls.length, 0);
  const selection = run.db.calls.find((call) => call.sql.includes('JOIN staff_services ss') && call.sql.includes('st.id = $1'));
  assert.deepEqual(selection.params[2], [9, 10]);
  assert.equal(selection.params[2].includes(11), false);
});

test('changing or forging target practitioner cannot broaden service authority', async () => {
  const run = await exercise(admins.abigail, 102, 999);
  await assert.rejects(
    run.service.prepare(run.input),
    (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION'
  );
  assert.equal(run.prepareCalls.length, 0);
});
