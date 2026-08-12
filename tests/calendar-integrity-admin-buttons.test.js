const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const menu = fs.readFileSync(path.join(root, 'src/services/adminMobileMenu.js'), 'utf8');
const buttons = fs.readFileSync(path.join(root, 'src/services/adminEarningsButtons.js'), 'utf8');

test('Christel admin menu exposes calendar integrity review', () => {
  assert.match(menu, /key:'calendar_integrity'/);
  assert.match(menu, /Calendar integrity/);
  assert.match(menu, /isChristelAdmin\(admin\)/);
});

test('calendar integrity menu opens real WhatsApp buttons', () => {
  assert.match(menu, /calendarIntegrityButtons\(\)/);
  assert.match(buttons, /admin_calendar_integrity_scan/);
  assert.match(buttons, /admin_calendar_integrity_issues/);
  assert.match(buttons, /title: 'Scan Now'/);
  assert.match(buttons, /title: 'Open Issues'/);
});

test('button commands route into guarded Christel integrity processor', () => {
  assert.match(menu, /processAdminCalendarIntegrityMessage/);
  assert.match(menu, /const integrity=await processAdminCalendarIntegrityMessage\(sender,text\)/);
  assert.match(menu, /if\(integrity\.handled\)/);
});
