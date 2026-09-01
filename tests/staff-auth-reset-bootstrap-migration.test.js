const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MIGRATION = path.join(__dirname, '..', 'migrations', '094_staff_auth_reset_bootstrap_capability.sql');

function sql() {
  return fs.readFileSync(MIGRATION, 'utf8');
}

test('bootstrap staff-auth reset grant is limited to two explicit principal fingerprints', () => {
  const body = sql();
  const fingerprints = [...body.matchAll(/'[a-f0-9]{32}'/g)].map((match) => match[0]);
  const unique = [...new Set(fingerprints)].sort();

  assert.deepEqual(unique, [
    "'d56ddc5d031161bb338ab4499cfa2b0c'",
    "'e2f8ad80473976f06734c19d4a9b3a31'",
  ]);
  assert.match(body, /matched_count\s*<>\s*2/);
  assert.match(body, /a\.active\s*=\s*TRUE/);
  assert.match(body, /s\.status\s*=\s*'active'/);
  assert.match(body, /'\{\"staff_auth:reset\":true\}'::jsonb/);
});

test('bootstrap migration preserves existing permissions and does not infer reset authority from roles', () => {
  const body = sql();

  assert.match(body, /COALESCE\(a\.permissions, '\{\}'::jsonb\)\s*\|\|/);
  assert.match(body, /permissions\s*->>\s*'staff_auth:reset'/);
  assert.doesNotMatch(body, /business_role\s+IN/i);
  assert.doesNotMatch(body, /role\s+IN/i);
  assert.doesNotMatch(body, /DELETE\s+FROM/i);
  assert.doesNotMatch(body, /staff_totp_credentials/i);
  assert.doesNotMatch(body, /staff_browser_sessions/i);
});
