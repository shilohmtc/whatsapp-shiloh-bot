const test = require('node:test');
const assert = require('node:assert/strict');

const { nameTokens } = require('../src/bootstrap/adminClientLookupNamePatch');

test('nameTokens normalizes whitespace, punctuation, and case', () => {
  assert.deepEqual(nameTokens('  Stefan   Erasmus  '), ['stefan', 'erasmus']);
  assert.deepEqual(nameTokens('Erasmus, Stefan'), ['erasmus', 'stefan']);
  assert.deepEqual(nameTokens('STEFAN-ERASMUS'), ['stefan', 'erasmus']);
});

test('nameTokens preserves multi-part names while ignoring one-character noise', () => {
  assert.deepEqual(nameTokens('Stefan J Erasmus'), ['stefan', 'erasmus']);
  assert.deepEqual(nameTokens('Jean-Pierre du Plessis'), ['jean', 'pierre', 'du', 'plessis']);
});

test('single-token lookups do not qualify for broad fallback by themselves', () => {
  assert.deepEqual(nameTokens('Stefan'), ['stefan']);
});
