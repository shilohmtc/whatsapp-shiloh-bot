const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  evaluateCalendarAuthority,
  allowsAppointmentTarget,
  serviceVisibilityAllows,
} = require('../src/services/calendarAuthorization');

const migrationPath = path.join(
  __dirname,
  '..',
  'migrations',
  '116_calendar_appointment_edit_business_wide_scope.sql'
);

const REQUIRED_EDIT_CAPABILITIES = Object.freeze({
  'appointment:view': true,
  'calendar:booking:reschedule': true,
  'calendar:booking:cancel': true,
  'calendar:booking:reassign': true,
  'appointment:adjust_end': true,
});

test('#903 alignment is scope-only and preserves unrelated persisted authority', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /WHERE a\.id=1/);
  assert.match(sql, /calendar_scope='all_business'/);
  assert.match(sql, /service_scope='all_services'/);
  assert.doesNotMatch(sql, /SET\s+permissions\s*=/i);
  assert.doesNotMatch(sql, /SET\s+role\s*=/i);
  assert.doesNotMatch(sql, /SET\s+business_role\s*=/i);
  assert.doesNotMatch(sql, /INSERT\s+INTO\s+staff_admin_accounts/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+staff_admin_accounts/i);
});

test('#903 tenant practitioner all-business edit scope reaches ordinary cross-business appointments', () => {
  const authority = evaluateCalendarAuthority({
    id: 1,
    staff_id: 101,
    admin_active: true,
    staff_status: 'active',
    business_role: 'tenant_practitioner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: REQUIRED_EDIT_CAPABILITIES,
  });

  assert.ok(authority);
  assert.equal(authority.calendarScope, 'all_business');
  assert.equal(authority.serviceScope, 'all_services');
  assert.equal(allowsAppointmentTarget(authority, {
    staffIds: [202],
    serviceIds: [303],
  }), true);
});

test('#903 scope alignment does not bypass private tenant service ownership', () => {
  const authority = evaluateCalendarAuthority({
    id: 1,
    staff_id: 101,
    admin_active: true,
    staff_status: 'active',
    business_role: 'tenant_practitioner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: REQUIRED_EDIT_CAPABILITIES,
  });

  assert.ok(authority);
  assert.equal(serviceVisibilityAllows(authority, 101), true);
  assert.equal(serviceVisibilityAllows(authority, 202), false);
});
