'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  computeOperationChecksum,
  createRegistry,
  validateOperationDefinition,
  validateInvocation,
  assertNotReplayed,
  sanitizeStructuredResult,
} = require('../src/maintenance/operationFramework');
const manifest = require('../config/maintenance-operation-manifest');

function makeOperation(overrides = {}) {
  const operation = {
    id: 'exact-client-remediation',
    version: 1,
    classification: 'write',
    commit: 'a'.repeat(40),
    authorizationRef: 'PR #999',
    description: 'Bounded exact-target maintenance contract fixture.',
    enabled: false,
    execution: 'first-party-bounded-job',
    allowArbitraryInput: false,
    confirmation: 'CONFIRM:exact-client-remediation:1',
    transaction: {
      isolation: 'SERIALIZABLE',
      statementTimeoutMs: 120000,
      lockTimeoutMs: 5000,
      lockKey: 'shiloh:maintenance:exact-client-remediation',
      preconditions: ['target_is_exact', 'authority_is_current'],
      expectedState: ['one_target_changes', 'unrelated_state_unchanged'],
      precommitVerifications: ['write_count_matches', 'preservation_checks_pass'],
      postcommitVerification: {
        readOnly: true,
        isolation: 'REPEATABLE READ',
        assertions: ['target_post_state_matches', 'unrelated_state_unchanged'],
      },
    },
    replay: {
      mode: 'required',
      scope: 'operation-version-commit-authorization',
      productionStoreImplemented: false,
    },
    ...overrides,
  };
  operation.checksum = computeOperationChecksum(operation);
  return operation;
}

test('manifest is deliberately inert and contains no live operation', () => {
  assert.equal(manifest.MANIFEST_VERSION, 1);
  assert.deepEqual(manifest.OPERATIONS, []);
  assert.deepEqual(manifest.registry.list(), []);
});

test('valid write operation requires explicit classification and bounded transaction contract', () => {
  const operation = makeOperation();
  const validated = validateOperationDefinition(operation);
  assert.equal(validated.classification, 'write');
  assert.equal(validated.transaction.isolation, 'SERIALIZABLE');
  assert.equal(validated.replay.mode, 'required');
});

test('arbitrary SQL and arbitrary command fields are rejected recursively', () => {
  for (const forbidden of [
    { sql: 'DELETE FROM clients' },
    { rawSql: 'UPDATE clients SET status = archived' },
    { command: 'psql ...' },
    { nested: { shell: 'bash' } },
  ]) {
    const operation = makeOperation(forbidden);
    operation.checksum = computeOperationChecksum(operation);
    assert.throws(() => validateOperationDefinition(operation), /arbitrary SQL\/command\/secret fields are prohibited/);
  }
});

test('operation lookup fails closed for unknown names and duplicate IDs', () => {
  const operation = makeOperation();
  const registry = createRegistry([operation]);
  assert.equal(registry.resolve(operation.id).id, operation.id);
  assert.throws(() => registry.resolve('unknown-operation'), /unknown maintenance operation/);
  assert.throws(() => createRegistry([operation, operation]), /duplicate operation id/);
});

test('checksum detects immutable contract drift', () => {
  const operation = makeOperation();
  operation.transaction.statementTimeoutMs = 1;
  assert.throws(() => validateOperationDefinition(operation), /checksum mismatch/);
});

test('exact commit, authorization reference and confirmation are all required before invocation', () => {
  const operation = makeOperation({ enabled: true });
  operation.checksum = computeOperationChecksum(operation);
  validateOperationDefinition(operation);

  assert.equal(validateInvocation({
    operation,
    commit: operation.commit,
    authorizationRef: operation.authorizationRef,
    confirmation: operation.confirmation,
  }), true);

  assert.throws(() => validateInvocation({ operation, commit: 'b'.repeat(40), authorizationRef: operation.authorizationRef, confirmation: operation.confirmation }), /exact commit binding failed/);
  assert.throws(() => validateInvocation({ operation, commit: operation.commit, authorizationRef: 'PR #998', confirmation: operation.confirmation }), /authorization reference mismatch/);
  assert.throws(() => validateInvocation({ operation, commit: operation.commit, authorizationRef: operation.authorizationRef, confirmation: 'yes' }), /explicit confirmation mismatch/);
});

test('disabled operations cannot be invoked even when all other values match', () => {
  const operation = makeOperation();
  assert.throws(() => validateInvocation({
    operation,
    commit: operation.commit,
    authorizationRef: operation.authorizationRef,
    confirmation: operation.confirmation,
  }), /not live-enabled/);
});

test('write operations fail closed without lock, precondition, expected-state or verification contracts', () => {
  const mutations = [
    (operation) => { operation.transaction.lockKey = null; },
    (operation) => { operation.transaction.preconditions = []; },
    (operation) => { operation.transaction.expectedState = []; },
    (operation) => { operation.transaction.precommitVerifications = []; },
    (operation) => { operation.transaction.postcommitVerification.assertions = []; },
  ];
  for (const mutate of mutations) {
    const operation = makeOperation();
    mutate(operation);
    operation.checksum = computeOperationChecksum(operation);
    assert.throws(() => validateOperationDefinition(operation));
  }
});

test('write operations require replay-prevention contract and injected store interface', () => {
  const operation = makeOperation();
  const badReplay = makeOperation({ replay: { mode: 'none', scope: 'none', productionStoreImplemented: false } });
  badReplay.checksum = computeOperationChecksum(badReplay);
  assert.throws(() => validateOperationDefinition(badReplay), /durable replay prevention contract/);
  assert.throws(() => assertNotReplayed({ operation, replayStore: {} }), /must implement has\(\) and record\(\)/);

  const seen = new Set();
  const store = {
    has: (key) => seen.has(key),
    record: (key) => seen.add(key),
  };
  const key = assertNotReplayed({ operation, replayStore: store });
  assert.match(key, /^exact-client-remediation:1:/);
  store.record(key);
  assert.throws(() => assertNotReplayed({ operation, replayStore: store }), /already been recorded as executed/);
});

test('structured result sanitizer rejects identity, credential and raw payload fields', () => {
  assert.deepEqual(sanitizeStructuredResult({
    status: 'verified',
    rowCount: 1,
    verification: { passed: true },
  }), {
    status: 'verified',
    rowCount: 1,
    verification: { passed: true },
  });

  for (const result of [
    { clientName: 'redacted' },
    { phone: 'redacted' },
    { token: 'redacted' },
    { nested: { payload: {} } },
  ]) {
    assert.throws(() => sanitizeStructuredResult(result), /sensitive result key prohibited/);
  }
});

test('normal application startup has no maintenance-operation framework execution wiring', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const start = packageJson.scripts.start;
  assert.doesNotMatch(start, /maintenance-operation-manifest/);
  assert.doesNotMatch(start, /operationFramework/);
  assert.doesNotMatch(start, /maintenance --/);
  assert.doesNotMatch(start, /one-off/i);
});

test('framework source exposes no database pool, HTTP route, child process or arbitrary execution dependency', () => {
  const frameworkSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'maintenance', 'operationFramework.js'), 'utf8');
  const manifestSource = fs.readFileSync(path.join(__dirname, '..', 'config', 'maintenance-operation-manifest.js'), 'utf8');
  const combined = `${frameworkSource}\n${manifestSource}`;
  assert.doesNotMatch(combined, /require\(['"]\.\.\/db\/pool['"]\)/);
  assert.doesNotMatch(combined, /child_process/);
  assert.doesNotMatch(combined, /express\(/);
  assert.doesNotMatch(combined, /router\./);
  assert.doesNotMatch(combined, /pool\.query/);
});
