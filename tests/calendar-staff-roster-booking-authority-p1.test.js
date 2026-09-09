const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const {
  CALENDAR_CAPABILITIES,
  CALENDAR_OPERATIONS,
  evaluateCalendarAuthority,
  operationsForAuthority,
  allowsBookingTarget,
  allowsAppointmentTarget,
  allowsStaffTarget,
} = require('../src/services/calendarAuthorization');

const create = {
  'appointment:view': true,
  'appointment:create': true,
  'client:lookup': true,
};
const appointments = {
  'calendar:booking:reschedule': true,
  'calendar:booking:cancel': true,
  'calendar:booking:reassign': true,
};

function principal(overrides = {}) {
  return {
    id: 100,
    staff_id: null,
    display_name: 'Data-assigned operator',
    business_role: 'booking_operator',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { ...create, ...appointments },
    admin_active: true,
    staff_status: null,
    ...overrides,
  };
}

test('stable vocabulary and evaluator derive authority only from canonical data fields', () => {
  assert.deepEqual(CALENDAR_CAPABILITIES, {
    VIEW: 'appointment:view',
    BOOKING_CREATE: 'appointment:create',
    RECORD_PAST: 'appointment:record_past',
    ADJUST_END: 'appointment:adjust_end',
    CLIENT_LOOKUP: 'client:lookup',
    BOOKING_RESCHEDULE: 'calendar:booking:reschedule',
    BOOKING_CANCEL: 'calendar:booking:cancel',
    BOOKING_REASSIGN: 'calendar:booking:reassign',
    SCHEDULE_MANAGE: 'schedule:manage',
  });
  const first = evaluateCalendarAuthority(principal());
  const renamed = evaluateCalendarAuthority(principal({ display_name: 'Entirely different operator' }));
  assert.deepEqual(renamed, first);
  const roleChanged = evaluateCalendarAuthority(principal({ business_role: 'receptionist' }));
  assert.equal(roleChanged.businessRole, 'receptionist');
  assert.notDeepEqual(roleChanged, first);
  assert.deepEqual(operationsForAuthority(first), ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign']);
  assert.deepEqual(CALENDAR_OPERATIONS.slice(3), ['calendar_block:manage', 'operational_leave:manage', 'working_schedule:manage']);
});

test('unknown, inactive, unlinked scoped and incompatible-scope principals fail closed', () => {
  assert.equal(evaluateCalendarAuthority({}), null);
  assert.equal(evaluateCalendarAuthority(principal({ admin_active: false })), null);
  assert.equal(evaluateCalendarAuthority(principal({ id: null })), null);
  assert.equal(evaluateCalendarAuthority(principal({ calendar_scope: 'none' })), null);
  assert.equal(evaluateCalendarAuthority(principal({ calendar_scope: 'own_services', service_scope: 'own_services' })), null);
  assert.equal(evaluateCalendarAuthority(principal({ staff_id: 8, staff_status: 'inactive', service_scope: 'own_services' }), { allowedServiceIds: [50] }), null);
  assert.equal(evaluateCalendarAuthority(principal({ staff_id: 8, staff_status: 'active', calendar_scope: 'own_services', service_scope: 'all_services' })), null);
});

test('all-business booking operator can book internal practitioners but receives no schedule powers', () => {
  const authority = evaluateCalendarAuthority(principal());
  for (const staffId of [201, 202, 203]) assert.equal(allowsBookingTarget(authority, { staffId, serviceId: 50 }), true);
  assert.equal(allowsAppointmentTarget(authority, { staffIds: [201], serviceIds: [50] }), true);
  assert.equal(allowsStaffTarget(authority, 201), true);
  assert.deepEqual(operationsForAuthority(authority), ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign']);
});

test('own-services operator is bounded by canonical service mappings and staff-only operations stay own-staff', () => {
  const authority = evaluateCalendarAuthority(principal({ staff_id: 8, staff_status: 'active', calendar_scope: 'own_services', service_scope: 'own_services' }), { allowedServiceIds: [50] });
  assert.ok(authority);
  assert.equal(allowsBookingTarget(authority, { staffId: 201, serviceId: 50 }), true);
  assert.equal(allowsBookingTarget(authority, { staffId: 201, serviceId: 51 }), false);
  assert.equal(allowsAppointmentTarget(authority, { staffIds: [201], serviceIds: [50] }), true);
  assert.equal(allowsAppointmentTarget(authority, { staffIds: [201], serviceIds: [51] }), false);
  assert.equal(allowsStaffTarget(authority, 8), true);
  assert.equal(allowsStaffTarget(authority, 9), false);
});

test('affected Calendar application paths contain no person-name or phone authorization policy', () => {
  const combined = [
    'src/services/calendarAuthorization.js',
    'src/services/calendarCreateBooking.js',
    'src/services/calendarOperationalMutations.js',
    'src/routes/calendarCreateBooking.js',
    'src/routes/calendarOperationalMutations.js',
  ].map(read).join('\n');
  assert.doesNotMatch(combined, /Marietjie|Christel|Jean-Pierre|Naomi|JP|\+27\d+/i);
});

test('internal Calendar and client self-service bookability remain explicitly separated', () => {
  const source = read('src/services/calendarCreateBooking.js');
  assert.doesNotMatch(source, /client_bookable\s*=\s*TRUE/i);
  assert.match(read('src/services/availability.js'), /client_bookable\s*=\s*TRUE/i);
});

test('migration assigns least privilege, reconciles roster and never embeds private mobiles', () => {
  const sql = read('migrations/081_calendar_staff_roster_capabilities.sql');
  assert.match(sql, /appointment:create/);
  assert.match(sql, /calendar:booking:reschedule/);
  assert.match(sql, /calendar:booking:cancel/);
  assert.match(sql, /calendar:booking:reassign/);
  assert.match(sql, /schedule:manage/);
  assert.doesNotMatch(sql, /\+27\d+/);
});

test('ILince standard approval path needs only one active linked contact principal, not editor capability', () => {
  const sql = read('migrations/081_calendar_staff_roster_capabilities.sql');
  assert.match(sql, /ILince|Ilince/i);
  assert.doesNotMatch(sql, /ILince[\s\S]{0,800}appointment:create/i);
});

test('migration leaves clinic envelope, appointments, CRM V2, providers and existing catalogue values untouched', () => {
  const sql = read('migrations/081_calendar_staff_roster_capabilities.sql');
  assert.doesNotMatch(sql, /UPDATE\s+appointments|DELETE\s+FROM\s+appointments/i);
  assert.doesNotMatch(sql, /crm_v2|whatsapp|meta|clinic_hours|holiday/i);
});

test('migration runner applies the roster unit atomically and rolls the entire file back on failure', () => {
  const runner = read('scripts/migrate.js');
  assert.match(runner, /BEGIN/);
  assert.match(runner, /ROLLBACK/);
  assert.match(runner, /COMMIT/);
});
