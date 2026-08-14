const test = require('node:test');
const assert = require('node:assert/strict');

const { needsLanguageCheck, isEnglishCompatibleClinicNavigation } = require('../src/services/englishLanguageGuard');

test('known English clinic-navigation phrases bypass probabilistic language classification', () => {
  assert.equal(isEnglishCompatibleClinicNavigation('Lymphatic drainage treatments'), true);
  assert.equal(isEnglishCompatibleClinicNavigation('Elim MediHeel Pedicure treatments'), true);
  assert.equal(isEnglishCompatibleClinicNavigation('Beauty & Aesthetics treatments'), true);
  assert.equal(needsLanguageCheck('Lymphatic drainage treatments'), false);
  assert.equal(needsLanguageCheck('Elim MediHeel Pedicure treatments'), false);
});

test('ordinary substantive sentences still reach the language classifier', () => {
  assert.equal(isEnglishCompatibleClinicNavigation('Ek wil graag môre bespreek'), false);
  assert.equal(needsLanguageCheck('Ek wil graag môre bespreek'), true);
  assert.equal(needsLanguageCheck('I would like to book tomorrow'), true);
});
