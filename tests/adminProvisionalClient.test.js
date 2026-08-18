const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeZaMobile, cleanName } = require('../src/services/adminProvisionalClient');

test('normalizes supported South African mobile formats for duplicate protection', () => {
  assert.equal(normalizeZaMobile('082 123 4567'), '27821234567');
  assert.equal(normalizeZaMobile('+27 82 123 4567'), '27821234567');
  assert.equal(normalizeZaMobile('0027 82 123 4567'), '27821234567');
});

test('rejects invalid or incomplete mobile inputs', () => {
  assert.equal(normalizeZaMobile('082123456'), null);
  assert.equal(normalizeZaMobile('12345'), null);
  assert.equal(normalizeZaMobile('not a number'), null);
});

test('accepts practical client names but rejects unsafe values', () => {
  assert.equal(cleanName('  Stefan   Erasmus  '), 'Stefan Erasmus');
  assert.equal(cleanName("O'Neil van der Merwe"), "O'Neil van der Merwe");
  assert.equal(cleanName('A'), null);
  assert.equal(cleanName('Stefan <script>'), null);
});
