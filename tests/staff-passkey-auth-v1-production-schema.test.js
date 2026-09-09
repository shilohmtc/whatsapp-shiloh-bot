const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(
  path.join(__dirname, '../migrations/112_staff_passkey_auth_v1_production_schema_correction.sql'),
  'utf8'
);

test('#794 production schema correction avoids invalid PostgreSQL bounded regex and permits device-bound auth binding', () => {
  assert.match(migration, /DROP CONSTRAINT IF EXISTS staff_auth_passkey_credential_id_check/);
  assert.match(migration, /char_length\(credential_id\) BETWEEN 16 AND 1366/);
  assert.match(migration, /credential_id ~ '\^\[A-Za-z0-9_-\]\+\$'/);
  assert.doesNotMatch(migration, /\{16,1024\}/);

  assert.match(migration, /DROP CONSTRAINT IF EXISTS staff_auth_webauthn_registration_binding_check/);
  assert.match(migration, /purpose = 'registration' AND admin_id IS NOT NULL AND session_id IS NOT NULL/);
  assert.match(migration, /purpose = 'authentication' AND admin_id IS NOT NULL AND session_id IS NULL/);
  assert.doesNotMatch(migration, /purpose = 'authentication' AND admin_id IS NULL/);
});
