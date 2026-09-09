const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/services/adminInteractiveMenu.js', 'utf8');

test('stable WhatsApp Admin actions have no dispatch authority after cutover', () => {
  assert.doesNotMatch(source, /actionForId|isActionVisibleForAdmin|dispatchStableAction/);
  assert.match(source, /processRetiredAdminAuthorityMessage/);
});
