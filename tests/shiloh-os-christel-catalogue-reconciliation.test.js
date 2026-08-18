const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const master = read('docs/SHILOH-OS-MASTER-STATUS.md');
const tracker = read('docs/SHILOH-OS-PROJECT-TRACKER.md');
const reconciliationPath = 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-CHRISTEL-SERVICE-CATALOGUE-CORRECTION.md';
const reconciliation = read(reconciliationPath);

test('Master and Tracker point to the verified Christel catalogue reconciliation', () => {
  assert.ok(master.includes(reconciliationPath));
  assert.ok(tracker.includes(reconciliationPath));
  assert.match(master, /Christel reviewed service catalogue — 🟢 VERIFIED LIVE through #328/);
  assert.match(tracker, /CHRISTEL-CATALOGUE-CORRECTION.*🟢 VERIFIED LIVE/);
});

test('reconciliation records exact retirement, retained services and corrected totals', () => {
  assert.match(reconciliation, /service #27[\s\S]*inactive/);
  assert.match(reconciliation, /service #34[\s\S]*120-minute/);
  assert.match(reconciliation, /service #65[\s\S]*50 minutes/);
  assert.match(reconciliation, /60 base \+ 0 processing \+ 0 extra = \*\*60 minutes\*\*/);
  assert.match(reconciliation, /90 base \+ 0 processing \+ 0 extra = \*\*90 minutes\*\*/);
  assert.match(reconciliation, /7 → 7/);
  assert.match(reconciliation, /17 → 17/);
});

test('delivery evidence covers CI merge deploy database public catalogue and booking behaviour', () => {
  for (const evidence of [
    'PR **#328**',
    'CI **#1051** passed **688 / 0**',
    'dep-da2ba6f10e5c73cp6l60',
    '16 → 15',
    '/audit-read/catalogue/status',
    'Production `/book`',
    'Post-deploy error/fatal logs were clear',
  ]) assert.ok(reconciliation.includes(evidence), evidence);
});

test('final checkpoint assigns only the separate description gate to Control', () => {
  assert.match(reconciliation, /Do not bulk-publish Goldie descriptions/);
  assert.match(reconciliation, /Control & Reconciliation owns the approval decision and routing/);
  assert.match(reconciliation, /Booking & Admin UX and Production \/ DevOps own no remaining dependency for this correction/);
  assert.match(reconciliation, /Project Tracker and durable Master reconciliation are completed/);
});
