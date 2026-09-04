const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Workspace booking-confirmation audit predicates preserve bigint appointment identity', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'workspaceClientNotifications.js'), 'utf8');
  assert.equal(source.includes('entity_id=a.id::text'), false, 'must not compare bigint audit entity_id with text appointment id');
  const safeMatches = source.match(/entity_id=a\.id(?:\s|\))/g) || [];
  assert.ok(safeMatches.length >= 2, 'appointment confirmation projections must compare audit entity_id directly to bigint appointment id');
});


test('Canonical booking-confirmation recovery preserves bigint appointment identity', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'customerBookingConfirmation.js'), 'utf8');
  assert.equal(source.includes('audit.entity_id=a.id::text'), false, 'recovery must not compare bigint audit entity_id with text appointment id');
  assert.match(source, /customerBookingConfirmation:recoveryState[\s\S]*audit\.entity_id=a\.id(?:\s|\))/);
});
