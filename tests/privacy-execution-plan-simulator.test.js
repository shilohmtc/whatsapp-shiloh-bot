const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  simulatePrivacyExecutionPlan,
} = require('../src/services/privacyExecutionPlanSimulator');

function syntheticFixture() {
  return {
    synthetic: true,
    tables: {
      appointments: [
        { id: 'appt-1', client_id: 'synthetic-client', status: 'completed' },
      ],
      client_contacts: [
        { id: 'contact-1', client_id: 'synthetic-client', normalized_value: 'synthetic-phone' },
      ],
      conversation_sessions: [
        { id: 'session-1', phone: 'synthetic-phone', previous_response_id: 'synthetic-response' },
      ],
    },
  };
}

function safePlan() {
  return {
    status: 'preview_only',
    destructiveActionAllowed: false,
    decisions: [
      { table: 'appointments', count: 1, decision: { action: 'retain' } },
      { table: 'client_contacts', count: 1, decision: { action: 'deidentify' } },
      { table: 'conversation_sessions', count: 1, decision: { action: 'erase' } },
    ],
  };
}

test('privacy execution simulation is synthetic-only and never enables destructive execution', () => {
  assert.throws(
    () => simulatePrivacyExecutionPlan(safePlan(), { ...syntheticFixture(), synthetic: false }),
    /synthetic/i
  );

  const result = simulatePrivacyExecutionPlan(safePlan(), syntheticFixture());
  assert.equal(result.simulationOnly, true);
  assert.equal(result.executionReady, false);
  assert.equal(result.destructiveActionAllowed, false);
});

test('successful simulation retains history, de-identifies identity rows and erases transient rows in memory only', () => {
  const fixture = syntheticFixture();
  const original = structuredClone(fixture);
  const result = simulatePrivacyExecutionPlan(safePlan(), fixture);

  assert.equal(result.status, 'simulated_commit');
  assert.deepEqual(fixture, original, 'caller fixture must never be mutated');
  assert.deepEqual(result.after.tables.appointments, original.tables.appointments);
  assert.equal(result.after.tables.client_contacts.length, 1);
  assert.notEqual(result.after.tables.client_contacts[0].normalized_value, 'synthetic-phone');
  assert.equal(result.after.tables.conversation_sessions.length, 0);
});

test('manual-review data blocks the entire simulation fail-closed', () => {
  const plan = safePlan();
  plan.decisions.push({
    table: 'unknown_linked_records',
    count: 1,
    decision: { action: 'manual_review_required' },
  });

  const result = simulatePrivacyExecutionPlan(plan, syntheticFixture());
  assert.equal(result.status, 'blocked');
  assert.equal(result.executionReady, false);
  assert.equal(result.destructiveActionAllowed, false);
  assert.ok(result.blockingReasons.includes('manual_review_required'));
  assert.equal(result.after, undefined);
});

test('injected mid-plan failure proves full rollback to the original synthetic state', () => {
  const fixture = syntheticFixture();
  const original = structuredClone(fixture);
  const result = simulatePrivacyExecutionPlan(safePlan(), fixture, { failAtStep: 2 });

  assert.equal(result.status, 'simulated_rollback');
  assert.equal(result.rolledBack, true);
  assert.deepEqual(result.after, original);
  assert.deepEqual(fixture, original, 'rollback rehearsal must not mutate caller state');
  assert.equal(result.executionReady, false);
  assert.equal(result.destructiveActionAllowed, false);
});

test('simulator source has no database, network or production mutation capability', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/services/privacyExecutionPlanSimulator.js'),
    'utf8'
  );

  assert.doesNotMatch(source, /db\/pool|\.query\s*\(|\bfetch\s*\(|axios|https\.request|http\.request/);
  assert.doesNotMatch(source, /DELETE\s+FROM|UPDATE\s+\w+\s+SET|INSERT\s+INTO/i);
});
