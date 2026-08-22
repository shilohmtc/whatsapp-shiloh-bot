const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration067 = fs.readFileSync(path.join(root, 'migrations', '067_controlled_juvan_registration_rebind.sql'), 'utf8');
const migration072 = fs.readFileSync(path.join(root, 'migrations', '072_client_onboarding_controlled_demo_phone_ambiguity.sql'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'src', 'services', 'juvanBookingApprovalPolicy.js'), 'utf8');
const onboarding = fs.readFileSync(path.join(root, 'src', 'services', 'clientIdentityOnboarding.js'), 'utf8');

test('migration 067 documents the production PL/pgSQL normalized_phone collision being repaired', () => {
  assert.match(migration067, /DECLARE[\s\S]*normalized_phone TEXT;/);
  assert.match(migration067, /WHERE d\.normalized_phone = normalized_phone/);
  assert.match(migration067, /BEFORE INSERT OR UPDATE OF client_id, contact_type, normalized_value, value/);
});

test('migration 072 removes the PL/pgSQL identifier collision without weakening controlled identity guards', () => {
  assert.match(migration072, /v_normalized_phone TEXT;/);
  assert.match(migration072, /WHERE d\.normalized_phone = v_normalized_phone/);
  assert.doesNotMatch(migration072, /WHERE d\.normalized_phone = normalized_phone/);
  assert.match(migration072, /BEFORE INSERT OR UPDATE OF client_id, contact_type, normalized_value, value/);
  assert.match(migration072, /target canonical client is not active/);
  assert.match(migration072, /controlled phone is already bound to another canonical client/);
  assert.match(migration072, /controlled phone already has another CRM binding/);
  assert.match(migration072, /unbound demo identity may rebind only through normal WhatsApp onboarding/);
  assert.match(migration072, /approval policy could not be rebound atomically/);
  assert.match(migration072, /approval policy pointer does not match the bound demo client/);
  assert.match(migration072, /controlled_demo_identity\.rebound/);
});

test('ordinary onboarding still owns canonical contact creation and duplicate conflict handling', () => {
  assert.match(onboarding, /SELECT id,client_id FROM client_contacts WHERE normalized_value=\$1 AND contact_type IN \('whatsapp','mobile'\) LIMIT 1/);
  assert.match(onboarding, /AMBIGUOUS_CONTACT/);
  assert.match(onboarding, /INSERT INTO client_contacts \(client_id,contact_type,value,normalized_value,is_primary,verified_at\)/);
  assert.doesNotMatch(onboarding, /controlled_demo_identities/);
});

test('startup applies the forward repair after the historical controlled identity migrations', () => {
  assert.match(bootstrap, /REBIND_AMBIGUITY_FIX_MIGRATION = '072_client_onboarding_controlled_demo_phone_ambiguity\.sql'/);
  assert.match(bootstrap, /applyMigrationFile\(REBIND_AMBIGUITY_FIX_MIGRATION\)/);
  assert.match(bootstrap, /filename: REBIND_AMBIGUITY_FIX_MIGRATION/);

  const oldRebind = bootstrap.indexOf('applyMigrationFile(REBIND_MIGRATION)');
  const primaryBackup = bootstrap.indexOf('applyMigrationFile(PRIMARY_BACKUP_MIGRATION)');
  const repair = bootstrap.indexOf('applyMigrationFile(REBIND_AMBIGUITY_FIX_MIGRATION)');
  assert.ok(oldRebind >= 0 && primaryBackup > oldRebind && repair > primaryBackup,
    'repair must be applied after the already-authoritative controlled identity migrations');
});
