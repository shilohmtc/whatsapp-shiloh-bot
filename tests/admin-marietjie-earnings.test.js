const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const earnings = fs.readFileSync('src/services/adminMarietjieEarnings.js', 'utf8');
const buttons = fs.readFileSync('src/services/adminEarningsButtons.js', 'utf8');
const menu = fs.readFileSync('src/services/adminInteractiveMenu.js', 'utf8');

test('Marietjie earnings are completed-only, 100 percent, and have no salary', () => {
  assert.match(earnings, /a\.status='completed'/);
  assert.match(earnings, /staff_count\) === 1/);
  assert.match(earnings, /Marietjie earnings \(100%\)/);
  assert.match(earnings, /No fixed salary is included/);
  assert.match(earnings, /earningsIntegrity/);
  assert.match(earnings, /pendingCanonicalStatus/);
  assert.doesNotMatch(earnings, /MONTHLY_SALARY|COMMISSION_RATE/);
});

test('Marietjie earnings are restricted to Marietjie self, Christel and Jean-Pierre business admin', () => {
  assert.match(earnings, /name === 'christel'/);
  assert.match(earnings, /name === 'jean-pierre'/);
  assert.match(earnings, /name === 'marietjie'/);
  assert.match(earnings, /String\(admin\.staff_id \|\| ''\) === String\(marietjie\.id\)/);
  assert.match(earnings, /Marietjie earnings are available only to Marietjie, Christel, and the authorized business admin/);
});

test('Marietjie earnings expose all four stable periods and route from Reports', () => {
  for (const suffix of ['today', 'week', 'last_week', 'month']) {
    assert.match(buttons, new RegExp(`admin_marietjie_earnings_${suffix}`));
  }
  assert.match(menu, /key: 'marietjie_earnings'/);
  assert.match(menu, /marietjieEarningsButtons/);
  assert.match(menu, /processAdminMarietjieEarningsMessage/);
  assert.match(menu, /\*Reports\*\\n99️⃣ 💰 Marietjie earnings/);
});
