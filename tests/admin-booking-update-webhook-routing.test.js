const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js'), 'utf8');

test('manage-booking interactions are retired before the retained admin router', () => {
  assert.doesNotMatch(source, /processAdminBookingUpdateMessage|processStatelessAdminBookingUpdateMessage|processAdminAssistantMessage/);
  const retired = source.indexOf('processAdminRetiredAuthorityMessage(from,text)');
  const menu = source.indexOf('processAdminInteractiveMenuMessage(from,text)');
  assert.ok(retired >= 0 && menu > retired);
});
