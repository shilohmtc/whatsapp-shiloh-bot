const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('092 grants only services:manage to active owner/business_admin principals', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '092_workspace_services_manage_capability.sql'),
    'utf8'
  );

  assert.match(sql, /UPDATE\s+staff_admin_accounts/i);
  assert.match(sql, /permissions\s*=\s*COALESCE\(permissions,\s*'\{\}'::jsonb\)\s*\|\|\s*'\{\"services:manage\":true\}'::jsonb/i);
  assert.match(sql, /active\s*=\s*TRUE/i);
  assert.match(sql, /business_role\s+IN\s*\(\s*'owner'\s*,\s*'business_admin'\s*\)/i);
  assert.match(sql, /permissions\s*->>\s*'services:manage'/i);

  assert.doesNotMatch(sql, /services:view\"\s*:\s*true|staff:manage|schedule:manage|client_bookable|UPDATE\s+services\b|UPDATE\s+staff\b/i);
  assert.doesNotMatch(sql, /INSERT\s+INTO\s+staff_admin_accounts|DELETE\s+FROM\s+staff_admin_accounts/i);
});
