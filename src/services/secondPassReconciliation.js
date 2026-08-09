const { getAppointmentIdentityEvidence } = require("./appointmentIdentityEvidence");
const { normalizeText, nameSimilarity, tokenSimilarity } = require("./reconciliationRecommendations");

function emailKey(value) {
  return String(value || "").trim().toLowerCase();
}

function pairScore(a, b) {
  const name = nameSimilarity(a.displayName, b.displayName);
  const tokens = tokenSimilarity(a.displayName, b.displayName);
  const emailA = emailKey(a.email);
  const emailB = emailKey(b.email);
  const emailMatch = Boolean(emailA && emailB && emailA === emailB);
  const historyA = Number(a.exactAppointmentCount || 0);
  const historyB = Number(b.exactAppointmentCount || 0);
  const oneSidedHistory = (historyA > 0) !== (historyB > 0);

  let score = 0;
  score += name * 0.62;
  score += tokens * 0.18;
  if (emailMatch) score += 0.16;
  if (oneSidedHistory) score += 0.04;
  return { score: Math.min(1, score), nameSimilarity: name, tokenSimilarity: tokens, emailMatch, oneSidedHistory };
}

function recommendationFor(group) {
  const primary = group.records.find((r) => r.exactAppointmentCount > 0);
  const others = group.records.filter((r) => r !== primary);
  if (!primary || !others.length) return { classification: "manual_review", confidence: 0, primary: null, comparisons: [] };

  const comparisons = others.map((record) => ({
    goldieClientId: record.goldieClientId,
    displayName: record.displayName,
    exactAppointmentCount: record.exactAppointmentCount,
    nearAppointmentCount: record.nearAppointmentCount,
    ...pairScore(primary, record),
  }));

  const weakest = Math.min(...comparisons.map((c) => c.score));
  const allStrongNames = comparisons.every((c) => c.nameSimilarity >= 0.94 || (c.nameSimilarity >= 0.88 && c.tokenSimilarity >= 0.8));
  const noIndependentExactHistory = comparisons.every((c) => c.exactAppointmentCount === 0);
  const noConflictingNearHistory = comparisons.every((c) => c.nearAppointmentCount <= 1);
  const emailSupport = comparisons.some((c) => c.emailMatch);

  let classification = "manual_review";
  let confidence = weakest;
  if (noIndependentExactHistory && allStrongNames && noConflictingNearHistory && (weakest >= 0.72 || emailSupport)) {
    classification = "strict_merge_candidate";
    confidence = Math.max(confidence, emailSupport ? 0.94 : 0.9);
  } else if (noIndependentExactHistory && allStrongNames && weakest >= 0.66) {
    classification = "probable_duplicate_hold";
    confidence = Math.max(confidence, 0.82);
  }

  return {
    classification,
    confidence: Number(confidence.toFixed(3)),
    primary: {
      goldieClientId: primary.goldieClientId,
      displayName: primary.displayName,
      exactAppointmentCount: primary.exactAppointmentCount,
      nearAppointmentCount: primary.nearAppointmentCount,
    },
    comparisons,
  };
}

async function getSecondPassReconciliation({ clientBatchId = "1", appointmentBatchId = "2" } = {}) {
  const evidence = await getAppointmentIdentityEvidence({ clientBatchId, appointmentBatchId });
  const targetGroups = evidence.groups.filter((g) => g.appointmentEvidence === "supports_primary_named_identity_but_not_merge");
  const groups = targetGroups.map((group) => ({
    normalizedPhone: group.normalizedPhone,
    recordCount: group.recordCount,
    ...recommendationFor(group),
  }));

  const summary = {
    evaluatedGroups: groups.length,
    strictMergeCandidates: groups.filter((g) => g.classification === "strict_merge_candidate").length,
    probableDuplicateHold: groups.filter((g) => g.classification === "probable_duplicate_hold").length,
    manualReview: groups.filter((g) => g.classification === "manual_review").length,
  };

  return {
    safety: {
      mode: "recommendation_only",
      writesPerformed: false,
      automaticMergeEnabled: false,
      note: "Second-pass scoring combines name similarity and appointment-name evidence. It does not modify canonical clients or reconciliation state.",
    },
    clientBatchId: String(clientBatchId),
    appointmentBatchId: String(appointmentBatchId),
    summary,
    groups,
  };
}

module.exports = { getSecondPassReconciliation };
