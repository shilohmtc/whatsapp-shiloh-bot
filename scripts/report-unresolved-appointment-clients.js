require('dotenv').config();

const { pool, closePool } = require('../src/db/pool');
const { normalizeText, nameSimilarity, tokenSimilarity } = require('../src/services/reconciliationRecommendations');

function splitClientNames(value = '') {
  return String(value || '')
    .split(/\s*(?:,|\band\b|&|\+)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function run() {
  const [appointmentsResult, goldieClientsResult, canonicalClientsResult] = await Promise.all([
    pool.query(`
      SELECT er.id, er.external_id, er.source_payload
      FROM external_records er
      WHERE er.source='goldie'
        AND er.entity_type='appointment'
        AND er.import_batch_id='2'
        AND er.reconciliation_status='unmatched'
      ORDER BY er.id
    `),
    pool.query(`
      SELECT er.id AS external_record_id,
             er.external_id AS goldie_client_id,
             er.reconciliation_status,
             er.shiloh_entity_id,
             ecr.display_name,
             ecr.email,
             ecr.normalized_phone,
             ecr.secondary_phone,
             q.id AS queue_id,
             q.status AS queue_status,
             q.reason AS queue_reason,
             q.candidate_client_id
      FROM external_records er
      JOIN external_client_records ecr ON ecr.external_record_id=er.id
      LEFT JOIN client_reconciliation_queue q ON q.external_record_id=er.id
      WHERE er.source='goldie'
        AND er.entity_type='client'
        AND er.import_batch_id='1'
      ORDER BY er.id
    `),
    pool.query(`
      SELECT c.id, c.display_name, c.source,
             COALESCE(json_agg(json_build_object(
               'type', cc.contact_type,
               'value', cc.value,
               'normalizedValue', cc.normalized_value,
               'isPrimary', cc.is_primary
             ) ORDER BY cc.id) FILTER (WHERE cc.id IS NOT NULL), '[]'::json) AS contacts
      FROM clients c
      LEFT JOIN client_contacts cc ON cc.client_id=c.id
      GROUP BY c.id, c.display_name, c.source
      ORDER BY c.id
    `),
  ]);

  const matchedNameMap = new Map();
  for (const row of goldieClientsResult.rows) {
    if (row.reconciliation_status !== 'matched' || !row.shiloh_entity_id) continue;
    const key = normalizeText(row.display_name);
    if (!key) continue;
    if (!matchedNameMap.has(key)) matchedNameMap.set(key, new Set());
    matchedNameMap.get(key).add(String(row.shiloh_entity_id));
  }

  const unresolvedAppointments = [];
  for (const row of appointmentsResult.rows) {
    const payload = row.source_payload || {};
    if (normalizeText(payload.Type) !== 'appointment') continue;
    const names = splitClientNames(payload.Clients);
    if (names.length !== 1) continue;
    const name = names[0];
    const ids = matchedNameMap.get(normalizeText(name));
    if (ids && ids.size === 1) continue;
    unresolvedAppointments.push({
      externalId: row.external_id,
      date: payload.Date || null,
      startTime: payload['Start Time'] || null,
      clientName: name,
      services: payload.Services || null,
      staff: payload.Staff || null,
      price: payload.Price || null,
    });
  }

  const groupsMap = new Map();
  for (const appt of unresolvedAppointments) {
    const key = normalizeText(appt.clientName);
    if (!groupsMap.has(key)) groupsMap.set(key, { normalizedName: key, sourceNames: new Set(), appointments: [] });
    const group = groupsMap.get(key);
    group.sourceNames.add(appt.clientName);
    group.appointments.push(appt);
  }

  const groups = [];
  for (const group of groupsMap.values()) {
    const exactGoldie = goldieClientsResult.rows.filter((row) => normalizeText(row.display_name) === group.normalizedName);
    const exactCanonical = canonicalClientsResult.rows.filter((row) => normalizeText(row.display_name) === group.normalizedName);

    const fuzzyGoldie = goldieClientsResult.rows
      .filter((row) => normalizeText(row.display_name) !== group.normalizedName)
      .map((row) => ({
        row,
        nameSimilarity: nameSimilarity([...group.sourceNames][0], row.display_name),
        tokenSimilarity: tokenSimilarity([...group.sourceNames][0], row.display_name),
      }))
      .filter((item) => item.nameSimilarity >= 0.82 || (item.nameSimilarity >= 0.72 && item.tokenSimilarity >= 0.5))
      .sort((a, b) => (b.nameSimilarity + b.tokenSimilarity) - (a.nameSimilarity + a.tokenSimilarity))
      .slice(0, 5)
      .map((item) => ({
        goldieClientId: item.row.goldie_client_id,
        displayName: item.row.display_name,
        reconciliationStatus: item.row.reconciliation_status,
        shilohEntityId: item.row.shiloh_entity_id,
        queueId: item.row.queue_id,
        queueStatus: item.row.queue_status,
        queueReason: item.row.queue_reason,
        candidateClientId: item.row.candidate_client_id,
        nameSimilarity: Number(item.nameSimilarity.toFixed(3)),
        tokenSimilarity: Number(item.tokenSimilarity.toFixed(3)),
      }));

    let classification = 'no_exact_identity_record';
    if (exactGoldie.length > 1) classification = 'multiple_exact_goldie_records';
    else if (exactGoldie.length === 1 && exactGoldie[0].reconciliation_status === 'matched' && exactGoldie[0].shiloh_entity_id) classification = 'exact_goldie_already_matched';
    else if (exactGoldie.length === 1 && exactGoldie[0].queue_status === 'needs_review' && exactGoldie[0].candidate_client_id) classification = 'exact_goldie_review_with_candidate';
    else if (exactGoldie.length === 1 && exactGoldie[0].queue_status === 'needs_review') classification = 'exact_goldie_review_no_candidate';
    else if (exactCanonical.length === 1) classification = 'unique_exact_canonical_name_only';
    else if (exactCanonical.length > 1) classification = 'multiple_exact_canonical_names';

    groups.push({
      normalizedName: group.normalizedName,
      sourceNames: [...group.sourceNames],
      appointmentCount: group.appointments.length,
      classification,
      exactGoldie: exactGoldie.map((row) => ({
        goldieClientId: row.goldie_client_id,
        displayName: row.display_name,
        email: row.email,
        normalizedPhone: row.normalized_phone,
        secondaryPhone: row.secondary_phone,
        reconciliationStatus: row.reconciliation_status,
        shilohEntityId: row.shiloh_entity_id,
        queueId: row.queue_id,
        queueStatus: row.queue_status,
        queueReason: row.queue_reason,
        candidateClientId: row.candidate_client_id,
      })),
      exactCanonical: exactCanonical.map((row) => ({
        clientId: String(row.id),
        displayName: row.display_name,
        source: row.source,
        contacts: row.contacts,
      })),
      fuzzyGoldie,
      appointmentSamples: group.appointments.slice(0, 5),
    });
  }

  groups.sort((a, b) => b.appointmentCount - a.appointmentCount || a.normalizedName.localeCompare(b.normalizedName));
  const classificationCounts = groups.reduce((acc, item) => {
    acc[item.classification] = (acc[item.classification] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    report: 'unresolved_appointment_client_evidence',
    mode: 'read_only',
    writesPerformed: false,
    summary: {
      unmatchedAppointmentRows: appointmentsResult.rowCount,
      singleClientRowsWithoutUniqueMatchedGoldieIdentity: unresolvedAppointments.length,
      distinctUnresolvedClientNames: groups.length,
      classificationCounts,
    },
    groups,
    policy: {
      exactNormalizedNameIsEvidenceNotAutomaticApproval: true,
      sharedPhoneNeverJustifiesMerge: true,
      ambiguousOrMultipleExactRecordsRemainUnresolved: true,
      noClientOrAppointmentWrites: true,
    },
  }));
}

run()
  .catch((error) => {
    console.error(JSON.stringify({ report: 'unresolved_appointment_client_evidence', error: error.message, stack: error.stack }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
