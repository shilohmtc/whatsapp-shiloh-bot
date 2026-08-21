const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const master = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-MASTER-STATUS.md'), 'utf8');
const tracker = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-PROJECT-TRACKER.md'), 'utf8');
const reconciliation = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-GBP-PROVIDER-GATE.md'), 'utf8');

test('GBP remains a pending external provider gate at zero general request quota', () => {
  for (const doc of [master, tracker, reconciliation]) {
    assert.match(doc, /Requests per minute|Requests\/min/);
    assert.match(doc, /0/);
    assert.match(doc, /pending Google|WAITING PROVIDER|EXTERNAL\s*\/\s*PROVIDER GATE/i);
  }
  assert.match(master, /not positively established/);
  assert.match(tracker, /not confirmed\/usable/);
});

test('GBP carry-forward does not authorize integration or ordinary quota work', () => {
  assert.match(master, /not an ordinary capacity\/quota-increase task/);
  assert.match(master, /Do not begin or resume GBP OAuth\/API integration/);
  assert.match(tracker, /Do not treat as quota-increase work or start OAuth\/API integration/);
  assert.match(reconciliation, /Do not start or resume GBP OAuth\/API integration/);
});

test('GBP provider ownership and reopening evidence are explicit', () => {
  for (const doc of [master, tracker, reconciliation]) {
    assert.match(doc, /Production \/ DevOps/);
    assert.match(doc, /Control & Reconciliation/);
    assert.match(doc, /usable.*quota.*greater than 0|Requests\/min >0|>0 usable quota/i);
  }
});

test('existing GBP scaffolding is not mistaken for provider approval', () => {
  assert.match(master, /PR #35/);
  assert.match(master, /not evidence of provider approval/);
  assert.match(reconciliation, /sync scaffolding.*do not establish provider approval or usable API access/i);
});
