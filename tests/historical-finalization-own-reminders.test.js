const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'historicalFinalizationPrompt.js'), 'utf8');

test('historical prompts target all three practitioner Admins and reuse own-only authority', () => {
  assert.match(source, /IN \('christel','abigail','marietjie'\)/);
  assert.match(source, /SELECT id AS admin_id, staff_id/);
  assert.match(source, /certificationStaffIds\(admin\)/);
  assert.doesNotMatch(source, /staffMap\.get\('abigail'\)/);
  assert.doesNotMatch(source, /jean-pierre|jean pierre/i);
});
