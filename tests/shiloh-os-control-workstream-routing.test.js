const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const governance = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md'), 'utf8');
const master = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-MASTER-STATUS.md'), 'utf8');
const tracker = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-PROJECT-TRACKER.md'), 'utf8');
const reconciliation = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-CONTROL-WORKSTREAM-ROUTING.md'), 'utf8');

test('Control checkpoints provide complete specialist routing', () => {
  for (const required of [
    'Owning workstream',
    'Exact specialist chat',
    'Why this workstream owns it',
    'Dependencies / observers',
    'Implementation status',
    'Ready-to-copy continuation instruction',
  ]) assert.ok(governance.includes(required), required);
  assert.match(master, /Control checkpoint workstream routing — 🟢 ADOPTED/);
  assert.match(tracker, /CONTROL-CHECKPOINT-ROUTING/);
  assert.match(reconciliation, /Adopted routing contract/);
});

test('routing context cannot replace authoritative verification', () => {
  assert.match(governance, /routing context, not delegated authority or a replacement for verification/);
  assert.match(governance, /independently read the applicable Master, Project Tracker, latest reconciliation and Engineering Governance on GitHub `main`/);
  assert.match(reconciliation, /routing context only/);
});

test('blocked work remains fail-closed and is not routed to implementation', () => {
  assert.match(governance, /implementation must not proceed/);
  assert.match(governance, /must not be routed to an implementation workstream merely to keep work moving/);
  assert.match(tracker, /Keep ownership with the appropriate monitoring\/provider workstream/);
  assert.match(reconciliation, /no GBP OAuth\/API implementation is authorized/);
});

test('routing reconciliation remains durable when a later reconciliation becomes current', () => {
  const routing = path.join(root, 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-CONTROL-WORKSTREAM-ROUTING.md');
  const latest = 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-HYBRID-WHATSAPP-CHOICE-MENUS.md';
  assert.ok(fs.existsSync(routing));
  assert.ok(master.includes(latest));
  assert.ok(tracker.includes(latest));
});
