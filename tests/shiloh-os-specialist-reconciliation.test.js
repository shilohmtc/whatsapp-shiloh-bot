const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const governance = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md'), 'utf8');
const master = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-MASTER-STATUS.md'), 'utf8');
const tracker = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-PROJECT-TRACKER.md'), 'utf8');
const reconciliation = fs.readFileSync(path.join(root, 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-SPECIALIST-WORKSTREAM-RECONCILIATION.md'), 'utf8');

test('all four specialist workstreams own mandatory reconciliation', () => {
  for (const name of [
    'Booking & Admin UX',
    'WhatsApp / Meta Integration',
    'CRM & Identity',
    'Production / DevOps',
  ]) assert.ok(governance.includes(name), name);
  assert.match(governance, /Specialist workstream reconciliation rule/);
  assert.match(tracker, /SPECIALIST-RECONCILIATION/);
});

test('specialist completion reaches reconciliation and final checkpoint', () => {
  assert.match(governance, /implement → test\/full applicable regression gate → repair until green → merge → production\/provider verification where applicable → Project Tracker reconciliation → Master reconciliation where durable authoritative state changed → final specialist checkpoint/);
  for (const required of [
    'what became authoritative',
    'what was completed and must not be redone',
    'what remains unresolved or externally gated',
    'whether Project Tracker and/or Master reconciliation was required and completed',
    'whether another workstream owns a dependency or next action',
  ]) assert.ok(governance.includes(required), required);
});

test('Tracker and Master responsibilities remain evidence-gated', () => {
  assert.match(governance, /Project Tracker reconciliation must record delivery evidence and current status, PR\/commit references/);
  assert.match(governance, /Proposed work, work in progress and implementation on an unmerged branch must never be recorded as completed Master state/);
  assert.match(master, /Specialist workstream reconciliation — 🟢 ADOPTED/);
});

test('Control continuity ignores unreconciled specialist narrative', () => {
  assert.match(governance, /not specialist-chat narrative/);
  assert.match(tracker, /uses reconciled authoritative evidence, not specialist-chat narrative, for continuity/);
  assert.match(reconciliation, /not specialist-chat narrative/);
});

test('blocked specialist work is recorded and not falsely completed', () => {
  assert.match(governance, /It must not declare the unit complete or write unverified state into the Master/);
  assert.match(reconciliation, /work remains incomplete and fail-closed/);
});

test('specialist and JP reconciliations remain durable when own-finalization reconciliation becomes current', () => {
  const specialist = path.join(root, 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-SPECIALIST-WORKSTREAM-RECONCILIATION.md');
  const jpEntitlement = path.join(root, 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-JP-BOOKING-ENTITLEMENT.md');
  const latest = 'docs/SHILOH-OS-RECONCILIATION-2026-08-18-OWN-APPOINTMENT-FINALIZATION.md';
  assert.ok(fs.existsSync(specialist));
  assert.ok(fs.existsSync(jpEntitlement));
  assert.ok(master.includes(latest));
  assert.ok(tracker.includes(latest));
});
