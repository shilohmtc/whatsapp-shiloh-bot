const { pool } = require("../db/pool");
const { normalizeText, nameSimilarity, tokenSimilarity } = require("./reconciliationRecommendations");

function splitClientNames(value = "") {
  return String(value || "")
    .split(/\s*(?:,|\band\b|&|\+)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function appointmentNameMatches(sourceName, appointmentClients) {
  const source = normalizeText(sourceName);
  if (!source) return false;
  const parts = splitClientNames(appointmentClients);
  return parts.some((part) => normalizeText(part) === source);
}

async function getAppointmentIdentityEvidence({ clientBatchId = "1", appointmentBatchId = "2" } = {}) {
  const held = await pool.query(
    `SELECT q.id AS queue_id, q.reason, q.status, q.candidate_client_id,
            er.id AS external_record_id, er.external_id AS goldie_client_id,
            ecr.display_name, ecr.email, ecr.normalized_phone, ecr.secondary_phone
     FROM client_reconciliation_queue q
     JOIN external_records er ON er.id=q.external_record_id
     JOIN external_client_records ecr ON ecr.external_record_id=er.id
     WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
       AND q.status='needs_review'
     ORDER BY q.reason, ecr.normalized_phone NULLS LAST, q.id`,
    [clientBatchId]
  );

  const appointmentsResult = await pool.query(
    `SELECT external_id, source_payload
     FROM external_records
     WHERE source='goldie' AND entity_type='appointment' AND import_batch_id=$1
     ORDER BY id`,
    [appointmentBatchId]
  );

  const appointments = appointmentsResult.rows.map((row) => ({
    externalId: row.external_id,
    payload: row.source_payload || {},
    clientNames: splitClientNames(row.source_payload?.Clients || ""),
  }));

  const cases = held.rows.map((row) => {
    const exactAppointments = appointments.filter((appointment) =>
      appointmentNameMatches(row.display_name, appointment.payload?.Clients)
    );

    const nearAppointments = appointments.filter((appointment) => {
      if (appointmentNameMatches(row.display_name, appointment.payload?.Clients)) return false;
      return appointment.clientNames.some((name) => {
        const sim = nameSimilarity(row.display_name, name);
        const tokens = tokenSimilarity(row.display_name, name);
        return sim >= 0.9 || (sim >= 0.82 && tokens >= 0.5);
      });
    });

    return {
      queueId: row.queue_id,
      goldieClientId: row.goldie_client_id,
      displayName: row.display_name,
      reason: row.reason,
      normalizedPhone: row.normalized_phone,
      candidateClientId: row.candidate_client_id,
      exactAppointmentCount: exactAppointments.length,
      nearAppointmentCount: nearAppointments.length,
      recentExactAppointments: exactAppointments.slice(-5).map((appointment) => ({
        date: appointment.payload?.Date || null,
        startTime: appointment.payload?.["Start Time"] || null,
        status: appointment.payload?.Status || null,
        services: appointment.payload?.Services || null,
        staff: appointment.payload?.Staff || null,
        clients: appointment.payload?.Clients || null,
      })),
    };
  });

  const duplicateGroups = new Map();
  for (const item of cases.filter((item) => item.reason === "duplicate_goldie_primary_phone" && item.normalizedPhone)) {
    if (!duplicateGroups.has(item.normalizedPhone)) duplicateGroups.set(item.normalizedPhone, []);
    duplicateGroups.get(item.normalizedPhone).push(item);
  }

  const groups = [...duplicateGroups.entries()].map(([normalizedPhone, records]) => {
    const namesWithHistory = records.filter((record) => record.exactAppointmentCount > 0);
    const distinctNormalizedNames = new Set(records.map((record) => normalizeText(record.displayName)).filter(Boolean));
    let appointmentEvidence = "insufficient";
    if (namesWithHistory.length >= 2 && distinctNormalizedNames.size >= 2) appointmentEvidence = "supports_separate_identities";
    else if (namesWithHistory.length === 1 && records.length > 1) appointmentEvidence = "supports_primary_named_identity_but_not_merge";
    else if (records.length > 1 && records.every((record) => record.exactAppointmentCount === 0)) appointmentEvidence = "no_appointment_name_evidence";

    return {
      normalizedPhone,
      recordCount: records.length,
      appointmentEvidence,
      records,
    };
  });

  const summary = {
    heldCases: cases.length,
    duplicatePhoneCases: cases.filter((item) => item.reason === "duplicate_goldie_primary_phone").length,
    missingPrimaryPhoneCases: cases.filter((item) => item.reason === "missing_primary_phone").length,
    existingPhoneNameReviewCases: cases.filter((item) => item.reason === "phone_match_name_requires_review").length,
    casesWithExactAppointmentHistory: cases.filter((item) => item.exactAppointmentCount > 0).length,
    duplicatePhoneGroups: groups.length,
    groupsSupportingSeparateIdentities: groups.filter((group) => group.appointmentEvidence === "supports_separate_identities").length,
    groupsSupportingPrimaryNamedIdentityOnly: groups.filter((group) => group.appointmentEvidence === "supports_primary_named_identity_but_not_merge").length,
    groupsWithoutAppointmentNameEvidence: groups.filter((group) => group.appointmentEvidence === "no_appointment_name_evidence").length,
  };

  return {
    safety: {
      mode: "evidence_only",
      writesPerformed: false,
      note: "Appointment history is used only as identity evidence. No client merges, creations, or appointment canonicalization are performed.",
    },
    clientBatchId: String(clientBatchId),
    appointmentBatchId: String(appointmentBatchId),
    summary,
    groups,
    missingPhoneCases: cases.filter((item) => item.reason === "missing_primary_phone"),
    existingClientReviewCases: cases.filter((item) => item.reason === "phone_match_name_requires_review"),
  };
}

module.exports = { getAppointmentIdentityEvidence };
