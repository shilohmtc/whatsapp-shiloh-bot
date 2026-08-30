const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const interactive = fs.readFileSync(path.join(root, 'src/services/adminInteractiveMenu.js'), 'utf8');
const mobile = fs.readFileSync(path.join(root, 'src/services/adminMobileMenu.js'), 'utf8');
const webhook = fs.readFileSync(path.join(root, 'src/controllers/webhookController.js'), 'utf8');

test('stable Today and Tomorrow actions delegate directly to appointment-date owner', () => {
  assert.match(interactive, /processAdminAppointmentsByDateMessage/);
  assert.match(interactive, /action\.key === 'today' \|\| action\.key === 'tomorrow'/);
  assert.match(interactive, /return processAdminAppointmentsByDateMessage\(sender, action\.command\)/);
});

test('removed staff operations have no ordinary interactive or mobile delegation', () => {
  for (const handler of [
    'processAdminHelpMessage',
    'processAdminWalkinMessage',
    'processAdminStaffServicesMessage',
    'processAdminServicePricingMessage',
  ]) {
    assert.doesNotMatch(interactive, new RegExp(handler), handler);
    assert.doesNotMatch(mobile, new RegExp(handler), handler);
  }
});

test('interactive adapter is terminal for authenticated staff and has no generic authority fallbacks', () => {
  assert.match(webhook, /processAdminInteractiveMenuMessage\(from,text\)/);
  assert.doesNotMatch(webhook, /processAdminAppointmentsByDateMessage\(from,text\)|processAdminAssistantMessage\(from,text\)/);
  assert.match(interactive, /That staff WhatsApp action is unavailable\. No action was taken/);
});
