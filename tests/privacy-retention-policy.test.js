const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ACTION,
  decisionForClassification,
  buildRetentionDecisionPlan,
} = require('../src/services/privacyRetentionPolicy');

test('unknown retention classifications always fail closed to manual review', () => {
  const decision = decisionForClassification('future_sensitive_table');
  assert.equal(decision.action, ACTION.MANUAL_REVIEW);
  assert.equal(decision.executionReady, false);
});

test('retention decision preview classifies known categories but never enables destruction', () => {
  const plan = buildRetentionDecisionPlan({
    status: 'ok',
    directReferences: [
      { table: 'appointments', count: 3, classification: 'retain_pending_policy' },
      { table: 'client_contacts', count: 2, classification: 'erase_or_deidentify_candidate' },
      { table: 'future_client_notes', count: 1, classification: 'manual_review_required' },
    ],
    phoneLinked: [
      { table: 'conversation_sessions', count: 1, classification: 'erase_candidate_short_lived' },
      { table: 'client_onboarding_sessions', count: 1, classification: 'temporary_should_expire' },
    ],
    auditEvidence: { count: 2, classification: 'manual_review_required' },
  });

  assert.equal(plan.status, 'preview_only');
  assert.equal(plan.destructiveActionAllowed, false);
  assert.equal(plan.summary.retainRows, 3);
  assert.equal(plan.summary.deidentifyRows, 2);
  assert.equal(plan.summary.eraseCandidateRows, 2);
  assert.equal(plan.summary.manualReviewRows, 3);
  assert.ok(plan.blockingReasons.includes('unclassified_or_manual_review_data_present'));
  assert.ok(plan.blockingReasons.includes('request_identity_not_verified_in_preview'));
  assert.ok(plan.decisions.every((item) => item.decision.executionReady === false));
});

test('invalid or absent inventory is blocked and cannot authorize deletion', () => {
  const plan = buildRetentionDecisionPlan({ status: 'not_found' });
  assert.equal(plan.status, 'blocked');
  assert.equal(plan.destructiveActionAllowed, false);
  assert.deepEqual(plan.blockingReasons, ['valid_inventory_required']);
});
