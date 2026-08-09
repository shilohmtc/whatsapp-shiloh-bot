const { pool } = require("../db/pool");
const { normalizePhone } = require("./clientIdentityOnboarding");

function cleanQuery(value = "") {
  return String(value).trim().replace(/\s+/g, " ").slice(0, 120);
}

function isPhoneLike(value = "") {
  const digits = normalizePhone(value);
  return digits.length >= 4 && /^[+()\-\s0-9]+$/.test(String(value).trim());
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
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function findClients(query, limit = 10) {
  const cleaned = cleanQuery(query);
  if (!cleaned) return { queryType: "empty", clients: [] };

  const phoneSearch = isPhoneLike(cleaned);
  const digits = normalizePhone(cleaned);
  const values = [];
  let predicate;

  if (phoneSearch) {
    values.push(digits);
    const p = `$${values.length}`;
    predicate = `EXISTS (
      SELECT 1
        FROM client_contacts cc_search
       WHERE cc_search.client_id = c.id
         AND cc_search.normalized_value IS NOT NULL
         AND (cc_search.normalized_value = ${p} OR cc_search.normalized_value LIKE '%' || ${p})
    )`;
  } else {
    values.push(`%${cleaned}%`);
    predicate = `c.display_name ILIKE $${values.length}`;
  }

  values.push(Math.max(1, Math.min(Number(limit) || 10, 10)));
  const limitParam = `$${values.length}`;

  const result = await pool.query(
    `SELECT
       c.id,
       c.display_name,
       c.date_of_birth,
       c.status,
       c.source,
       COALESCE(
         jsonb_agg(
           DISTINCT jsonb_build_object(
             'id', cc.id,
             'type', cc.contact_type,
             'value', cc.value,
             'normalizedValue', cc.normalized_value,
             'isPrimary', cc.is_primary,
             'verifiedAt', cc.verified_at
           )
         ) FILTER (WHERE cc.id IS NOT NULL),
         '[]'::jsonb
       ) AS contacts,
       (SELECT COUNT(*)::int FROM appointments a_count WHERE a_count.client_id = c.id) AS appointment_count,
       (SELECT MAX(a_last.starts_at) FROM appointments a_last
         WHERE a_last.client_id = c.id AND a_last.starts_at < NOW() AND a_last.status <> 'cancelled') AS last_appointment_at,
       (SELECT MIN(a_next.starts_at) FROM appointments a_next
         WHERE a_next.client_id = c.id AND a_next.starts_at >= NOW() AND a_next.status <> 'cancelled') AS next_appointment_at
     FROM clients c
     LEFT JOIN client_contacts cc ON cc.client_id = c.id
     WHERE ${predicate}
     GROUP BY c.id
     ORDER BY
       CASE WHEN LOWER(c.display_name) = LOWER($1) THEN 0 ELSE 1 END,
       c.display_name NULLS LAST,
       c.id
     LIMIT ${limitParam}`,
    values
  );

  return { queryType: phoneSearch ? "phone" : "name", clients: result.rows };
}

function formatClientLookupReply(query, clients) {
  const cleaned = cleanQuery(query);
  if (!clients.length) {
    return `I couldn't find a canonical CRM client matching “${cleaned}”. No client records were changed.`;
  }

  if (clients.length === 1) {
    const client = clients[0];
    const contacts = (client.contacts || []).map((contact) => `${contact.type}: ${maskContact(contact.normalizedValue || contact.value)}`);
    const lines = [
      "Client found",
      `• ${client.display_name || "Unnamed client"} — CRM #${client.id}`,
      `• Status: ${client.status || "unknown"}`,
    ];
    const dob = formatDate(client.date_of_birth);
    if (dob) lines.push(`• DOB: ${dob}`);
    if (contacts.length) lines.push(`• Contact: ${contacts.join(", ")}`);
    lines.push(`• Appointments on record: ${client.appointment_count || 0}`);
    const next = formatDateTime(client.next_appointment_at);
    const last = formatDateTime(client.last_appointment_at);
    if (next) lines.push(`• Next appointment: ${next}`);
    if (last) lines.push(`• Last appointment: ${last}`);
    lines.push("", "This is a read-only lookup. No client identity or contact records were changed.");
    return lines.join("\n");
  }

  const lines = [
    `I found ${clients.length} possible canonical CRM clients matching “${cleaned}”.`,
    "I won't choose or merge a client automatically.",
    "",
  ];
  for (const client of clients) {
    const dob = formatDate(client.date_of_birth);
    const primary = (client.contacts || []).find((contact) => contact.isPrimary) || (client.contacts || [])[0];
    const contact = primary ? ` — ${maskContact(primary.normalizedValue || primary.value)}` : "";
    lines.push(`• CRM #${client.id}: ${client.display_name || "Unnamed client"}${dob ? ` — DOB ${dob}` : ""}${contact}`);
  }
  lines.push("", "Refine the name or number to narrow the lookup.");
  return lines.join("\n");
}

module.exports = { findClients, formatClientLookupReply };
