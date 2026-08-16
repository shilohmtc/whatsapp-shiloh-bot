const test = require('node:test');
const assert = require('node:assert/strict');
const {
  namesCompatible,
  parseNaturalDateOfBirth,
  expandTwoDigitYear,
} = require('../src/services/identityOnboardingGuard');

test('imported-client name verification tolerates non-identity prefixes but not arbitrary partial names', () => {
  assert.equal(namesCompatible('Derik', 'Pa Derik'), true);
  assert.equal(namesCompatible('Pa Derik', 'Derik'), true);
  assert.equal(namesCompatible('Mr John Smith', 'John Smith'), true);
  assert.equal(namesCompatible('John', 'John Smith'), false);
  assert.equal(namesCompatible('Someone Else', 'Pa Derik'), false);
});

test('natural DOB claim input accepts two-digit years in day-first forms', () => {
  const now = new Date(Date.UTC(2026, 7, 16));
  assert.equal(parseNaturalDateOfBirth('2 oct 64 male', now), '1964-10-02');
  assert.equal(parseNaturalDateOfBirth('02/10/64 female', now), '1964-10-02');
  assert.equal(parseNaturalDateOfBirth('2 Oct 2015', now), '2015-10-02');
});

test('two-digit year expansion uses a current-year pivot and retains age safety', () => {
  const now = new Date(Date.UTC(2026, 7, 16));
  assert.equal(expandTwoDigitYear('15', now), 2015);
  assert.equal(expandTwoDigitYear('64', now), 1964);
  assert.equal(parseNaturalDateOfBirth('2 oct 27', now), '1927-10-02');
  assert.equal(parseNaturalDateOfBirth('2 oct 00', now), '2000-10-02');
  assert.equal(parseNaturalDateOfBirth('31 feb 64', now), null);
});
