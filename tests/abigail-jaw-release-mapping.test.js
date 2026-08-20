const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'migrations', '069_remove_abigail_jaw_release_mapping.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

test('Jaw Release correction targets the exact canonical Goldie service and Abigail only', () => {
  assert.match(sql, /LOWER\(display_name\) = 'abigail'/);
  assert.match(sql, /resource_type = 'practitioner'/);
  assert.match(sql, /external_id = 'b5c96105-f534-406d-89ec-68e78c65cf8b'/);
  assert.match(sql, /name = 'Upper Back, Neck & Jaw Release'/);
  assert.match(sql, /DELETE FROM staff_services[\s\S]*service_id = target_service_id[\s\S]*staff_id = abigail_id/);
});

test('Jaw Release correction preserves service and historical appointment truth', () => {
  assert.doesNotMatch(sql, /DELETE FROM services/i);
  assert.doesNotMatch(sql, /UPDATE services/i);
  assert.doesNotMatch(sql, /DELETE FROM appointment/i);
  assert.match(sql, /Non-Abigail practitioner mappings changed during Jaw Release correction/);
  assert.match(sql, /Appointment history changed during Jaw Release correction/);
});
