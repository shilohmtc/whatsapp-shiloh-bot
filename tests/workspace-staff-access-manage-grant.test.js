const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('105 grants only staff_access:manage to active owner/business_admin principals', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '105_workspace_staff_access_manage_capability.sql'),
    'utf8'
  );

  assert.match(sql, /UPDATE\s+staff_admin_accounts/i);
  assert.match(sql, /permissions\s*=\s*COALESCE\(permissions,\s*'\{\}'::jsonb\)\s*\|\|\s*'\{\"staff_access:manage\":true\}'::jsonb/i);
  assert.match(sql, /active\s*=\s*TRUE/i);
  assert.match(sql, /business_role\s+IN\s*\(\s*'owner'\s*,\s*'business_admin'\s*\)/i);
  assert.match(sql, /permissions\s*->>\s*'staff_access:manage'/i);

  assert.doesNotMatch(sql, /staff:manage\"\s*:\s*true|appointment:view\"\s*:\s*true|appointment:create|schedule:manage|client:lookup/i);
  assert.doesNotMatch(sql, /INSERT\s+INTO\s+staff_admin_accounts|DELETE\s+FROM\s+staff_admin_accounts|UPDATE\s+staff\b/i);
  assert.doesNotMatch(sql, /ILince|Christel|Jean-Pierre|Abigail|Marietjie/i);
});
