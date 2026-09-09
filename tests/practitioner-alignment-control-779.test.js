const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const control = require('../src/services/practitionerAlignmentControl779');

test('#779 source practitioner guard accepts own-scope practitioner and rejects broad mutation authority', () => {
  const staff = { id: 7, resource_type: 'practitioner', status: 'active' };
  const access = {
    staff_id: 7,
    active: true,
    role: 'practitioner',
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    service_scope: 'own_services',
    permissions: { 'appointment:view': true },
  };
  assert.doesNotThrow(() => control.assertSourcePractitioner(staff, access));
  assert.throws(
    () => control.assertSourcePractitioner(staff, { ...access, permissions: { 'appointment:view': true, 'staff:manage': true } }),
    /broadened capabilities/
  );
});

test('#779 sanitized projections contain operational authority but no identity/auth material', () => {
  const access = control.sanitizeAccess({
    id: 3,
    staff_id: 9,
    active: true,
    role: 'practitioner',
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    service_scope: 'own_services',
    permissions: { 'appointment:view': true },
    whatsapp_number: '+27820000000',
    normalized_whatsapp: '27820000000',
    totp_secret: 'never-log',
    recovery_codes: 'never-log',
    session_token: 'never-log',
  });
  assert.deepEqual(access.capabilities, ['appointment:view']);
  const serialized = JSON.stringify(access);
  assert.doesNotMatch(serialized, /27820000000|never-log|whatsapp|totp|recovery|session/i);
});

test('#779 control source never writes or copies identity/auth fields and clones only staff service ids', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'practitionerAlignmentControl779.js'), 'utf8');
  const adminUpdate = source.match(/UPDATE staff_admin_accounts[\s\S]*?WHERE id=\$1`/i)?.[0] || '';
  assert.match(adminUpdate, /staff_id=\$2/);
  assert.match(adminUpdate, /permissions=\$4::jsonb/);
  assert.doesNotMatch(adminUpdate, /whatsapp|totp|recovery|session|password|credential/i);
  assert.match(source, /INSERT INTO staff_services\(staff_id,service_id\)/i);
  assert.match(source, /DELETE FROM staff_services target/i);
  assert.doesNotMatch(source, /INSERT INTO staff_auth|UPDATE staff_auth|DELETE FROM staff_auth/i);
});

test('#779 exact service comparison is order-independent', () => {
  assert.equal(control.sameServiceIds([{ service_id: 2 }, { service_id: 1 }], [{ service_id: 1 }, { service_id: 2 }]), true);
  assert.equal(control.sameServiceIds([{ service_id: 1 }], [{ service_id: 2 }]), false);
});
