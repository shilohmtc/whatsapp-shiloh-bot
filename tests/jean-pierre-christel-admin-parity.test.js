const test = require('node:test');
const assert = require('node:assert/strict');

const { scheduleMenu, canControlChristelBusiness } = require('../src/services/adminScheduleUx');
const { pricingOwner, isJeanPierreBusinessAdmin } = require('../src/services/adminServicePricing');
const { certificationStaffIds, authorityDescription } = require('../src/services/attendanceFinalizationAuthority');
const { getMenuOptions } = require('../src/services/adminMobileMenu');

const jeanPierre = {
  id: 9001,
  staff_id: null,
  display_name: 'Jean-Pierre',
  role: 'admin',
  business_role: 'business_admin',
  calendar_scope: 'all_business',
  service_scope: 'all_services',
  permissions: {
    'appointment:view': true,
    'appointment:create': true,
    'booking:update': true,
    'client:lookup': true,
    'staff:services:view': true,
    'service:pricing': true,
    'schedule:manage': true,
  },
};

const christel = { ...jeanPierre, id: 9002, staff_id: 3, display_name: 'Christel' };
const abigail = { ...jeanPierre, id: 9003, staff_id: 4, display_name: 'Abigail', business_role: 'employee_practitioner', calendar_scope: 'own_appointments', service_scope: 'own_services' };
const marietjie = { ...jeanPierre, id: 9004, staff_id: 5, display_name: 'Marietjie', business_role: 'tenant_practitioner', calendar_scope: 'own_services', service_scope: 'own_services' };

test('Jean-Pierre business admin receives Christel business schedule controls outside ordinary WhatsApp Admin', () => {
  assert.equal(canControlChristelBusiness(jeanPierre), true);
  const menu = scheduleMenu(jeanPierre);
  const ids = menu.rows.map((row) => row.id);
  assert.ok(ids.includes('schedule_leave_requests'));
  assert.ok(ids.includes('schedule_holiday_hours'));
  assert.ok(!ids.includes('schedule_my_time_off'));
});

test('Jean-Pierre business admin still maps to shared Christel and Abigail pricing authority outside ordinary WhatsApp Admin', () => {
  assert.equal(isJeanPierreBusinessAdmin(jeanPierre), true);
  assert.equal(pricingOwner(jeanPierre), 'christel');
});

test('all ordinary staff Admin menus are reduced to the same four quick views', () => {
  for (const admin of [jeanPierre, christel, abigail, marietjie]) {
    const keys = getMenuOptions(admin).map((option) => option.key);
    assert.deepEqual(keys, ['today', 'tomorrow', 'reports', 'earnings']);
    for (const removed of ['open_calendar', 'help', 'client', 'walkin', 'staff_services', 'pricing', 'finalize', 'block_time', 'schedule']) {
      assert.equal(keys.includes(removed), false, `${admin.display_name}: ${removed}`);
    }
  }
});

test('Jean-Pierre business admin parity does not grant attendance certification authority', async () => {
  const neverQuery = { query: async () => { throw new Error('JP attendance authority must fail closed before querying staff'); } };
  assert.deepEqual(await certificationStaffIds(jeanPierre, neverQuery), []);
  assert.equal(authorityDescription(jeanPierre), 'review only');
});
