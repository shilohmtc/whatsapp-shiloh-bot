const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const finalization = source('src/services/adminAppointmentFinalization.js');
const migration = source('migrations/058_historical_price_adjustment.sql');
const christelEarnings = source('src/services/adminChristelEarnings.js');

test('price adjustment is available to each practitioner Admin inside their own certification scope', () => {
  assert.match(finalization, /function canUseDiscretionaryFinalization\(admin\)/);
  assert.match(finalization, /return canAccessOwnFinalization\(admin\)/);
  assert.match(finalization, /title: 'Adjust price'/);
  assert.match(finalization, /finalize_price_adjust_/);
  assert.match(finalization, /assigned practitioner through their own linked Admin account/);
});

test('price adjustment uses a guarded amount and explicit button confirmation', () => {
  assert.match(finalization, /parseAdjustedPrice/);
  assert.match(finalization, /For a R0 visit, use \*No charge\* instead/);
  assert.match(finalization, /finalize_price_confirm/);
  assert.match(finalization, /title: 'Confirm price'/);
  assert.match(finalization, /finalize_price_back/);
  assert.match(finalization, /awaiting_confirmation/);
});

test('adjusted finalization preserves original value and atomically writes completed financial truth', () => {
  assert.match(finalization, /async function finalizePriceAdjustedAppointment/);
  assert.match(finalization, /BEGIN/);
  assert.match(finalization, /canCertifyAppointment\(admin, appointment\.id, db\)/);
  assert.match(finalization, /financial_classification='price_adjusted'/);
  assert.match(finalization, /pre_adjustment_total_price=COALESCE\(pre_adjustment_total_price,total_price\)/);
  assert.match(finalization, /total_price=\$1/);
  assert.match(finalization, /status='completed'/);
  assert.match(finalization, /admin\.appointment_price_adjusted_finalized/);
  assert.match(finalization, /priceAuthority: `\$\{cleanName\(admin\.display_name\)\}_discretion`/);
  assert.match(finalization, /COMMIT/);
  assert.match(finalization, /ROLLBACK/);
});

test('adjusted completed value remains the existing earnings basis', () => {
  assert.match(christelEarnings, /a\.total_price/);
  assert.match(christelEarnings, /a\.status='completed'/);
  assert.match(christelEarnings, /completedValue=qualifying\.reduce\(\(s,r\)=>s\+Number\(r\.total_price\|\|0\),0\)/);
});

test('schema supports price-adjusted classification and durable multi-turn intents', () => {
  assert.match(migration, /'standard','no_charge','price_adjusted'/);
  assert.match(migration, /admin_appointment_price_adjustment_intents/);
  assert.match(migration, /collecting_price/);
  assert.match(migration, /awaiting_confirmation/);
  assert.match(migration, /adjusted_price IS NULL OR adjusted_price > 0/);
});

test('successful price adjustment refreshes queue so appointment disappears', () => {
  assert.match(finalization, /finalized \*Completed\* at an adjusted price/);
  assert.match(finalization, /removed from the finalization queue/);
  assert.match(finalization, /refreshedQueueInteractive\(admin/);
});
