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

test('interactive adapter still runs before generic appointment and admin-assistant fallbacks', () => {
  const adapter = webhook.indexOf('processAdminInteractiveMenuMessage(from,text)');
  const appointments = webhook.indexOf('processAdminAppointmentsByDateMessage(from,text)');
  const assistant = webhook.indexOf('processAdminAssistantMessage(from,text)');
  assert.ok(adapter >= 0 && appointments >= 0 && assistant >= 0);
  assert.ok(adapter < appointments);
  assert.ok(appointments < assistant);
});
