const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const auth = require('../src/services/providerIndependentStaffAuth');

const migrationPath = path.join(__dirname, '..', 'migrations', '091_totp_recovery_hash_constraint.sql');

function recoveryHashPatternFromMigration() {
  const migration = fs.readFileSync(migrationPath, 'utf8');
  const match = migration.match(/staff_auth_recovery_hash_check\s+CHECK\s*\(\s*code_hash\s*~\s*'([^']+)'\s*\)/s);
  assert.ok(match, '091 must define the recovery-hash CHECK explicitly');
  return { migration, pattern: new RegExp(match[1]) };
}

test('091 replaces only the historical recovery-hash CHECK without editing the 081 ledger entry', () => {
  const { migration } = recoveryHashPatternFromMigration();
  assert.match(migration, /DROP CONSTRAINT IF EXISTS staff_auth_recovery_hash_check/);
  assert.match(migration, /ADD CONSTRAINT staff_auth_recovery_hash_check/);
  assert.doesNotMatch(migration, /UPDATE\s+staff_auth_recovery_codes/i);
  assert.doesNotMatch(migration, /DELETE\s+FROM\s+staff_auth_recovery_codes/i);
  assert.doesNotMatch(migration, /TRUNCATE/i);

  const historical = fs.readFileSync(path.join(__dirname, '..', 'migrations', '081_provider_independent_staff_auth.sql'), 'utf8');
  assert.match(historical, /staff_auth_recovery_hash_check/);
});

test('canonical runtime scrypt recovery hashes satisfy the repaired database grammar', async () => {
  const { pattern } = recoveryHashPatternFromMigration();
  const code = 'ABCD'.repeat(8);
  const hash = await auth.hashRecoveryCode(code, () => Buffer.alloc(16, 4));

  assert.match(hash, pattern);
  assert.match(hash, /^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);

  assert.doesNotMatch('scrypt$16384$8$1$short$short', pattern);
  assert.doesNotMatch(hash.replace('scrypt$16384$8$1$', 'scrypt$32768$8$1$'), pattern);
  assert.doesNotMatch(hash.replace(/.$/, '+'), pattern);
});
