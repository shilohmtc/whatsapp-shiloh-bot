const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  adminBookingEntitlement,
  canPresentAdminBooking,
  isJeanPierreBookingException,
} = require('../src/services/adminBookingEntitlement');
const { appointmentsInteractive } = require('../src/services/adminAppointmentsMenu');

const bookingPermissions = { 'appointment:view': true, 'appointment:create': true, 'booking:update': true };
const jp = {
  display_name: 'Jean-Pierre',
  staff_id: null,
  business_role: 'business_admin',
  calendar_scope: 'all_business',
  service_scope: 'all_services',
  permissions: bookingPermissions,
};

test('JP explicit business exception presents booking and grants only Christel + Abigail scope', () => {
  assert.equal(isJeanPierreBookingException(jp), true);
  assert.deepEqual(adminBookingEntitlement(jp), {
    key: 'christel_abigail',
    staffNames: ['christel', 'abigail'],
    staffIds: null,
    label: 'Christel & Abigail services',
  });
  assert.equal(canPresentAdminBooking(jp), true);
  assert.ok(appointmentsInteractive(jp).rows.some((row) => row.id === 'admin_appointment_booking'));
  assert.ok(!appointmentsInteractive(jp).rows.some((row) => row.id === 'admin_appointment_finalize'));
});

test('unlinked Admins without the complete named exception stay fail-closed and see no booking action', () => {
  for (const admin of [
    { ...jp, display_name: 'Another Admin' },
    { ...jp, business_role: 'admin' },
    { ...jp, calendar_scope: 'own' },
    { ...jp, service_scope: 'own_services' },
  ]) {
    assert.equal(adminBookingEntitlement(admin).key, 'no_practitioner_scope');
    assert.equal(canPresentAdminBooking(admin), false);
    assert.ok(!appointmentsInteractive(admin).rows.some((row) => row.id === 'admin_appointment_booking'));
  }
});

test('existing named and linked-practitioner scopes remain unchanged', () => {
  assert.deepEqual(adminBookingEntitlement({ display_name: 'Christel' }).staffNames, ['christel', 'abigail']);
  assert.deepEqual(adminBookingEntitlement({ display_name: 'Abigail' }).staffNames, ['christel', 'abigail']);
  assert.deepEqual(adminBookingEntitlement({ display_name: 'Marietjie' }).staffNames, ['marietjie']);
  assert.deepEqual(adminBookingEntitlement({ display_name: 'Linked Admin', staff_id: 42 }).staffIds, [42]);
});

test('database enforcement mirrors the narrow JP exception and never grants clinic-wide scope', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'src/db/migrations/063_jean_pierre_booking_entitlement.sql'), 'utf8');
  assert.match(sql, /admin_name = 'jean-pierre'/);
  assert.match(sql, /admin_business_role = 'business_admin'/);
  assert.match(sql, /admin_calendar_scope = 'all_business'/);
  assert.match(sql, /admin_service_scope = 'all_services'/);
  assert.match(sql, /allowed := target_staff_name IN \('christel', 'abigail'\)/);
  assert.match(sql, /ELSIF linked_staff_id IS NOT NULL[\s\S]*allowed := linked_staff_id = NEW\.staff_id/);
  assert.match(sql, /ELSE\s+allowed := false/);
  assert.doesNotMatch(sql, /allowed := true/);
});

test('catalogue and practitioner queries consume the same canonical entitlement', () => {
  const flow = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminMobileBookingFlow.js'), 'utf8');
  const menu = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminAppointmentsMenu.js'), 'utf8');
  assert.match(flow, /const bookingScope = adminBookingEntitlement/);
  assert.match(flow, /async function scopedActiveServiceRows\(admin\)[\s\S]*const scope = bookingScope\(admin\)/);
  assert.match(flow, /async function staffRowsForService\(serviceId, admin\)[\s\S]*const scope = bookingScope\(admin\)/);
  assert.match(menu, /canPresentAdminBooking\(admin\)/);
});
