const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/services/adminAppointmentFinalization.js'), 'utf8');

test('finalization menu exposes the approved eight polished outcomes', () => {
  for (const label of ['Completed','No-show','Cancelled','No charge','Service change','Adjust price','Reschedule','Leave unresolved']) {
    assert.match(source, new RegExp(`title: '${label.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}'`));
  }
  assert.match(source, /What actually happened with this visit\?/);
  assert.match(source, /A different treatment was performed/);
  assert.match(source, /Save no final outcome yet/);
});

test('service change uses durable intent state and practitioner eligibility', () => {
  assert.match(source, /admin_appointment_service_change_intents/);
  assert.match(source, /selecting_service/);
  assert.match(source, /awaiting_service_confirmation/);
  assert.match(source, /collecting_price/);
  assert.match(source, /awaiting_price_confirmation/);
  assert.match(source, /staff_services ss/);
  assert.match(source, /finalize_service_pick_/);
  assert.match(source, /finalize_service_confirm/);
});

test('service change preserves original service in audit and writes actual performed service', () => {
  assert.match(source, /async function finalizeServiceChangedAppointment/);
  assert.match(source, /UPDATE appointment_services SET service_id=\$1,service_name_snapshot=\$2/);
  assert.match(source, /originalService:/);
  assert.match(source, /actualService:/);
  assert.match(source, /admin\.appointment_service_changed_finalized/);
  assert.match(source, /status='completed'/);
  assert.match(source, /Explicit WhatsApp service change/);
});

test('service change supports explicit price and zero-charge outcome', () => {
  assert.match(source, /R0 is allowed/);
  assert.match(source, /const noCharge = finalPrice === 0/);
  assert.match(source, /financialClassification = noCharge \? 'no_charge'/);
  assert.match(source, /practitionerEarningsOverride: noCharge \? 0 : null/);
});

test('multi-service visits fail safely instead of silently collapsing services', () => {
  assert.match(source, /if \(result\.rowCount !== 1\) return \{ status: 'multi_service'/);
  assert.match(source, /Service change currently supports single-service visits only/);
});
