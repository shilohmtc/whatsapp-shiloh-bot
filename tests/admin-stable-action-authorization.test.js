const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const interactiveMenuPath = 'src/services/adminInteractiveMenu.js';
const source = fs.readFileSync(interactiveMenuPath, 'utf8');
const { actionForId, isActionVisibleInMenu } = require(`../${interactiveMenuPath}`);

test('stable Admin action visibility follows the current role-scoped menu', () => {
  const abigail = actionForId('admin_action_abigail_earnings');
  assert.ok(abigail);

  const practitionerMenu = '*Reports*\n1️⃣ My report today\n\n*More*\n2️⃣ Help';
  assert.equal(isActionVisibleInMenu(abigail, practitionerMenu), false);

  const businessMenu = '*Reports*\n1️⃣ Today\'s report\n2️⃣ 💰 Abigail earnings\n\n*More*\n3️⃣ Help';
  assert.equal(isActionVisibleInMenu(abigail, businessMenu), true);
});

test('stable Admin action IDs are revalidated before shared dispatch', () => {
  assert.match(source, /const menuResult = await getRoleScopedMenu\(sender\);/);
  assert.match(source, /!isActionVisibleInMenu\(action, menuResult\.interactive\.body\)/);
  assert.match(source, /That admin action is not available for your account/);
  assert.match(source, /return dispatchStableAction\(sender, action\);/);
});
