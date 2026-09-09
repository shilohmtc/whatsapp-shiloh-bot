const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '107_calendar_past_end_time_access.sql'), 'utf8');

test('migration 107 grants only the owner-authorized canonical operator set', () => {
  assert.match(sql, /id IN \(1, 2, 4, 5\)/);
  assert.match(sql, /active = TRUE/);
  assert.match(sql, /'appointment:record_past', true/);
  assert.match(sql, /'appointment:adjust_end', true/);
  assert.match(sql, /- 'appointment:record_past:crm_v2_client_ids'/);
  assert.doesNotMatch(sql, /calendar_scope\s*=/i);
  assert.doesNotMatch(sql, /service_scope\s*=/i);
  assert.doesNotMatch(sql, /business_role\s*=/i);
  assert.doesNotMatch(sql, /role\s*=/i);
});
