const { pool } = require("../db/pool");
const { normalizePhone } = require("./clientIdentityOnboarding");

function cleanQuery(value = "") {
  return String(value).trim().replace(/\s+/g, " ").slice(0, 120);
}

function isPhoneLike(value = "") {
  const digits = normalizePhone(value);
  return digits.length >= 4 && /^[+()\-\s0-9]+$/.test(String(value).trim());
}

function phoneCandidates(value = "") {
  const digits = normalizePhone(value);
  const candidates = new Set([digits]);
  if (/^0\d{9}$/.test(digits)) candidates.add(`27${digits.slice(1)}`);
  if (/^27\d{9}$/.test(digits)) candidates.add(`0${digits.slice(2)}`);
  return [...candidates].filter(Boolean);
}

function maskContact(value = "") {
  const digits = normalizePhone(value);
  if (digits.length >= 4) return `ending in ${digits.slice(-4)}`;
  return "contact on file";
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function contactLabel(contact = {}) {
  const type = String(contact.type || "contact").trim().toLowerCase();
  if (["whatsapp", "mobile", "phone", "telephone"].includes(type)) return "Mobile";
  if (type === "email") return "Email";
  return type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : "Contact";
}

const ACTIVE_NAME_SELECT = `(
  SELECT authority.current_name
    FROM client_facing_name_authorities authority
   WHERE authority.client_id=c.id
     AND authority.revoked_at IS NULL
   ORDER BY authority.promoted_at DESC,authority.id DESC
   LIMIT 1
) AS client_facing_name`;

async function getClientDetails(clientId) {
  if (!/^\d+$/.test(String(clientId)) || Number(clientId) <= 0) return null;
  const result = await pool.query(
    `SELECT c.id, c.display_name, c.date_of_birth, c.status, c.source,
       ${ACTIVE_NAME_SELECT},
       COALESCE((SELECT jsonb_agg(jsonb_build_object('name',alias.alias_name,'sourceType',alias.source_type,'sourceKey',alias.source_key) ORDER BY alias.created_at DESC,alias.id DESC) FROM client_name_aliases alias WHERE alias.client_id=c.id),'[]'::jsonb) AS name_aliases,
       COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', cc.id, 'type', cc.contact_type, 'value', cc.value, 'normalizedValue', cc.normalized_value, 'isPrimary', cc.is_primary, 'verifiedAt', cc.verified_at)) FILTER (WHERE cc.id IS NOT NULL), '[]'::jsonb) AS contacts,
       (SELECT COUNT(*)::int FROM appointments a_count WHERE a_count.client_id = c.id) AS appointment_count,
       (SELECT MAX(a_last.starts_at) FROM appointments a_last WHERE a_last.client_id = c.id AND a_last.starts_at < NOW() AND a_last.status <> 'cancelled') AS last_appointment_at,
       (SELECT MIN(a_next.starts_at) FROM appointments a_next WHERE a_next.client_id = c.id AND a_next.starts_at >= NOW() AND a_next.status <> 'cancelled') AS next_appointment_at
     FROM clients c LEFT JOIN client_contacts cc ON cc.client_id = c.id WHERE c.id = $1 GROUP BY c.id LIMIT 1`,
    [Number(clientId)]
  );
  return result.rows[0] || null;
}

async function findClients(query, limit = 10) {
  const cleaned = cleanQuery(query);
  if (!cleaned) return { queryType: "empty", clients: [] };
  const detailsMatch = cleaned.match(/^details\s+#?(\d+)$/i);
  if (detailsMatch) { const client = await getClientDetails(detailsMatch[1]); return { queryType: "details", clients: client ? [client] : [] }; }
  const phoneSearch = isPhoneLike(cleaned); const values = []; let predicate;
  if (phoneSearch) {
    const digits = normalizePhone(cleaned); const candidates = phoneCandidates(cleaned); values.push(candidates); const candidatesParam = `$${values.length}`;
    if (digits.length >= 9) predicate = `EXISTS (SELECT 1 FROM client_contacts cc_search WHERE cc_search.client_id = c.id AND cc_search.normalized_value = ANY(${candidatesParam}::text[]))`;
    else { values.push(digits); const suffixParam = `$${values.length}`; predicate = `EXISTS (SELECT 1 FROM client_contacts cc_search WHERE cc_search.client_id = c.id AND cc_search.normalized_value IS NOT NULL AND (cc_search.normalized_value = ANY(${candidatesParam}::text[]) OR cc_search.normalized_value LIKE '%' || ${suffixParam}))`; }
  } else {
    values.push(`%${cleaned}%`);
    const nameParam=`$${values.length}`;
    predicate = `(
      EXISTS (
        SELECT 1 FROM client_facing_name_authorities authority_search
         WHERE authority_search.client_id=c.id
           AND authority_search.revoked_at IS NULL
           AND authority_search.current_name ILIKE ${nameParam}
      )
      OR EXISTS (
        SELECT 1 FROM client_name_aliases alias_search
         WHERE alias_search.client_id=c.id
           AND alias_search.alias_name ILIKE ${nameParam}
      )
      OR c.display_name ILIKE ${nameParam}
    )`;
  }
  values.push(Math.max(1, Math.min(Number(limit) || 10, 10))); const limitParam = `$${values.length}`;
  const result = await pool.query(
    `SELECT c.id, c.display_name, c.date_of_birth, c.status, c.source,
       ${ACTIVE_NAME_SELECT},
       COALESCE((SELECT jsonb_agg(jsonb_build_object('name',alias.alias_name,'sourceType',alias.source_type,'sourceKey',alias.source_key) ORDER BY alias.created_at DESC,alias.id DESC) FROM client_name_aliases alias WHERE alias.client_id=c.id),'[]'::jsonb) AS name_aliases,
       COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', cc.id, 'type', cc.contact_type, 'value', cc.value, 'normalizedValue', cc.normalized_value, 'isPrimary', cc.is_primary, 'verifiedAt', cc.verified_at)) FILTER (WHERE cc.id IS NOT NULL), '[]'::jsonb) AS contacts,
       (SELECT COUNT(*)::int FROM appointments a_count WHERE a_count.client_id = c.id) AS appointment_count,
       (SELECT MAX(a_last.starts_at) FROM appointments a_last WHERE a_last.client_id = c.id AND a_last.starts_at < NOW() AND a_last.status <> 'cancelled') AS last_appointment_at,
       (SELECT MIN(a_next.starts_at) FROM appointments a_next WHERE a_next.client_id = c.id AND a_next.starts_at >= NOW() AND a_next.status <> 'cancelled') AS next_appointment_at
     FROM clients c LEFT JOIN client_contacts cc ON cc.client_id = c.id WHERE ${predicate} GROUP BY c.id ORDER BY COALESCE(${ACTIVE_NAME_SELECT.replace(/ AS client_facing_name$/, '')},c.display_name) NULLS LAST, c.id LIMIT ${limitParam}`,
    values
  );
  return { queryType: phoneSearch ? "phone" : "name", clients: result.rows };
}

function staffDisplayName(client) {
  return client?.client_facing_name || client?.display_name || "Unnamed client";
}

function formatClientDetailsReply(client) {
  if (!client) return "That client detail view is unavailable. No client records were changed.";
  const authorityLabel = client.client_facing_name ? "current name" : "search/provenance label";
  const lines = ["Client details", `• ${staffDisplayName(client)} — CRM #${client.id} (${authorityLabel})`, `• Status: ${client.status || "unknown"}`];
  const dob = formatDate(client.date_of_birth); if (dob) lines.push(`• DOB: ${dob}`);
  const aliases=[...new Set((client.name_aliases||[]).map((alias)=>String(alias.name||'').trim()).filter(Boolean).filter((name)=>name!==staffDisplayName(client)))];
  if(aliases.length)lines.push(`• Search aliases: ${aliases.slice(0,5).join(', ')}`);
  const seen = new Set();
  for (const contact of client.contacts || []) { const value = String(contact.value || contact.normalizedValue || "").trim(); if (!value) continue; const line = `• ${contactLabel(contact)}: ${value}`; if (!seen.has(line)) { seen.add(line); lines.push(line); } }
  lines.push(`• Appointments on record: ${client.appointment_count || 0}`);
  const next = formatDateTime(client.next_appointment_at); const last = formatDateTime(client.last_appointment_at); if (next) lines.push(`• Next appointment: ${next}`); if (last) lines.push(`• Last appointment: ${last}`);
  lines.push("", "This is a read-only client detail view. Search/provenance aliases do not establish the current client-facing name, and no client identity or contact records were changed.");
  return lines.join("\n");
}

function formatClientLookupReply(query, clients) {
  const cleaned = cleanQuery(query); const detailsMatch = cleaned.match(/^details\s+#?(\d+)$/i);
  if (!clients.length) { if (detailsMatch) return "That client detail view is unavailable in your authorized scope. No client records were changed."; return `I couldn't find a canonical CRM client matching “${cleaned}”. No client records were changed.`; }
  if (clients.length === 1) return formatClientDetailsReply(clients[0]);
  const lines = [`I found ${clients.length} possible canonical CRM clients matching “${cleaned}”.`, "I won't choose, merge, or promote a client name automatically.", ""];
  for (const client of clients) { const dob = formatDate(client.date_of_birth); const primary = (client.contacts || []).find((contact) => contact.isPrimary) || (client.contacts || [])[0]; const contact = primary ? ` — ${maskContact(primary.normalizedValue || primary.value)}` : ""; const authority=client.client_facing_name?'current name':'search/provenance label'; lines.push(`• CRM #${client.id}: ${staffDisplayName(client)} (${authority})${dob ? ` — DOB ${dob}` : ""}${contact}`); }
  lines.push("", "Refine the name or number to narrow the lookup."); return lines.join("\n");
}

module.exports = { findClients, getClientDetails, formatClientLookupReply, formatClientDetailsReply, staffDisplayName };