const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration065 = fs.readFileSync(path.join(root, 'migrations', '065_juvan_botha_jp_booking_approval.sql'), 'utf8');
const migration066 = fs.readFileSync(path.join(root, 'migrations', '066_controlled_juvan_demo_identity.sql'), 'utf8');
const migration067 = fs.readFileSync(path.join(root, 'migrations', '067_controlled_juvan_registration_rebind.sql'), 'utf8');
const migration068 = fs.readFileSync(path.join(root, 'migrations', '068_juvan_primary_backup_booking_approval.sql'), 'utf8');
const migration095 = fs.readFileSync(path.join(root, 'migrations', '095_retire_juvan_primary_backup_booking_approval.sql'), 'utf8');
const approval = fs.readFileSync(path.join(root, 'src', 'services', 'clientBookingApproval.js'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'src', 'services', 'clientBookingApprovalSchema.js'), 'utf8');
const controlled = fs.readFileSync(path.join(root, 'src', 'services', 'controlledDemoIdentity.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'src', 'services', 'juvanBookingApprovalPolicy.js'), 'utf8');
const menu = fs.readFileSync(path.join(root, 'src', 'services', 'adminInteractiveMenu.js'), 'utf8');
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

test('migration 068 remains immutable historical Primary Backup authority', () => {
  assert.match(migration068, /approval_mode TEXT NOT NULL DEFAULT 'standard'/);
  assert.match(migration068, /backup_notified_at TIMESTAMPTZ/);
  assert.match(migration068, /controlled_juvan_primary_backup/);
  assert.match(migration068, /a\.client_id = controlled_client_id[\s\S]*aba\.status = 'pending'/);
  assert.match(migration068, /required_approver_id := NEW\.staff_id/);
  assert.match(migration068, /required_approver_admin_id := targeted_policy_admin_id/);
  assert.match(migration068, /required_approval_mode := 'controlled_juvan_primary_backup'/);
  assert.doesNotMatch(migration068, /ELSIF LOWER\(TRIM\(COALESCE\(booking_client_name, ''\)\)\) = 'juvan botha'/);
  assert.doesNotMatch(migration068, /UPDATE appointment_booking_approvals[\s\S]*status IN \('approved','declined'\)/);
});

test('future booking holds retire the Juvan special case and keep normal practitioner authority', () => {
  for (const source of [migration095, schema]) {
    assert.match(source, /CREATE OR REPLACE FUNCTION create_client_booking_approval_hold\(\)/);
    assert.match(source, /required_approver_id := NEW\.staff_id/);
    assert.match(source, /required_approver_admin_id := NULL/);
    assert.match(source, /required_approval_mode := 'standard'/);
    assert.match(source, /dummy test/i);
    assert.match(source, /LOWER\(COALESCE\(NEW\.staff_name_snapshot, ''\)\) = 'abigail'/);
    assert.doesNotMatch(source, /controlled_client_id IS NOT NULL AND booking_client_id = controlled_client_id/);
    assert.doesNotMatch(source, /required_approver_admin_id := targeted_policy_admin_id/);
    assert.doesNotMatch(source, /required_approval_mode := 'controlled_juvan_primary_backup'/);
  }
  assert.doesNotMatch(migration095, /UPDATE appointment_booking_approvals/);
});

test('new approval policy selection excludes Juvan while preserving the historical resolver', () => {
  assert.match(approval, /async function resolveClientApprovalPolicy\(db, appointmentId\) \{\s*return resolveDummyTestApprovalPolicy\(db, appointmentId\);\s*\}/);
  assert.match(approval, /async function resolveJuvanApprovalPolicy\(db, appointmentId\)/);
  assert.match(approval, /if \(context\.approval_mode === CONTROLLED_JUVAN_MODE\) return requestControlledJuvanApproval\(context\)/);
  assert.match(approval, /if \(locked\.approval_mode === CONTROLLED_JUVAN_MODE\)/);
});

test('historical Juvan resolver consumes current phone-anchored identity instead of a historical client id or display-name shortcut', () => {
  assert.match(approval, /resolveCurrentControlledDemoClient\(db\)/);
  assert.match(approval, /Number\(row\.client_id\) !== currentId/);
  assert.match(approval, /approverStaffId: Number\(primary\.staff_id\)/);
  assert.match(approval, /approverAdminId: Number\(backup\.id\)/);
  assert.doesNotMatch(approval, /active_juvan_count/);
  assert.doesNotMatch(approval, /client_id\s*=\s*845|clientId\s*:\s*845/);
  assert.doesNotMatch(approval, /LOWER\(TRIM\([^)]*display_name[^)]*\)\)\s*=\s*.*juvan botha/i);
});

test('historical controlled approval delivery identifies Primary Backup role and tracks each delivery independently', () => {
  assert.match(approval, /backup_notified_at/);
  assert.match(approval, /Your role: \$\{role\}/);
  assert.match(approval, /'Primary'/);
  assert.match(approval, /'Backup'/);
  assert.match(approval, /primaryApprover: validation\.primary\.display_name/);
  assert.match(approval, /backupApprover: validation\.backup\.display_name/);
  assert.match(approval, /WHERE appointment_id=\$1 AND status='pending' AND approval_mode=\$2/);
});

test('historical controlled decisions revalidate current identity and appointment truth under locks', () => {
  assert.match(approval, /getControlledDemoIdentity\(db, true\)/);
  assert.match(approval, /FOR UPDATE OF aba,a/);
  assert.match(approval, /resolveCurrentControlledDemoClient\(db\)/);
  assert.match(approval, /Number\(primary\.staff_id\) !== Number\(row\.approver_staff_id\)/);
  assert.match(approval, /Number\(backup\.id\) !== Number\(row\.approver_admin_id\)/);
  assert.match(approval, /WHERE appointment_id=\$1 AND status='pending' RETURNING appointment_id/);
  assert.match(approval, /first_decision:\$\{controlledValidation\.role\.toLowerCase\(\)\}/);
  assert.match(approval, /No second decision was recorded/);
  assert.match(approval, /already been \$\{locked\.status\} by \$\{winner\}/);
});

test('approval and decline preserve idempotent client confirmation without external mirror mutation', () => {
  assert.match(approval, /sendCustomerBookingConfirmationForAppointment\(locked\.appointment_id\)/);
  assert.doesNotMatch(approval, /cancelBookingEvent|cancelPractitionerBookingEvent|appointment_calendar_events/);
  assert.match(approval, /appointment_status_history/);
  assert.match(approval, /client\.booking_approval\.approved/);
  assert.match(approval, /client\.booking_approval\.declined/);
});

test('Reset Juvan remains internal and is absent from ordinary staff routing', () => {
  assert.doesNotMatch(menu, /Reset Juvan|processAdminTestClientResetMessage|reset_juvan/);
  assert.match(menu, /processAdminRetiredAuthorityMessage/);
});

test('Dummy Test compatibility and ordinary practitioner observer behavior remain present', () => {
  assert.match(approval, /resolveDummyTestApprovalPolicy/);
  assert.match(schema, /dummy test/i);
  assert.match(schema, /observer_id/);
  assert.match(schema, /LOWER\(COALESCE\(NEW\.staff_name_snapshot, ''\)\) = 'abigail'/);
  assert.match(approval, /resolveObserverStaffId/);
  assert.match(approval, /return resolveDummyTestApprovalPolicy\(db, appointmentId\)/);
});

test('Juvan compatibility path verifies historical migrations without becoming startup authority', () => {
  assert.match(bootstrap, /065_juvan_botha_jp_booking_approval\.sql/);
  assert.match(bootstrap, /066_controlled_juvan_demo_identity\.sql/);
  assert.match(bootstrap, /067_controlled_juvan_registration_rebind\.sql/);
  assert.match(bootstrap, /068_juvan_primary_backup_booking_approval\.sql/);
  assert.match(bootstrap, /resolveCurrentControlledDemoClient/);
  assert.match(bootstrap, /approvalContract: 'assigned_practitioner_primary_jean_pierre_backup_first_decision_wins'/);
  assert.match(bootstrap, /verifyMigrationFiles\(\[/);
  assert.doesNotMatch(bootstrap, /applyMigrationFile/);
  const verifyCall = app.indexOf('await verifyMigrationState()');
  const listenCall = app.indexOf('server = app.listen');
  assert.ok(verifyCall >= 0 && listenCall > verifyCall, 'global migration verification must complete before the HTTP listener opens');
  assert.doesNotMatch(app, /ensureJuvanBookingApprovalPolicy/);
});
