const Module = require('node:module');
const { pool } = require('../db/pool');
const logger = require('../lib/logger');

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function nameTokens(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

async function findCanonicalClientsByNameTokens(query, limit = 10) {
  const tokens = nameTokens(query);
  if (tokens.length < 2) return [];

  const values = [];
  const normalizedName = "(' ' || regexp_replace(lower(COALESCE(c.display_name, '')), '[^[:alnum:]]+', ' ', 'g') || ' ')";
  const predicates = tokens.map((token) => {
    values.push(token);
    return `${normalizedName} LIKE '% ' || $${values.length} || ' %'`;
  });
  values.push(Math.max(1, Math.min(Number(limit) || 10, 10)));
  const limitParam = `$${values.length}`;

  const result = await pool.query(
    `SELECT c.id, c.display_name, c.date_of_birth, c.status, c.source,
       COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', cc.id, 'type', cc.contact_type, 'value', cc.value, 'normalizedValue', cc.normalized_value, 'isPrimary', cc.is_primary, 'verifiedAt', cc.verified_at)) FILTER (WHERE cc.id IS NOT NULL), '[]'::jsonb) AS contacts,
       (SELECT COUNT(*)::int FROM appointments a_count WHERE a_count.client_id = c.id) AS appointment_count,
       (SELECT MAX(a_last.starts_at) FROM appointments a_last WHERE a_last.client_id = c.id AND a_last.starts_at < NOW() AND a_last.status <> 'cancelled') AS last_appointment_at,
       (SELECT MIN(a_next.starts_at) FROM appointments a_next WHERE a_next.client_id = c.id AND a_next.starts_at >= NOW() AND a_next.status <> 'cancelled') AS next_appointment_at
     FROM clients c
     LEFT JOIN client_contacts cc ON cc.client_id = c.id
     WHERE ${predicates.join(' AND ')}
     GROUP BY c.id
     ORDER BY c.display_name NULLS LAST, c.id
     LIMIT ${limitParam}`,
    values
  );
  return result.rows;
}

async function findGoldieIdentityBridge(query, limit = 10) {
  const tokens = nameTokens(query);
  if (tokens.length < 2) return { matchedClientIds: [], externalCount: 0, statuses: [] };

  const values = [];
  const normalizedName = "(' ' || regexp_replace(lower(COALESCE(ecr.display_name, '')), '[^[:alnum:]]+', ' ', 'g') || ' ')";
  const predicates = tokens.map((token) => {
    values.push(token);
    return `${normalizedName} LIKE '% ' || $${values.length} || ' %'`;
  });
  values.push(Math.max(1, Math.min(Number(limit) || 10, 10)));
  const limitParam = `$${values.length}`;

  const result = await pool.query(
    `SELECT er.id AS external_record_id,
            er.reconciliation_status,
            er.shiloh_entity_id,
            q.status AS queue_status,
            q.reason AS queue_reason,
            q.candidate_client_id
       FROM external_records er
       JOIN external_client_records ecr ON ecr.external_record_id = er.id
       LEFT JOIN client_reconciliation_queue q ON q.external_record_id = er.id
      WHERE er.source = 'goldie'
        AND er.entity_type = 'client'
        AND ${predicates.join(' AND ')}
      ORDER BY er.id
      LIMIT ${limitParam}`,
    values
  );

  const matchedClientIds = [...new Set(result.rows
    .filter((row) => row.reconciliation_status === 'matched' && row.shiloh_entity_id)
    .map((row) => String(row.shiloh_entity_id)))];
  const statuses = [...new Set(result.rows.map((row) => row.reconciliation_status || row.queue_status || 'unknown'))];
  return { matchedClientIds, externalCount: result.rowCount, statuses };
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  const exported = originalLoad.apply(this, arguments);
  if (typeof request === 'string' && /(?:^|\/)adminClientLookup(?:\.js)?$/.test(request) && exported && typeof exported.findClients === 'function' && !exported.__tokenNameLookupPatched) {
    const originalFindClients = exported.findClients;
    exported.findClients = async function findClientsWithTokenFallback(query, limit = 10) {
      const result = await originalFindClients(query, limit);
      if (result?.clients?.length || result?.queryType !== 'name') return result;

      const tokenClients = await findCanonicalClientsByNameTokens(query, limit);
      if (tokenClients.length) return { ...result, queryType: 'name_tokens', clients: tokenClients };

      const bridge = await findGoldieIdentityBridge(query, limit);
      logger.info({
        tokenCount: nameTokens(query).length,
        externalGoldieMatches: bridge.externalCount,
        matchedCanonicalIds: bridge.matchedClientIds.length,
        reconciliationStatuses: bridge.statuses,
      }, 'Admin booking client lookup checked reconciled Goldie identity bridge');

      if (bridge.matchedClientIds.length === 1 && typeof exported.getClientDetails === 'function') {
        const client = await exported.getClientDetails(bridge.matchedClientIds[0]);
        if (client) return { ...result, queryType: 'goldie_reconciled_identity', clients: [client] };
      }

      if (bridge.matchedClientIds.length > 1 && typeof exported.getClientDetails === 'function') {
        const clients = (await Promise.all(bridge.matchedClientIds.slice(0, limit).map((id) => exported.getClientDetails(id)))).filter(Boolean);
        if (clients.length) return { ...result, queryType: 'goldie_reconciled_ambiguous', clients };
      }

      return { ...result, externalGoldieMatches: bridge.externalCount, externalReconciliationStatuses: bridge.statuses };
    };
    Object.defineProperty(exported, '__tokenNameLookupPatched', { value: true });
  }
  return exported;
};

module.exports = { nameTokens, findCanonicalClientsByNameTokens, findGoldieIdentityBridge };
