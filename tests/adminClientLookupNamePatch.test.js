const test = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../src/db/pool');

const { nameTokens, findGoldieIdentityBridge } = require('../src/bootstrap/adminClientLookupNamePatch');

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

test('Goldie bridge only exposes canonical ids from already reconciled matched identities', async () => {
  const originalQuery = pool.query;
  pool.query = async () => ({
    rowCount: 3,
    rows: [
      { reconciliation_status: 'matched', shiloh_entity_id: 42, queue_status: null },
      { reconciliation_status: 'matched', shiloh_entity_id: 42, queue_status: null },
      { reconciliation_status: 'unmatched', shiloh_entity_id: null, queue_status: 'needs_review' },
    ],
  });
  try {
    const result = await findGoldieIdentityBridge('Stefan Erasmus', 10);
    assert.deepEqual(result.matchedClientIds, ['42']);
    assert.equal(result.externalCount, 3);
    assert.deepEqual(result.statuses.sort(), ['matched', 'unmatched']);
  } finally {
    pool.query = originalQuery;
  }
});
