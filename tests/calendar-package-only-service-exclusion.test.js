const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createCalendarCreateBookingService } = require('../src/services/calendarCreateBooking');

const ROOT = path.join(__dirname, '..');
const serviceSource = fs.readFileSync(path.join(ROOT, 'src/services/calendarCreateBooking.js'), 'utf8');
const packageMigration = fs.readFileSync(path.join(ROOT, 'migrations/061_massage_packages.sql'), 'utf8');

function authorityRow() {
  return {
    id: 2,
    staff_id: 9,
    display_name: 'Synthetic Owner',
    role: 'admin',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:view': true, 'appointment:create': true, 'client:lookup': true },
    admin_active: true,
    staff_status: 'active',
    client_bookable: true,
  };
}

function eligibleRow(overrides = {}) {
  return {
    staff_id: 9,
    staff_name: 'Synthetic Practitioner',
    service_id: 44,
    service_name: 'Deep Tissue Massage',
    category_name: 'Massage',
    external_source: 'goldie',
    external_id: 'ordinary-service',
    duration_minutes: 60,
    processing_time_minutes: 0,
    extra_time_minutes: 0,
    price: '650.00',
    variable_price: false,
    ...overrides,
  };
}

function client() {
  return {
    id: '701',
    name: 'Synthetic Client',
    normalizedMobile: '27821234567',
    profileStatus: 'minimal',
    status: 'active',
  };
}

function scriptedDb(selectionRow) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      const text = String(sql);
      calls.push({ sql: text, params });
      if (text.includes('FROM staff_admin_accounts a')) return { rows: [authorityRow()], rowCount: 1 };
      if (text.includes('JOIN staff_services ss') && text.includes('st.id = $1')) {
        assert.match(text, /NOT EXISTS\s*\([\s\S]*FROM service_packages sp[\s\S]*sp\.session_service_id = sv\.id[\s\S]*sp\.status = 'active'/);
        return selectionRow ? { rows: [selectionRow], rowCount: 1 } : { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    },
  };
}

test('ordinary Calendar catalogue and exact selection both exclude active package session services by canonical package data', () => {
  const guards = serviceSource.match(/FROM service_packages sp/g) || [];
  assert.equal(guards.length, 2);
  assert.match(serviceSource, /sp\.session_service_id = sv\.id/);
  assert.match(serviceSource, /sp\.status = 'active'/);
  assert.doesNotMatch(serviceSource, /Sports Massage — Package Session|sports-massage-monthly-session/);
});

test('crafted ordinary Calendar prepare for package-only service fails before CRM client resolution or booking preparation', async () => {
  const db = scriptedDb(null);
  let crmReads = 0;
  let prepares = 0;
  const service = createCalendarCreateBookingService({
    db,
    crmV2Service: {
      async searchClients() { return []; },
      async createClient() { throw new Error('not expected'); },
      async getClientById() { crmReads += 1; return client(); },
    },
    prepareBooking: async () => { prepares += 1; },
  });

  await assert.rejects(
    service.prepare({ adminId: 2, clientId: 701, staffId: 9, serviceId: 999, date: '2026-09-10', time: '10:00' }),
    (error) => error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION'
  );
  assert.equal(crmReads, 0);
  assert.equal(prepares, 0);
});

test('ordinary active non-package service still reaches the unchanged canonical prepare path', async () => {
  const db = scriptedDb(eligibleRow());
  let crmReads = 0;
  const prepares = [];
  const service = createCalendarCreateBookingService({
    db,
    crmV2Service: {
      async searchClients() { return []; },
      async createClient() { throw new Error('not expected'); },
      async getClientById() { crmReads += 1; return client(); },
    },
    prepareBooking: async (payload) => {
      prepares.push(payload);
      return {
        status: 'pending_confirmation',
        client: payload.crmV2Client,
        staff: { id: 9, display_name: 'Synthetic Practitioner' },
        service: { id: 44, name: 'Deep Tissue Massage', price: '650.00', variable_price: false },
        startsAt: '2026-09-10T08:00:00.000Z',
        endsAt: '2026-09-10T09:00:00.000Z',
      };
    },
  });

  const result = await service.prepare({ adminId: 2, clientId: 701, staffId: 9, serviceId: 44, date: '2026-09-10', time: '10:00' });
  assert.equal(result.status, 'pending_confirmation');
  assert.equal(crmReads, 1);
  assert.equal(prepares.length, 1);
  assert.equal(prepares[0].serviceName, 'Deep Tissue Massage');
});

test('package entitlement trigger remains the fail-closed authority for actual package-session writes', () => {
  assert.match(packageMigration, /Package sessions are not ordinary direct-booking catalogue products/);
  assert.match(packageMigration, /CREATE TRIGGER trg_allocate_package_session/);
  assert.match(packageMigration, /RAISE EXCEPTION 'PACKAGE_ENTITLEMENT_REQUIRED'/);
  assert.match(packageMigration, /RAISE EXCEPTION 'PACKAGE_CREDITS_EXHAUSTED'/);
});
