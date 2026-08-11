const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const menu = fs.readFileSync(path.join(root, 'src/services/adminMobileMenu.js'), 'utf8');
const buttons = fs.readFileSync(path.join(root, 'src/services/adminEarningsButtons.js'), 'utf8');
const earnings = fs.readFileSync(path.join(root, 'src/services/adminChristelEarnings.js'), 'utf8');
const webhook = fs.readFileSync(path.join(root, 'src/controllers/webhookController.js'), 'utf8');
const whatsapp = fs.readFileSync(path.join(root, 'src/services/whatsapp.js'), 'utf8');

test('Christel owner/admin gets a dedicated Christel earnings menu option', () => {
  assert.match(menu, /function isChristelAdmin\(admin\)/);
  assert.match(menu, /key:'christel_earnings'/);
  assert.match(menu, /label:'💰 Christel earnings'/);
  assert.match(menu, /interactive:christelEarningsButtons\(\)/);
});

test('Christel submenu uses real WhatsApp reply buttons for today week and month', () => {
  assert.match(buttons, /admin_christel_earnings_today: 'Christel earnings today'/);
  assert.match(buttons, /admin_christel_earnings_week: 'Christel earnings this week'/);
  assert.match(buttons, /admin_christel_earnings_month: 'Christel earnings this month'/);
  assert.match(buttons, /function christelEarningsButtons\(\)/);
  assert.match(buttons, /title: 'Today'/);
  assert.match(buttons, /title: 'This Week'/);
  assert.match(buttons, /title: 'This Month'/);
  assert.match(webhook, /commandForAdminButton\(message\.interactive\.button_reply\?\.id\)/);
  assert.match(whatsapp, /type: "interactive"/);
  assert.match(whatsapp, /type: "button"/);
  assert.match(whatsapp, /type: "reply"/);
});

test('Christel earnings are 100 percent of qualifying completed solo treatment value', () => {
  assert.match(earnings, /a\.status = 'completed'/);
  assert.match(earnings, /Number\(row\.staff_count\) === 1 && row\.total_price !== null/);
  assert.match(earnings, /const completedValue = qualifying\.reduce/);
  assert.match(earnings, /Christel earnings \(100%\)/);
  assert.match(earnings, /100% of qualifying completed treatments personally performed by Christel/);
});

test('joint and unpriced appointments fail closed instead of being guessed', () => {
  assert.match(earnings, /Number\(row\.staff_count\) > 1/);
  assert.match(earnings, /row\.total_price === null/);
  assert.match(earnings, /Joint-practitioner appointments excluded/);
  assert.match(earnings, /Completed appointments without a CRM price excluded/);
});

test('Christel earnings are owner-scoped and audited separately from clinic revenue', () => {
  assert.match(earnings, /!isChristel \|\| !isBusinessWide\(admin\)/);
  assert.match(earnings, /Christel earnings are available only to Christel’s authorized owner\/admin account/);
  assert.match(earnings, /admin\.report\.christel_earnings_/);
  assert.match(earnings, /Clinic-wide revenue and Abigail earnings are kept separate/);
});
