const test = require('node:test');
const assert = require('node:assert/strict');

const { scheduleMenu, canControlChristelBusiness } = require('../src/services/adminScheduleUx');
const { pricingOwner, isJeanPierreBusinessAdmin } = require('../src/services/adminServicePricing');
const { certificationStaffIds, authorityDescription } = require('../src/services/attendanceFinalizationAuthority');
const { appointmentsInteractive } = require('../src/services/adminAppointmentsMenu');
const { enrichPrivilegedReportsMenu } = require('../src/services/adminInteractiveMenu');

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

test('Jean-Pierre business admin receives Christel business schedule controls without practitioner self controls', () => {
  assert.equal(canControlChristelBusiness(jeanPierre), true);
  const menu = scheduleMenu(jeanPierre);
  const ids = menu.rows.map((row) => row.id);
  assert.ok(ids.includes('schedule_leave_requests'));
  assert.ok(ids.includes('schedule_holiday_hours'));
  assert.ok(!ids.includes('schedule_my_time_off'));
});

test('Jean-Pierre business admin controls the shared Christel and Abigail pricing catalogue', () => {
  assert.equal(isJeanPierreBusinessAdmin(jeanPierre), true);
  assert.equal(pricingOwner(jeanPierre), 'christel');
});

test('JP appointment menu matches Christel operational actions except finalization', () => {
  const jpIds = appointmentsInteractive(jeanPierre).rows.map((row) => row.id);
  const christelIds = appointmentsInteractive(christel).rows.map((row) => row.id);
  assert.ok(christelIds.includes('admin_appointment_finalize'));
  assert.ok(!jpIds.includes('admin_appointment_finalize'));
  assert.deepEqual(jpIds, christelIds.filter((id) => id !== 'admin_appointment_finalize'));
});

test('all three practitioner Admin menus expose own finalization while JP remains excluded', () => {
  for (const admin of [christel, abigail, marietjie]) {
    assert.ok(appointmentsInteractive(admin).rows.some((row) => row.id === 'admin_appointment_finalize'));
  }
  assert.ok(!appointmentsInteractive(jeanPierre).rows.some((row) => row.id === 'admin_appointment_finalize'));

  const base = (admin) => ({ handled: true, admin, interactive: { body: '*Shiloh Admin 🌿*\n\n*Appointments*\n1️⃣ Make a booking' } });
  assert.doesNotMatch(enrichPrivilegedReportsMenu(base(jeanPierre)).interactive.body, /Finalize past visits/);
  assert.match(enrichPrivilegedReportsMenu(base(abigail)).interactive.body, /Finalize past visits/);
});

test('Jean-Pierre business admin parity does not grant attendance certification authority', async () => {
  const neverQuery = { query: async () => { throw new Error('JP attendance authority must fail closed before querying staff'); } };
  assert.deepEqual(await certificationStaffIds(jeanPierre, neverQuery), []);
  assert.equal(authorityDescription(jeanPierre), 'review only');
});
