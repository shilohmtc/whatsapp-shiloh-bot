const test = require('node:test');
const assert = require('node:assert/strict');

const { PostgresCrmV2ClientRepository } = require('../src/repositories/crmV2ClientRepository');

test('CRM V2 reuses an already-connected pg PoolClient without reconnecting it', async () => {
  let connectCalls = 0;
  let workCalls = 0;
  const poolClient = {
    async connect() {
      connectCalls += 1;
      throw new Error('Client has already been connected. You cannot reuse a client.');
    },
    async query() {
      return { rows: [] };
    },
    release() {},
  };

  const repository = new PostgresCrmV2ClientRepository(poolClient);
  const result = await repository.withTransaction(async (transaction) => {
    workCalls += 1;
    assert.equal(transaction, repository);
    return 'ok';
  });

  assert.equal(result, 'ok');
  assert.equal(connectCalls, 0);
  assert.equal(workCalls, 1);
});

test('CRM V2 still owns BEGIN/COMMIT/release when given a pg Pool', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      return { rows: [] };
    },
    release() {
      calls.push('release');
    },
  };
  const pool = {
    async connect() {
      calls.push('connect');
      return client;
    },
  };

  const repository = new PostgresCrmV2ClientRepository(pool);
  const result = await repository.withTransaction(async (transaction) => {
    calls.push('work');
    assert.notEqual(transaction, repository);
    assert.equal(transaction.queryable, client);
    return 'ok';
  });

  assert.equal(result, 'ok');
  assert.deepEqual(calls, [
    'connect',
    'BEGIN ISOLATION LEVEL SERIALIZABLE',
    'work',
    'COMMIT',
    'release',
  ]);
});

test('CRM V2 rolls back and releases when it owns a pg Pool transaction', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      return { rows: [] };
    },
    release() {
      calls.push('release');
    },
  };
  const pool = {
    async connect() {
      calls.push('connect');
      return client;
    },
  };

  const repository = new PostgresCrmV2ClientRepository(pool);
  await assert.rejects(
    repository.withTransaction(async () => {
      calls.push('work');
      throw new Error('boom');
    }),
    /boom/
  );

  assert.deepEqual(calls, [
    'connect',
    'BEGIN ISOLATION LEVEL SERIALIZABLE',
    'work',
    'ROLLBACK',
    'release',
  ]);
});
