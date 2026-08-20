const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration065 = fs.readFileSync(path.join(root, 'migrations', '065_juvan_botha_jp_booking_approval.sql'), 'utf8');
const migration066 = fs.readFileSync(path.join(root, 'migrations', '066_controlled_juvan_demo_identity.sql'), 'utf8');
const migration067 = fs.readFileSync(path.join(root, 'migrations', '067_controlled_juvan_registration_rebind.sql'), 'utf8');
const approval = fs.readFileSync(path.join(root, 'src', 'services', 'clientBookingApproval.js'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'src', 'services', 'clientBookingApprovalSchema.js'), 'utf8');
const controlled = fs.readFileSync(path.join(root, 'src', 'services', 'controlledDemoIdentity.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'src', 'services', 'juvanBookingApprovalPolicy.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('controlled demo identity is bootstrapped from the persisted canonical Juvan policy, not rediscovered by name', () => {
  assert.match(migration065, /'juvan_botha_jp_booking_approval', target_client_id, jp_admin_id/);
  assert.match(migration066, /FROM client_booking_approval_policies p/);
  assert.match(migration066, /p\.policy_key = 'juvan_botha_jp_booking_approval'/);
  assert.match(migration066, /MIN\(p\.client_id\)/);
  assert.match(migration066, /CREATE TABLE IF NOT EXISTS controlled_demo_identities/);
  assert.match(migration066, /normalized_phone TEXT NOT NULL UNIQUE/);
  assert.match(migration066, /current_client_id BIGINT REFERENCES clients\(id\)/);
  assert.match(migration066, /COUNT\(DISTINCT regexp_replace/);
  assert.match(migration066, /phone_count <> 1/);
  assert.match(migration066, /shared_active_contact_count <> 0/);
  assert.doesNotMatch(migration066, /WHERE\s+LOWER\(TRIM\(c\.display_name\)\)\s*=\s*'juvan botha'/i);
});

test('Juvan approval pointer is nullable while the controlled identity is intentionally unbound', () => {
  assert.match(migration066, /ALTER COLUMN client_id DROP NOT NULL/);
  assert.match(schema, /client_id BIGINT UNIQUE REFERENCES clients\(id\)/);
  assert.match(schema, /ALTER TABLE client_booking_approval_policies ALTER COLUMN client_id DROP NOT NULL/);
  assert.match(controlled, /status: 'unbound'/);
  assert.match(bootstrap, /\['bound', 'unbound'\]/);
  assert.match(bootstrap, /row\.current_client_id == null && row\.policy_client_id == null/);
});

test('fresh controlled-phone attachment rebinds only through normal WhatsApp onboarding and in one database transaction', () => {
  assert.match(migration067, /BEFORE INSERT OR UPDATE OF client_id, contact_type, normalized_value, value/);
  assert.match(migration067, /target_client_source IS DISTINCT FROM 'whatsapp_onboarding'/);
  assert.match(migration067, /other_binding_count <> 0/);
  assert.match(migration067, /current_client_id IS NOT NULL[\s\S]*NEW\.client_id/);
  assert.match(migration067, /UPDATE controlled_demo_identities[\s\S]*current_client_id = NEW\.client_id/);
  assert.match(migration067, /UPDATE client_booking_approval_policies[\s\S]*client_id = NEW\.client_id/);
  assert.match(migration067, /controlled_demo_identity\.rebound/);
  assert.match(migration067, /approval policy could not be rebound atomically/);
});

test('read-only downstream resolver returns only the current phone-anchored controlled client', () => {
  assert.match(controlled, /demo_key=\$1/);
  assert.match(controlled, /current_client_id/);
  assert.match(controlled, /phones\.length !== 1 \|\| phones\[0\] !== demo\.normalized_phone/);
  assert.match(controlled, /client_booking_approval_policies/);
  assert.match(controlled, /policy_drift/);
  assert.doesNotMatch(controlled, /LOWER\(TRIM\(display_name\)\)/i);
  assert.doesNotMatch(controlled, /INSERT INTO clients|UPDATE clients SET|DELETE FROM clients/);
});

test('database booking hold follows controlled current_client_id while preserving current JP-sole-approver behavior', () => {
  for (const source of [migration066, schema]) {
    assert.match(source, /FROM controlled_demo_identities d/);
    assert.match(source, /controlled_client_id IS NOT NULL AND booking_client_id = controlled_client_id/);
    assert.match(source, /policy_client_id IS DISTINCT FROM controlled_client_id/);
    assert.match(source, /exact demo phone is not attached to the current canonical client/);
    assert.match(source, /required_approver_id := NULL/);
    assert.match(source, /required_approver_admin_id := targeted_policy_admin_id/);
    assert.doesNotMatch(source, /ELSIF LOWER\(TRIM\(COALESCE\(booking_client_name, ''\)\)\) = 'juvan botha'/);
  }
});

test('Jean-Pierre authority remains exact and no practitioner identity is manufactured', () => {
  for (const source of [migration066, schema, bootstrap]) {
    assert.match(source, /Jean-Pierre|jean-pierre/i);
    assert.match(source, /business_admin/);
    assert.match(source, /all_business/);
    assert.match(source, /all_services/);
    assert.match(source, /normalized_whatsapp/);
  }
  assert.match(approval, /approverStaffId: null/);
});

test('existing Dummy Test historical approval branch and ordinary practitioner behavior remain present', () => {
  assert.match(approval, /resolveDummyTestApprovalPolicy/);
  assert.match(schema, /dummy test/i);
  assert.match(schema, /observer_id/);
  assert.match(schema, /LOWER\(COALESCE\(NEW\.staff_name_snapshot, ''\)\) = 'abigail'/);
  assert.match(approval, /resolveObserverStaffId/);
  assert.match(approval, /const approverStaffId = specialPolicy \? null : Number\(staffId\)/);
});

test('startup applies the prior policy then controlled identity and registration-rebind migrations before listening', () => {
  assert.match(bootstrap, /065_juvan_botha_jp_booking_approval\.sql/);
  assert.match(bootstrap, /066_controlled_juvan_demo_identity\.sql/);
  assert.match(bootstrap, /067_controlled_juvan_registration_rebind\.sql/);
  assert.match(bootstrap, /resolveCurrentControlledDemoClient/);
  assert.match(bootstrap, /bindingState: state\.status/);
  const verifyCall = app.indexOf('await ensureJuvanBookingApprovalPolicy()');
  const listenCall = app.indexOf('server = app.listen');
  assert.ok(verifyCall >= 0, 'startup must verify controlled Juvan identity');
  assert.ok(listenCall > verifyCall, 'verification must complete before the HTTP listener opens');
});
