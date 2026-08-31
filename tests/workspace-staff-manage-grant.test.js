const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('093 grants only staff:manage to active owner/business_admin principals', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '093_workspace_staff_manage_capability.sql'),
    'utf8'
  );

  assert.match(sql, /UPDATE\s+staff_admin_accounts/i);
  assert.match(sql, /permissions\s*=\s*COALESCE\(permissions,\s*'\{\}'::jsonb\)\s*\|\|\s*'\{\"staff:manage\":true\}'::jsonb/i);
  assert.match(sql, /active\s*=\s*TRUE/i);
  assert.match(sql, /business_role\s+IN\s*\(\s*'owner'\s*,\s*'business_admin'\s*\)/i);
  assert.match(sql, /permissions\s*->>\s*'staff:manage'/i);

  assert.doesNotMatch(sql, /staff:view\"\s*:\s*true|services:manage|schedule:manage|appointment:create|client_bookable|UPDATE\s+staff\b|INSERT\s+INTO\s+staff\b/i);
  assert.doesNotMatch(sql, /INSERT\s+INTO\s+staff_admin_accounts|DELETE\s+FROM\s+staff_admin_accounts/i);
});
