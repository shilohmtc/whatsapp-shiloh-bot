const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const interactive = fs.readFileSync(path.join(root, 'src/services/adminInteractiveMenu.js'), 'utf8');
const webhook = fs.readFileSync(path.join(root, 'src/controllers/webhookController.js'), 'utf8');

test('stable Today and Tomorrow section actions delegate directly to appointment-date owner', () => {
  assert.match(interactive, /processAdminAppointmentsByDateMessage/);
  assert.match(interactive, /action\.key === 'today' \|\| action\.key === 'tomorrow'/);
  assert.match(interactive, /return processAdminAppointmentsByDateMessage\(sender, action\.command\)/);
  assert.doesNotMatch(interactive, /if \(action\) \{[\s\S]*?return processAdminMobileMenuMessage\(sender, action\.command\);[\s\S]*?\}/);
});

test('other deliberately delegated stable actions also invoke their guarded owners directly', () => {
  assert.match(interactive, /action\.key === 'walkin'.*processAdminWalkinMessage\(sender, action\.command\)/s);
  assert.match(interactive, /action\.key === 'help'.*processAdminHelpMessage\(sender, action\.command\)/s);
});

test('interactive adapter is terminal for authenticated staff and has no generic authority fallbacks', () => {
  assert.match(webhook, /processAdminInteractiveMenuMessage\(from,text\)/);
  assert.doesNotMatch(webhook, /processAdminAppointmentsByDateMessage\(from,text\)|processAdminAssistantMessage\(from,text\)/);
  assert.match(interactive, /That staff WhatsApp action is unavailable\. No action was taken/);
});
