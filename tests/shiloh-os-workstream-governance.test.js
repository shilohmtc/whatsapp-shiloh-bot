const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const governance = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md'), 'utf8');
const reconciliation = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-WORKSTREAM-OPERATING-MODEL.md'), 'utf8');

test('Shiloh OS governance defines all five shared-authority workstreams', () => {
  for (const name of [
    'Shiloh OS — Control & Reconciliation',
    'Booking & Admin UX',
    'WhatsApp / Meta Integration',
    'CRM & Identity',
    'Production / DevOps',
  ]) assert.ok(governance.includes(name), name);
  assert.match(governance, /not independent projects or independent sources of truth/);
});

test('controlled work continues through green merge deployment and reconciliation', () => {
  assert.match(governance, /inspect authoritative state → implement → test\/full applicable regression gate → repair until green → merge → verify Render\/production\/provider state → reconcile Project Tracker → reconcile Master when durable architectural\/operational state changed → final checkpoint/);
  assert.match(governance, /An intermediate success is not a completion boundary/);
  assert.match(governance, /Never describe work as continuing in the background unless an actual scheduled or automated mechanism has been created/);
});

test('workstreams share authoritative state and reconcile cross-workstream dependencies', () => {
  assert.match(governance, /GitHub `main`/);
  assert.match(governance, /Chat history is navigation context only/);
  assert.match(governance, /No specialist chat may maintain a conflicting version of Shiloh OS/);
  assert.match(reconciliation, /No existing governance conflict was found/);
});

test('Master and Project Tracker responsibilities remain distinct', () => {
  assert.match(governance, /The Master records durable current architecture, business rules, permissions, integrations and operational truth/);
  assert.match(governance, /The Project Tracker records delivery state, PRs\/commits, tests, deployment evidence, outstanding work and next actions/);
  assert.match(governance, /Planned or in-progress implementation must not be recorded as completed production state/);
});
