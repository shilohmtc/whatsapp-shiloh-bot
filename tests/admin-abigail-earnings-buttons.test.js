const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const menu = fs.readFileSync(path.join(root, 'src/services/adminMobileMenu.js'), 'utf8');
const buttons = fs.readFileSync(path.join(root, 'src/services/adminEarningsButtons.js'), 'utf8');
const webhook = fs.readFileSync(path.join(root, 'src/controllers/webhookController.js'), 'utf8');
const whatsapp = fs.readFileSync(path.join(root, 'src/services/whatsapp.js'), 'utf8');
const reports = fs.readFileSync(path.join(root, 'src/services/adminReports.js'), 'utf8');

test('Christel/business-wide admin gets an Abigail earnings menu option', () => {
  assert.match(menu, /if\(isBusinessWide\(admin\)\)options\.push\(\{key:'abigail_earnings'/);
  assert.match(menu, /label:'💰 Abigail earnings'/);
  assert.match(menu, /selected\.key==='abigail_earnings'/);
  assert.match(menu, /interactive:abigailEarningsButtons\(\)/);
});

test('earnings submenu uses exactly three genuine WhatsApp reply buttons', () => {
  assert.match(buttons, /title: 'Today'/);
  assert.match(buttons, /title: 'This Week'/);
  assert.match(buttons, /title: 'This Month'/);
  assert.equal((buttons.match(/title:/g) || []).length, 3);
  assert.match(whatsapp, /type: "interactive"/);
  assert.match(whatsapp, /type: "button"/);
  assert.match(whatsapp, /type: "reply"/);
  assert.match(whatsapp, /buttons\.length > 3/);
});

test('button IDs map into the existing guarded Abigail earnings command path', () => {
  assert.match(buttons, /admin_abigail_earnings_today: 'Abigail earnings today'/);
  assert.match(buttons, /admin_abigail_earnings_week: 'Abigail earnings this week'/);
  assert.match(buttons, /admin_abigail_earnings_month: 'Abigail earnings this month'/);
  assert.match(webhook, /commandForAdminButton\(message\.interactive\.button_reply\?\.id\)/);
  assert.match(webhook, /processAdminReportsMessage\(from,text\)/);
  assert.match(reports, /Only a business-wide admin can view another practitioner’s earnings report/);
});

test('unknown interactive replies fail closed and ordinary text commands remain supported', () => {
  assert.match(buttons, /\|\| null/);
  assert.match(webhook, /Ignoring unsupported or unknown WhatsApp message/);
  assert.match(reports, /\^abigail\(\?:'s\)\? earnings/);
  assert.match(reports, /ABIGAIL_COMMISSION_RATE = 0\.20/);
  assert.match(reports, /ABIGAIL_MONTHLY_SALARY = 5000/);
});
