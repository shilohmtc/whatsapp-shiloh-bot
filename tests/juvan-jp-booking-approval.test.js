const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'migrations', '065_juvan_botha_jp_booking_approval.sql'), 'utf8');
const approval = fs.readFileSync(path.join(root, 'src', 'services', 'clientBookingApproval.js'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'src', 'services', 'clientBookingApprovalSchema.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'src', 'services', 'juvanBookingApprovalPolicy.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('Juvan policy migration resolves exactly one active canonical client before persisting an ID-keyed rule', () => {
  assert.match(migration, /LOWER\(TRIM\(display_name\)\) = 'juvan botha'/i);
  assert.match(migration, /target_count <> 1/);
  assert.match(migration, /target_client_id BIGINT/);
  assert.match(migration, /client_booking_approval_policies/);
  assert.match(migration, /'juvan_botha_jp_booking_approval', target_client_id, jp_admin_id/);
  assert.match(migration, /client_id BIGINT NOT NULL UNIQUE REFERENCES clients\(id\)/);
  assert.doesNotMatch(migration, /LIKE\s+['"][^'"]*juvan/i);
});

test('canonical Juvan resolution requires a non-shared WhatsApp or mobile identity', () => {
  assert.match(migration, /contact_type IN \('whatsapp', 'mobile'\)/);
  assert.match(migration, /target_contact_count < 1/);
  assert.match(migration, /other\.status = 'active'/);
  assert.match(migration, /other\.id <> target_client_id/);
  assert.match(migration, /shared_active_contact_count <> 0/);
  assert.match(bootstrap, /canonical_contact_count/);
  assert.match(bootstrap, /shared_active_contact_count/);
  assert.match(bootstrap, /Number\(row\.shared_active_contact_count\) === 0/);
});

test('Juvan policy targets the exact guarded Jean-Pierre admin account without inventing staff identity', () => {
  for (const source of [migration, approval, bootstrap]) {
    assert.match(source, /Jean-Pierre|jean-pierre/i);
    assert.match(source, /business_admin/);
    assert.match(source, /all_business/);
    assert.match(source, /all_services/);
    assert.match(source, /normalized_whatsapp/);
  }
  assert.match(migration, /approver_admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts\(id\)/);
  assert.match(approval, /saa\.id=\$1/);
  assert.match(approval, /approverStaffId: null/);
});

test('database hold trigger routes by persisted canonical client id and fails closed on Juvan drift', () => {
  assert.match(migration, /p\.client_id = booking_client_id/);
  assert.match(schema, /p\.client_id = booking_client_id/);
  assert.match(migration, /persisted canonical client identity drifted/);
  assert.match(migration, /canonical CRM identity is no longer unique/);
  assert.match(migration, /canonical client policy is missing/);
  assert.match(schema, /canonical client policy is missing/);
  assert.match(migration, /required_approver_id := NULL/);
  assert.match(migration, /required_approver_admin_id := targeted_policy_admin_id/);
});

test('application layer independently revalidates the Juvan ID policy before pending approval upsert', () => {
  assert.match(approval, /resolveJuvanApprovalPolicy/);
  assert.match(approval, /p\.policy_key=\$2/);
  assert.match(approval, /p\.client_id=a\.client_id/);
  assert.match(approval, /active_juvan_count/);
  assert.match(approval, /canonical_contact_count/);
  assert.match(approval, /shared_active_contact_count/);
  assert.match(approval, /canonical client policy is missing/);
  assert.match(approval, /const specialPolicy = await resolveClientApprovalPolicy/);
  assert.match(approval, /const approverAdminId = specialPolicy\?\.approverAdminId \|\| null/);
});

test('existing Dummy Test and ordinary practitioner approval behavior remains present', () => {
  assert.match(approval, /resolveDummyTestApprovalPolicy/);
  assert.match(approval, /Dummy Test approval blocked/);
  assert.match(schema, /dummy test/i);
  assert.match(schema, /observer_id/);
  assert.match(schema, /LOWER\(COALESCE\(NEW\.staff_name_snapshot, ''\)\) = 'abigail'/);
  assert.match(approval, /resolveObserverStaffId/);
  assert.match(approval, /const approverStaffId = specialPolicy \? null : Number\(staffId\)/);
});

test('startup applies and verifies migration 065 before opening the HTTP listener', () => {
  assert.match(bootstrap, /applyMigrationFile\(MIGRATION\)/);
  assert.match(bootstrap, /065_juvan_botha_jp_booking_approval\.sql/);
  assert.match(bootstrap, /activeNameCount/);
  assert.match(bootstrap, /clientId: String\(row\.client_id\)/);
  const verifyCall = app.indexOf('await ensureJuvanBookingApprovalPolicy()');
  const listenCall = app.indexOf('server = app.listen');
  assert.ok(verifyCall >= 0, 'startup must verify Juvan policy');
  assert.ok(listenCall > verifyCall, 'verification must complete before the HTTP listener opens');
});
