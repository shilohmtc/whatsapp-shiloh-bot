const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'migrations', '110_business_admin_service_creation_authority.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

test('#796 migration is fail-closed around the two resolved broad principals', () => {
  assert.match(sql, /id = 2[\s\S]*role = 'owner'[\s\S]*business_role = 'owner'[\s\S]*calendar_scope = 'all_business'[\s\S]*service_scope = 'all_services'/);
  assert.match(sql, /id = 4[\s\S]*role = 'admin'[\s\S]*business_role = 'business_admin'[\s\S]*calendar_scope = 'all_business'[\s\S]*service_scope = 'all_services'/);
  assert.match(sql, /target_count <> 2/);
  assert.match(sql, /WHERE id IN \(2, 4\)/);
});

test('#796 migration changes only services:create capability data', () => {
  const updates = [...sql.matchAll(/UPDATE staff_admin_accounts[\s\S]*?;/g)].map(match => match[0]);
  assert.equal(updates.length, 1);
  assert.match(updates[0], /jsonb_build_object\('services:create', TRUE\)/);
  assert.doesNotMatch(updates[0], /services:manage/);
  assert.doesNotMatch(sql, /Marietjie|Jean-Pierre|Christel/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM|TRUNCATE|DROP\s+/i);
});

test('#796 migration proves the authorized capability after mutation', () => {
  assert.match(sql, /permissions ->> 'services:create'/);
  assert.match(sql, /failed to establish services:create for all authorized targets/);
});
