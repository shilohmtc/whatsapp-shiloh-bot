'use strict';

const crypto = require('node:crypto');

const CLASSIFICATIONS = Object.freeze(['read', 'write']);
const ISOLATION_LEVELS = Object.freeze(['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']);
const FORBIDDEN_KEYS = /^(sql|rawSql|query|command|shell|exec|argv|script|connectionString|databaseUrl|password|secret|token)$/i;
const SENSITIVE_RESULT_KEYS = /(phone|email|address|name|dob|birth|password|secret|token|credential|connection|string|payload|service_text|therapist_text)/i;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const AUTHORIZATION_PATTERN = /^PR #[1-9][0-9]*$/;
const OPERATION_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^[1-9][0-9]*$/;

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function contractForChecksum(operation) {
  const {
    checksum,
    ...contract
  } = operation;
  return contract;
}

function computeOperationChecksum(operation) {
  return crypto
    .createHash('sha256')
    .update(stableStringify(contractForChecksum(operation)))
    .digest('hex');
}

function findForbiddenKeys(value, path = '$', findings = []) {
  if (!value || typeof value !== 'object') return findings;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.test(key)) findings.push(childPath);
    if (child && typeof child === 'object') findForbiddenKeys(child, childPath, findings);
  }
  return findings;
}

function assertStringArray(value, field, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim() === '')) {
    throw new Error(`${field} must be an array of non-empty strings`);
  }
  if (nonEmpty && value.length === 0) throw new Error(`${field} must not be empty`);
}

function validateTransactionContract(transaction, classification) {
  if (!transaction || typeof transaction !== 'object') {
    throw new Error('transaction contract is required');
  }
  if (!ISOLATION_LEVELS.includes(transaction.isolation)) {
    throw new Error(`transaction.isolation must be one of: ${ISOLATION_LEVELS.join(', ')}`);
  }
  for (const field of ['statementTimeoutMs', 'lockTimeoutMs']) {
    if (!Number.isInteger(transaction[field]) || transaction[field] <= 0) {
      throw new Error(`transaction.${field} must be a positive integer`);
    }
  }
  if (transaction.lockKey !== null && transaction.lockKey !== undefined && typeof transaction.lockKey !== 'string') {
    throw new Error('transaction.lockKey must be a string or null');
  }
  assertStringArray(transaction.preconditions, 'transaction.preconditions');
  assertStringArray(transaction.expectedState, 'transaction.expectedState');
  assertStringArray(transaction.precommitVerifications, 'transaction.precommitVerifications');

  if (!transaction.postcommitVerification || typeof transaction.postcommitVerification !== 'object') {
    throw new Error('transaction.postcommitVerification is required');
  }
  if (transaction.postcommitVerification.readOnly !== true) {
    throw new Error('postcommit verification must be read-only');
  }
  if (!ISOLATION_LEVELS.includes(transaction.postcommitVerification.isolation)) {
    throw new Error('postcommit verification isolation is invalid');
  }
  assertStringArray(transaction.postcommitVerification.assertions, 'transaction.postcommitVerification.assertions');

  if (classification === 'write') {
    if (!transaction.lockKey) throw new Error('write operations require transaction.lockKey');
    assertStringArray(transaction.preconditions, 'transaction.preconditions', { nonEmpty: true });
    assertStringArray(transaction.expectedState, 'transaction.expectedState', { nonEmpty: true });
    assertStringArray(transaction.precommitVerifications, 'transaction.precommitVerifications', { nonEmpty: true });
    assertStringArray(transaction.postcommitVerification.assertions, 'transaction.postcommitVerification.assertions', { nonEmpty: true });
  }
}

function validateReplayContract(replay, classification) {
  if (!replay || typeof replay !== 'object') throw new Error('replay contract is required');
  if (typeof replay.scope !== 'string' || replay.scope.trim() === '') throw new Error('replay.scope is required');
  if (!['none', 'required'].includes(replay.mode)) throw new Error('replay.mode must be none or required');
  if (classification === 'write' && replay.mode !== 'required') {
    throw new Error('write operations require durable replay prevention contract');
  }
  if (replay.productionStoreImplemented !== false) {
    throw new Error('production replay store must remain unimplemented in the inert framework');
  }
}

function validateOperationDefinition(operation) {
  if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new Error('operation definition must be an object');
  }
  const forbidden = findForbiddenKeys(operation);
  if (forbidden.length > 0) {
    throw new Error(`arbitrary SQL/command/secret fields are prohibited: ${forbidden.join(', ')}`);
  }
  if (!OPERATION_ID_PATTERN.test(operation.id || '')) throw new Error('operation.id is invalid');
  if (!VERSION_PATTERN.test(String(operation.version || ''))) throw new Error('operation.version is invalid');
  if (!CLASSIFICATIONS.includes(operation.classification)) throw new Error('operation.classification must be read or write');
  if (!SHA_PATTERN.test(operation.commit || '')) throw new Error('operation.commit must be an exact 40-character lowercase Git SHA');
  if (!AUTHORIZATION_PATTERN.test(operation.authorizationRef || '')) throw new Error('operation.authorizationRef must use PR #<number> format');
  if (typeof operation.description !== 'string' || operation.description.trim() === '') throw new Error('operation.description is required');
  if (operation.enabled !== false) throw new Error('repository framework operations must remain disabled until separately authorized');
  if (operation.execution !== 'first-party-bounded-job') {
    throw new Error('operation.execution must be first-party-bounded-job');
  }
  if (operation.allowArbitraryInput !== false) throw new Error('allowArbitraryInput must be false');
  if (operation.confirmation !== `CONFIRM:${operation.id}:${operation.version}`) {
    throw new Error('operation confirmation token does not match immutable operation identity');
  }

  validateTransactionContract(operation.transaction, operation.classification);
  validateReplayContract(operation.replay, operation.classification);

  const expectedChecksum = computeOperationChecksum(operation);
  if (operation.checksum !== expectedChecksum) {
    throw new Error('operation checksum mismatch');
  }
  return Object.freeze({ ...operation });
}

function createRegistry(definitions) {
  if (!Array.isArray(definitions)) throw new Error('definitions must be an array');
  const byId = new Map();
  for (const definition of definitions) {
    const operation = validateOperationDefinition(definition);
    if (byId.has(operation.id)) throw new Error(`duplicate operation id: ${operation.id}`);
    byId.set(operation.id, operation);
  }
  return Object.freeze({
    list() {
      return Object.freeze([...byId.values()]);
    },
    resolve(operationId) {
      const operation = byId.get(operationId);
      if (!operation) throw new Error(`unknown maintenance operation: ${operationId}`);
      return operation;
    },
  });
}

function validateInvocation({ operation, commit, authorizationRef, confirmation }) {
  if (!operation || typeof operation !== 'object') throw new Error('operation is required');
  if (operation.enabled !== true) throw new Error('maintenance operation is not live-enabled');
  if (commit !== operation.commit) throw new Error('exact commit binding failed');
  if (authorizationRef !== operation.authorizationRef) throw new Error('authorization reference mismatch');
  if (confirmation !== operation.confirmation) throw new Error('explicit confirmation mismatch');
  return true;
}

function validateReplayStore(replayStore) {
  if (!replayStore || typeof replayStore.has !== 'function' || typeof replayStore.record !== 'function') {
    throw new Error('replay store must implement has() and record()');
  }
  return replayStore;
}

function assertNotReplayed({ operation, replayStore }) {
  if (operation.replay.mode !== 'required') return true;
  validateReplayStore(replayStore);
  const key = `${operation.id}:${operation.version}:${operation.commit}:${operation.authorizationRef}`;
  if (replayStore.has(key)) throw new Error('authorized maintenance operation has already been recorded as executed');
  return key;
}

function sanitizeStructuredResult(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('structured result must be an object');

  function sanitize(value, path = '$') {
    if (Array.isArray(value)) return value.map((entry, index) => sanitize(entry, `${path}[${index}]`));
    if (!value || typeof value !== 'object') return value;
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      if (SENSITIVE_RESULT_KEYS.test(key)) throw new Error(`sensitive result key prohibited at ${path}.${key}`);
      output[key] = sanitize(child, `${path}.${key}`);
    }
    return output;
  }

  return sanitize(result);
}

module.exports = {
  CLASSIFICATIONS,
  ISOLATION_LEVELS,
  computeOperationChecksum,
  createRegistry,
  validateOperationDefinition,
  validateInvocation,
  validateReplayStore,
  assertNotReplayed,
  sanitizeStructuredResult,
};
