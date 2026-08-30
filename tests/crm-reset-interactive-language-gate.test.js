const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  needsLanguageCheck,
  isEnglishCompatibleControlToken,
} = require('../src/services/englishLanguageGuard');

const webhookSource = fs.readFileSync('src/controllers/webhookController.js', 'utf8');

test('controlled Juvan reset Confirm and Cancel tokens bypass natural-language classification', () => {
  for (const action of ['confirm', 'cancel']) {
    const token = `admin_controlled_demo_reset_${action}:juvan_botha`;
    assert.equal(isEnglishCompatibleControlToken(token), true);
    assert.equal(needsLanguageCheck(token), false);
  }
});

test('guarded cleanup choice, pagination, and confirmation tokens bypass language classification narrowly', () => {
  for (const token of [
    'admin_controlled_demo_reset_choose:clean_bookings',
    'admin_controlled_demo_reset_choose:identity_only',
    'admin_controlled_demo_reset_preview_clean:845:0123456789abcdefabcd:2',
    'admin_controlled_demo_reset_confirm_clean:845:0123456789abcdefabcd',
  ]) {
    assert.equal(isEnglishCompatibleControlToken(token), true);
    assert.equal(needsLanguageCheck(token), false);
  }
  assert.equal(isEnglishCompatibleControlToken('admin_controlled_demo_reset_confirm_clean:845:anything'), false);
});

test('legacy in-flight Juvan buttons remain safe during transition but retired targets do not bypass', () => {
  for (const action of ['confirm', 'cancel']) {
    const legacy = `admin_test_client_reset_${action}:juvan`;
    assert.equal(isEnglishCompatibleControlToken(legacy), true);
    assert.equal(needsLanguageCheck(legacy), false);
    assert.equal(isEnglishCompatibleControlToken(`admin_test_client_reset_${action}:chenique`), false);
    assert.equal(isEnglishCompatibleControlToken(`admin_test_client_reset_${action}:dummy_test`), false);
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
  assert.match(webhookSource, /processAdminRetiredAuthorityMessage\(from,text\)/);
  assert.doesNotMatch(webhookSource, /processAdminAssistantMessage\(from,text\)/);
});
