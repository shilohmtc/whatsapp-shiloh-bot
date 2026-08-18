const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const master = read('docs/SHILOH-OS-MASTER-STATUS.md');
const tracker = read('docs/SHILOH-OS-PROJECT-TRACKER.md');
const reconciliation = read('docs/SHILOH-OS-RECONCILIATION-2026-08-18-OWN-APPOINTMENT-FINALIZATION.md');

test('Master and Tracker carry the verified own-practitioner finalization rule', () => {
  for (const source of [master, tracker, reconciliation]) {
    assert.match(source, /Christel.*Christel/);
    assert.match(source, /Abigail.*Abigail/);
    assert.match(source, /Marietjie.*Marietjie/);
    assert.match(source, /Jean-Pierre|JP/);
  }
  assert.match(master, /PR #324/);
  assert.match(tracker, /CI #1041 passed 662\/0/);
  assert.match(reconciliation, /dep-da2a3037uimc73a20leg/);
});

test('durable guardrails preserve human attendance truth and appointment 558', () => {
  assert.match(reconciliation, /No attendance, appointment, CRM identity or Calendar record was changed/);
  assert.match(reconciliation, /Appointment #558 remains unresolved with historical practitioner `SHILOH MTC`/);
  assert.match(reconciliation, /Present only safely routable unresolved appointments/);
  assert.match(reconciliation, /identity conflict must stop finalization work and route to CRM & Identity/);
});
