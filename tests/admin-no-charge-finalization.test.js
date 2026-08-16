const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const finalization = fs.readFileSync(path.join(root, 'src/services/adminAppointmentFinalization.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'migrations/057_no_charge_finalization.sql'), 'utf8');

test('historical finalization exposes No charge as a distinct attended outcome', () => {
  assert.match(finalization, /FINAL_STATUSES = new Set\(\['completed', 'no_show', 'no_charge'\]\)/);
  assert.match(finalization, /title: 'No charge'/);
  assert.match(finalization, /Client attended; R0 charge and R0 earnings/);
  assert.match(finalization, /finalize_\(completed\|no_show\|no_charge\)/);
});

test('No charge preserves attendance truth but forces financial truth to R0 atomically', () => {
  assert.match(finalization, /const canonicalStatus = isNoCharge \? 'completed' : targetStatus/);
  assert.match(finalization, /financial_classification=\$2/);
  assert.match(finalization, /pre_adjustment_total_price=CASE WHEN \$2='no_charge' THEN COALESCE\(pre_adjustment_total_price,total_price\)/);
  assert.match(finalization, /total_price=CASE WHEN \$2='no_charge' THEN 0 ELSE total_price END/);
  assert.match(finalization, /practitionerEarningsOverride: isNoCharge \? 0 : null/);
  assert.match(finalization, /clientCharge: isNoCharge \? 0/);
  assert.match(finalization, /UPDATE appointment_lifecycle SET status=\$1/);
});

test('No charge classification is explicit in the canonical appointment schema', () => {
  assert.match(migration, /financial_classification TEXT NOT NULL DEFAULT 'standard'/);
  assert.match(migration, /financial_classification IN \('standard','no_charge'\)/);
  assert.match(migration, /pre_adjustment_total_price NUMERIC\(12,2\)/);
});

test('No charge completion refreshes the queue and confirms R0 treatment', () => {
  assert.match(finalization, /targetStatus === 'no_charge' \? ' Client charge and practitioner earnings are R0\.'/);
  assert.match(finalization, /It has been removed from the finalization queue/);
});
