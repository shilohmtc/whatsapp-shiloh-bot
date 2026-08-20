const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  needsLanguageCheck,
  isEnglishCompatibleControlToken,
} = require('../src/services/englishLanguageGuard');

const webhookSource = fs.readFileSync('src/controllers/webhookController.js', 'utf8');

test('CRM reset Confirm and Cancel control tokens bypass natural-language classification', () => {
  for (const target of ['chenique', 'juvan', 'dummy_test']) {
    for (const action of ['confirm', 'cancel']) {
      const token = `admin_test_client_reset_${action}:${target}`;
      assert.equal(isEnglishCompatibleControlToken(token), true);
      assert.equal(needsLanguageCheck(token), false);
    }
  }
});

test('unrecognized machine-like text does not receive a broad language bypass', () => {
  const token = 'admin_dit_is_nie_engels_nie:dummy_test';
  assert.equal(isEnglishCompatibleControlToken(token), false);
  assert.equal(needsLanguageCheck(token), true);
});

test('ordinary non-English free text remains subject to the English-only guard', () => {
  assert.equal(needsLanguageCheck('Ek wil my afspraak verander'), true);
  assert.equal(needsLanguageCheck('Kan ek asseblief môre kom'), true);
});

test('webhook still feeds interactive button IDs into the guarded command pipeline', () => {
  assert.match(webhookSource, /message\.interactive\.button_reply\?\.id/);
  assert.match(webhookSource, /const language=await guardEnglishOnly\(text\)/);
  assert.match(webhookSource, /processAdminAssistantMessage\(from,text\)/);
});
