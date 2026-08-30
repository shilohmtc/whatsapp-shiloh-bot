const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  actionForId,
  isActionVisibleForAdmin,
} = require('../src/services/adminInteractiveMenu');

test('stable Admin action visibility is limited to the retained quick views', () => {
  const today = actionForId('admin_action_today');
  const reports = actionForId('admin_action_reports');
  assert.equal(isActionVisibleForAdmin(today, { permissions: {} }), false);
  assert.equal(isActionVisibleForAdmin(today, { permissions: { 'appointment:view': true } }), true);
  assert.equal(isActionVisibleForAdmin(reports, { permissions: { 'appointment:view': true } }), true);
  for (const removed of ['open_calendar', 'help', 'client', 'walkin', 'staff_services', 'pricing', 'booking', 'schedule']) {
    assert.equal(actionForId(`admin_action_${removed}`), null, removed);
  }
});

test('stable Admin action IDs are revalidated before dispatch', () => {
  const source = fs.readFileSync('src/services/adminInteractiveMenu.js', 'utf8');
  assert.match(source, /if \(!isActionVisibleForAdmin\(action, admin\)\)/);
  assert.match(source, /That staff action is not available for your role\. No action was taken/);
  assert.match(source, /if \(action\) return dispatchStableAction\(sender, action, admin\)/);
});
