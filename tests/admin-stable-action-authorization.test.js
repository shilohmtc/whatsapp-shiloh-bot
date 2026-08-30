const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  actionForId,
  isActionVisibleForAdmin,
} = require('../src/services/adminInteractiveMenu');

test('stable Admin action visibility follows current capability scope', () => {
  const pricing = actionForId('admin_action_pricing');
  const calendar = actionForId('admin_action_open_calendar');
  assert.equal(isActionVisibleForAdmin(pricing, { permissions: {} }), false);
  assert.equal(isActionVisibleForAdmin(pricing, { permissions: { 'service:pricing': true } }), true);
  assert.equal(isActionVisibleForAdmin(calendar, { permissions: {} }), true);
  assert.equal(actionForId('admin_action_booking'), null);
  assert.equal(actionForId('admin_action_schedule'), null);
});

test('stable Admin action IDs are revalidated before dispatch', () => {
  const source = fs.readFileSync('src/services/adminInteractiveMenu.js', 'utf8');
  assert.match(source, /if \(!isActionVisibleForAdmin\(action, admin\)\)/);
  assert.match(source, /That staff action is not available for your role\. No action was taken/);
  assert.match(source, /if \(action\) return dispatchStableAction\(sender, action, admin\)/);
});
