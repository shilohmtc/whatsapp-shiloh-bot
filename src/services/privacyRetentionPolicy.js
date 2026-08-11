const POLICY_VERSION = '2026-08-11.1';

const ACTION = Object.freeze({
  RETAIN: 'retain',
  DEIDENTIFY: 'deidentify',
  ERASE: 'erase',
  MANUAL_REVIEW: 'manual_review_required',
});

// This is an engineering decision policy, not a legal conclusion. Destructive
// execution remains disabled until Shiloh has an approved retention basis,
// verified request identity, owner authorization, and transaction/rollback tests.
const CLASSIFICATION_POLICY = Object.freeze({
  retain_pending_policy: {
    action: ACTION.RETAIN,
    reason: 'Business/transaction history may require retention; retention basis and duration must be approved before any de-identification.',
    executionReady: false,
  },
  erase_or_deidentify_candidate: {
    action: ACTION.DEIDENTIFY,
    reason: 'Direct identity/contact data is a de-identification candidate after request identity and retention-basis review.',
    executionReady: false,
  },
  temporary_should_expire: {
    action: ACTION.ERASE,
    reason: 'Temporary workflow state should already expire under the short staging-data TTL.',
    executionReady: false,
  },
  erase_candidate_short_lived: {
    action: ACTION.ERASE,
    reason: 'Short-lived AI continuity mapping has a defined operational TTL and is an erasure candidate after request verification.',
    executionReady: false,
  },
  erase_candidate_operational: {
    action: ACTION.ERASE,
    reason: 'Operational intent state is an erasure candidate once its operational purpose has ended.',
    executionReady: false,
  },
  manual_review_required: {
    action: ACTION.MANUAL_REVIEW,
    reason: 'No approved retention rule exists for this category. Fail closed and require explicit classification.',
    executionReady: false,
  },
  none: {
    action: ACTION.RETAIN,
    reason: 'No records are present for this category.',
    executionReady: false,
  },
});

function decisionForClassification(classification) {
  const rule = CLASSIFICATION_POLICY[classification];
  if (!rule) {
    return {
      classification: classification || 'unclassified',
      action: ACTION.MANUAL_REVIEW,
      reason: 'Unknown classification. Fail closed and require explicit policy review.',
      executionReady: false,
    };
  }
  return { classification, ...rule };
}

function buildRetentionDecisionPlan(inventory) {
  if (!inventory || inventory.status !== 'ok') {
    return {
      policyVersion: POLICY_VERSION,
      status: 'blocked',
      destructiveActionAllowed: false,
      blockingReasons: ['valid_inventory_required'],
      decisions: [],
    };
  }

  const sources = [
    ...(inventory.directReferences || []).map((item) => ({
      sourceType: 'direct_reference',
      table: item.table,
      count: Number(item.count || 0),
      classification: item.classification,
    })),
    ...(inventory.phoneLinked || []).map((item) => ({
      sourceType: 'phone_linked',
      table: item.table,
      count: Number(item.count || 0),
      classification: item.classification,
    })),
  ];

  if (Number(inventory.auditEvidence?.count || 0) > 0) {
    sources.push({
      sourceType: 'audit_evidence',
      table: 'crm_audit_events',
      count: Number(inventory.auditEvidence.count),
      classification: inventory.auditEvidence.classification || 'manual_review_required',
    });
  }

  const decisions = sources.map((source) => ({
    ...source,
    decision: decisionForClassification(source.classification),
  }));

  const manualReview = decisions.filter((item) => item.decision.action === ACTION.MANUAL_REVIEW && item.count > 0);
  const blockingReasons = [
    'request_identity_not_verified_in_preview',
    'retention_basis_not_approved_for_execution',
    'owner_authorization_not_present',
    'destructive_transaction_path_not_enabled',
  ];
  if (manualReview.length) blockingReasons.push('unclassified_or_manual_review_data_present');

  return {
    policyVersion: POLICY_VERSION,
    status: 'preview_only',
    destructiveActionAllowed: false,
    blockingReasons,
    summary: {
      retainRows: decisions.filter((item) => item.decision.action === ACTION.RETAIN).reduce((sum, item) => sum + item.count, 0),
      deidentifyRows: decisions.filter((item) => item.decision.action === ACTION.DEIDENTIFY).reduce((sum, item) => sum + item.count, 0),
      eraseCandidateRows: decisions.filter((item) => item.decision.action === ACTION.ERASE).reduce((sum, item) => sum + item.count, 0),
      manualReviewRows: manualReview.reduce((sum, item) => sum + item.count, 0),
    },
    decisions,
  };
}

module.exports = {
  POLICY_VERSION,
  ACTION,
  CLASSIFICATION_POLICY,
  decisionForClassification,
  buildRetentionDecisionPlan,
};
