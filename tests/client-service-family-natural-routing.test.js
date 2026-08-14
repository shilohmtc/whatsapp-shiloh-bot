const test = require('node:test');
const assert = require('node:assert/strict');

const { familyCommandForNaturalText } = require('../src/services/clientServiceFamilyDiscovery');

test('exact client-facing family phrases route deterministically into service-family discovery', () => {
  assert.equal(familyCommandForNaturalText('Lymphatic drainage treatments'), 'client_family_lymphatic');
  assert.equal(familyCommandForNaturalText('lymphatic drainage'), 'client_family_lymphatic');
  assert.equal(familyCommandForNaturalText('Beauty & Aesthetics treatments'), 'client_family_beauty');
  assert.equal(familyCommandForNaturalText('Massage treatments'), 'client_family_massage');
  assert.equal(familyCommandForNaturalText('Elim MediHeel Pedicure treatments'), 'client_family_pedicure');
});

test('unrelated treatment names are not coerced into a family', () => {
  assert.equal(familyCommandForNaturalText('HIFU'), null);
  assert.equal(familyCommandForNaturalText('Swedish Massage 60 min'), null);
});
