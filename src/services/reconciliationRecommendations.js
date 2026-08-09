const { pool } = require("../db/pool");

const NOISE_TOKENS = new Set([
  "client", "new", "nuwe", "massage", "masseer", "pedi", "pedicure", "facial",
  "couple", "couples", "voucher", "spa", "pregnancy", "dr", "mrs", "mr", "miss"
]);

function normalizeText(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function meaningfulTokens(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !NOISE_TOKENS.has(token));
}

function levenshtein(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function nameSimilarity(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  const distance = levenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
}

function tokenSimilarity(a, b) {
  const left = new Set(meaningfulTokens(a));
  const right = new Set(meaningfulTokens(b));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function compareGoldieRecords(a, b) {
  const fullName = nameSimilarity(a.display_name, b.display_name);
  const tokens = tokenSimilarity(a.display_name, b.display_name);
  const normalizedA = normalizeText(a.display_name);
  const normalizedB = normalizeText(b.display_name);
  const exactName = Boolean(normalizedA && normalizedA === normalizedB);
  const emailA = normalizeEmail(a.email);
  const emailB = normalizeEmail(b.email);
  const exactEmail = Boolean(emailA && emailB && emailA === emailB);

  let recommendation = "manual_review";
  let confidence = 0.5;
  let rationale = "Shared phone requires human identity review";

  if (exactName && exactEmail) {
    recommendation = "high_confidence_duplicate";
    confidence = 0.99;
    rationale = "Same phone, exact normalized name and exact email";
  } else if (exactName) {
    recommendation = "high_confidence_duplicate";
    confidence = 0.97;
    rationale = "Same phone and exact normalized name";
  } else if (exactEmail && fullName >= 0.7) {
    recommendation = "high_confidence_duplicate";
    confidence = 0.96;
    rationale = "Same phone and email with strongly similar names";
  } else if (fullName >= 0.9 || (fullName >= 0.82 && tokens >= 0.5)) {
    recommendation = "probable_duplicate";
    confidence = Math.min(0.95, 0.78 + fullName * 0.12 + tokens * 0.05);
    rationale = "Same phone with highly similar names";
  } else if (fullName <= 0.35 && tokens === 0 && meaningfulTokens(a.display_name).length && meaningfulTokens(b.display_name).length) {
    recommendation = "likely_separate_shared_contact";
    confidence = 0.9;
    rationale = "Same phone but materially different names with no meaningful token overlap";
  }

  return {
    leftGoldieClientId: a.external_client_id,
    rightGoldieClientId: b.external_client_id,
    leftName: a.display_name,
    rightName: b.display_name,
    nameSimilarity: Number(fullName.toFixed(4)),
    tokenSimilarity: Number(tokens.toFixed(4)),
    exactEmail,
    recommendation,
    confidence: Number(confidence.toFixed(4)),
    rationale,
  };
}

function summarizeGroup(records) {
  const comparisons = [];
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      comparisons.push(compareGoldieRecords(records[i], records[j]));
    }
  }

  const counts = comparisons.reduce((acc, item) => {
    acc[item.recommendation] = (acc[item.recommendation] || 0) + 1;
    return acc;
  }, {});

  let groupRecommendation = "manual_review";
  if (comparisons.length && comparisons.every((item) => item.recommendation === "high_confidence_duplicate")) {
    groupRecommendation = "high_confidence_duplicate_group";
  } else if (comparisons.some((item) => item.recommendation === "likely_separate_shared_contact")) {
    groupRecommendation = "mixed_or_shared_contact";
  } else if (comparisons.some((item) => ["high_confidence_duplicate", "probable_duplicate"].includes(item.recommendation))) {
    groupRecommendation = "probable_duplicate_group";
  }

  return { comparisons, counts, groupRecommendation };
}

async function getRecommendationReport(batchId) {
  const params = [];
  const where = ["er.source='goldie'", "er.entity_type='client'"];
  if (batchId) {
    params.push(batchId);
    where.push(`er.import_batch_id=$${params.length}`);
  }

  const duplicateRows = await pool.query(
    `SELECT er.import_batch_id, ecr.external_client_id, ecr.display_name, ecr.email,
            ecr.phone, ecr.normalized_phone, ecr.secondary_phone, ecr.notes
     FROM external_client_records ecr
     JOIN external_records er ON er.id=ecr.external_record_id
     WHERE ${where.join(" AND ")}
       AND ecr.normalized_phone IN (
         SELECT ecr2.normalized_phone
         FROM external_client_records ecr2
         JOIN external_records er2 ON er2.id=ecr2.external_record_id
         WHERE er2.source='goldie' AND er2.entity_type='client'
           ${batchId ? "AND er2.import_batch_id=$1" : ""}
           AND ecr2.normalized_phone IS NOT NULL AND ecr2.normalized_phone<>''
         GROUP BY ecr2.normalized_phone HAVING COUNT(*)>1
       )
     ORDER BY ecr.normalized_phone, ecr.external_client_id`,
    params
  );

  const groups = new Map();
  for (const row of duplicateRows.rows) {
    if (!groups.has(row.normalized_phone)) groups.set(row.normalized_phone, []);
    groups.get(row.normalized_phone).push(row);
  }

  const duplicatePhoneGroups = [...groups.entries()].map(([normalizedPhone, records]) => {
    const assessment = summarizeGroup(records);
    return {
      normalizedPhone,
      recordCount: records.length,
      groupRecommendation: assessment.groupRecommendation,
      records: records.map((record) => ({
        goldieClientId: record.external_client_id,
        displayName: record.display_name,
        email: record.email,
        phone: record.phone,
        secondaryPhone: record.secondary_phone,
      })),
      comparisons: assessment.comparisons,
    };
  });

  const canonicalRows = await pool.query(
    `SELECT q.id AS queue_id, er.import_batch_id, er.external_id AS goldie_client_id,
            ecr.display_name AS goldie_name, ecr.email AS goldie_email,
            ecr.normalized_phone, q.candidate_client_id,
            cl.display_name AS canonical_name
     FROM client_reconciliation_queue q
     JOIN external_records er ON er.id=q.external_record_id
     JOIN external_client_records ecr ON ecr.external_record_id=er.id
     LEFT JOIN clients cl ON cl.id=q.candidate_client_id
     WHERE er.source='goldie' AND er.entity_type='client'
       ${batchId ? "AND er.import_batch_id=$1" : ""}
       AND q.reason='phone_match_name_requires_review'
     ORDER BY q.id`,
    params
  );

  const existingClientCandidates = canonicalRows.rows.map((row) => {
    const similarity = nameSimilarity(row.goldie_name, row.canonical_name);
    const tokens = tokenSimilarity(row.goldie_name, row.canonical_name);
    let recommendation = "manual_review";
    let confidence = 0.6;
    if (similarity >= 0.92 || (similarity >= 0.85 && tokens >= 0.5)) {
      recommendation = "probable_existing_client_match";
      confidence = Math.min(0.95, 0.8 + similarity * 0.12 + tokens * 0.03);
    }
    return {
      queueId: row.queue_id,
      goldieClientId: row.goldie_client_id,
      goldieName: row.goldie_name,
      canonicalClientId: row.candidate_client_id,
      canonicalName: row.canonical_name,
      normalizedPhone: row.normalized_phone,
      nameSimilarity: Number(similarity.toFixed(4)),
      tokenSimilarity: Number(tokens.toFixed(4)),
      recommendation,
      confidence: Number(confidence.toFixed(4)),
    };
  });

  const missingPhone = await pool.query(
    `SELECT q.id AS queue_id, er.external_id AS goldie_client_id, ecr.display_name, ecr.email, ecr.secondary_phone
     FROM client_reconciliation_queue q
     JOIN external_records er ON er.id=q.external_record_id
     JOIN external_client_records ecr ON ecr.external_record_id=er.id
     WHERE er.source='goldie' AND er.entity_type='client'
       ${batchId ? "AND er.import_batch_id=$1" : ""}
       AND q.reason='missing_primary_phone'
     ORDER BY q.id`,
    params
  );

  const groupSummary = duplicatePhoneGroups.reduce((acc, group) => {
    acc[group.groupRecommendation] = (acc[group.groupRecommendation] || 0) + 1;
    return acc;
  }, {});

  return {
    safety: {
      mode: "recommendation_only",
      writesPerformed: false,
      note: "No client creation, merges, queue updates, or reconciliation decisions are performed by this endpoint.",
    },
    batchId: batchId || null,
    summary: {
      duplicatePhoneGroups: duplicatePhoneGroups.length,
      duplicateGroupRecommendations: groupSummary,
      existingClientCandidates: existingClientCandidates.length,
      missingPrimaryPhone: missingPhone.rows.length,
    },
    duplicatePhoneGroups,
    existingClientCandidates,
    missingPhoneCases: missingPhone.rows,
  };
}

module.exports = {
  getRecommendationReport,
  normalizeText,
  nameSimilarity,
  tokenSimilarity,
};
