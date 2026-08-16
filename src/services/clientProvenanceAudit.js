const { pool } = require('../db/pool');

function parseIds(value = '') {
  return [...new Set(String(value).split(',').map((v) => Number(v.trim())).filter((v) => Number.isInteger(v) && v > 0))];
}

async function getClientProvenance(ids) {
  if (!ids.length) return [];
  const result = await pool.query(`
    SELECT c.id, c.source, c.status, c.created_at, c.updated_at,
      COUNT(DISTINCT cc.id)::int AS contacts,
      COUNT(DISTINCT CASE WHEN cc.contact_type='whatsapp' THEN cc.id END)::int AS whatsapp_contacts,
      COUNT(DISTINCT CASE WHEN cc.verified_at IS NOT NULL THEN cc.id END)::int AS verified_contacts,
      COUNT(DISTINCT a.id)::int AS appointments,
      COUNT(DISTINCT CASE WHEN a.starts_at >= NOW() AND a.status NOT IN ('cancelled','no_show') THEN a.id END)::int AS future_appointments,
      COALESCE(bool_or(cos.state='complete'), false) AS onboarding_complete,
      array_remove(array_agg(DISTINCT cos.state), NULL) AS onboarding_states,
      COUNT(DISTINCT er.id)::int AS external_records,
      array_remove(array_agg(DISTINCT er.match_method), NULL) AS external_match_methods,
      array_remove(array_agg(DISTINCT crh.action), NULL) AS reconciliation_actions,
      array_remove(array_agg(DISTINCT crh.method), NULL) AS reconciliation_methods
    FROM clients c
    LEFT JOIN client_contacts cc ON cc.client_id=c.id
    LEFT JOIN appointments a ON a.client_id=c.id
    LEFT JOIN client_onboarding_sessions cos ON cos.client_id=c.id
    LEFT JOIN external_records er ON er.shiloh_entity_type='client' AND er.shiloh_entity_id=c.id
    LEFT JOIN client_reconciliation_history crh ON crh.client_id=c.id
    WHERE c.id = ANY($1::bigint[])
    GROUP BY c.id,c.source,c.status,c.created_at,c.updated_at
    ORDER BY c.id
  `, [ids]);
  return result.rows;
}

async function getSimilaritySummary() {
  const sources = await pool.query(`
    SELECT source, status, COUNT(*)::int AS clients,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM client_onboarding_sessions cos WHERE cos.client_id=c.id AND cos.state='complete'))::int AS onboarding_complete,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM client_contacts cc WHERE cc.client_id=c.id AND cc.contact_type='whatsapp'))::int AS with_whatsapp,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.client_id=c.id))::int AS with_appointments
    FROM clients c GROUP BY source,status ORDER BY source,status
  `);
  const suspicious = await pool.query(`
    SELECT c.source, COUNT(*)::int AS clients
    FROM clients c
    WHERE c.status='active'
      AND NOT EXISTS (SELECT 1 FROM client_contacts cc WHERE cc.client_id=c.id)
      AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.client_id=c.id)
      AND NOT EXISTS (SELECT 1 FROM client_onboarding_sessions cos WHERE cos.client_id=c.id AND cos.state='complete')
    GROUP BY c.source ORDER BY c.source
  `);
  return { sourceSummary: sources.rows, activeNoContactNoAppointmentNoCompletedOnboarding: suspicious.rows };
}

async function runConfiguredClientProvenanceAudit(logger = console) {
  const ids = parseIds(process.env.CRM_PROVENANCE_AUDIT_IDS);
  if (!ids.length) return null;
  const clients = await getClientProvenance(ids);
  const similarity = await getSimilaritySummary();
  logger.info?.({ crmProvenanceAudit: { requestedIds: ids, clients, similarity } }, 'Read-only CRM provenance audit completed');
  return { clients, similarity };
}

module.exports = { parseIds, getClientProvenance, getSimilaritySummary, runConfiguredClientProvenanceAudit };
