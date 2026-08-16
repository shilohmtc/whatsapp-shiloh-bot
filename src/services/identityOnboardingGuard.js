const { pool } = require("../db/pool");

function normalizePhone(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

function cleanName(text = "") {
  return String(text)
    .trim()
    .replace(/^my name is\s+/i, "")
    .replace(/^i am\s+/i, "")
    .replace(/^i'm\s+/i, "")
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ");
}

function comparableName(value = "") {
  return cleanName(value).toLocaleLowerCase("en-ZA");
}

const NON_IDENTITY_NAME_PREFIXES = new Set(["pa", "mr", "mrs", "ms", "miss", "dr"]);
function identityNameTokens(value = "") {
  const normalized = comparableName(value)
    .replace(/[^a-z' -]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (normalized.length > 1 && NON_IDENTITY_NAME_PREFIXES.has(normalized[0])) normalized.shift();
  return normalized;
}

function namesCompatible(supplied, expected) {
  const suppliedExact = comparableName(supplied);
  const expectedExact = comparableName(expected);
  if (!suppliedExact || !expectedExact) return false;
  if (suppliedExact === expectedExact) return true;
  const suppliedTokens = identityNameTokens(supplied);
  const expectedTokens = identityNameTokens(expected);
  if (!suppliedTokens.length || !expectedTokens.length) return false;
  return suppliedTokens.join(" ") === expectedTokens.join(" ");
}

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function expandTwoDigitYear(value, now = new Date()) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 0) return null;
  if (year >= 100) return year;
  const currentTwoDigits = now.getUTCFullYear() % 100;
  return year <= currentTwoDigits ? 2000 + year : 1900 + year;
}

function canonicalDate(year, month, day, now = new Date()) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const oldest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
  if (date > today || date < oldest) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseNaturalDateOfBirth(text = "", now = new Date()) {
  const source = String(text || "").trim();
  let match = source.match(/\b(\d{1,2})\s+([A-Za-z]+),?\s+(\d{2}|\d{4})\b/i);
  if (match) {
    const month = MONTHS[match[2].toLowerCase()];
    const year = expandTwoDigitYear(match[3], now);
    if (month && year) return canonicalDate(year, month, Number(match[1]), now);
  }
  match = source.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})\b/);
  if (match) {
    const year = expandTwoDigitYear(match[3], now);
    if (year) return canonicalDate(year, Number(match[2]), Number(match[1]), now);
  }
  return null;
}

function extractGender(text = "") {
  const match = String(text || "").match(/\b(prefer not to (?:say|answer)|non[- ]?binary|female|woman|male|man|other)\b/i);
  if (!match) return null;
  const value = match[0].toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (["female", "woman"].includes(value)) return "female";
  if (["male", "man"].includes(value)) return "male";
  if (["non binary", "nonbinary"].includes(value)) return "non-binary";
  if (value === "other") return "other";
  if (["prefer not to say", "prefer not to answer"].includes(value)) return "prefer_not_to_say";
  return null;
}

async function findImportedUnverifiedClient(phone) {
  const key = normalizePhone(phone);
  const result = await pool.query(
    `SELECT DISTINCT c.id, c.display_name, c.date_of_birth,
            c.custom_attributes->>'gender' AS gender,
            cc.id AS contact_id, cc.contact_type
       FROM clients c
       JOIN client_contacts cc ON cc.client_id = c.id
      WHERE cc.normalized_value = $1
        AND cc.contact_type IN ('mobile','whatsapp')
        AND c.status = 'active'
      ORDER BY c.id`,
    [key]
  );
  const clientIds = [...new Set(result.rows.map((row) => String(row.id)))];
  if (clientIds.length !== 1) return clientIds.length > 1 ? { status: "ambiguous" } : { status: "none" };
  const rows = result.rows.filter((row) => String(row.id) === clientIds[0]);
  if (rows.some((row) => row.contact_type === "whatsapp")) return { status: "verified" };
  const client = rows[0];
  if (!client || !client.contact_id) return { status: "none" };
  const source = await pool.query(`SELECT source FROM clients WHERE id=$1`, [client.id]);
  if (source.rows[0]?.source !== "goldie_import") return { status: "not_imported" };
  return { status: "claim_required", client };
}

async function startImportedClientClaim(phone, client) {
  const key = normalizePhone(phone);
  await pool.query(
    `INSERT INTO client_onboarding_sessions
       (phone, client_id, state, pending_name, pending_contact, pending_date_of_birth, pending_gender, booking_requested, updated_at)
     VALUES ($1,$2,'collect_name',NULL,$1,$3,$4,TRUE,NOW())
     ON CONFLICT (phone) DO UPDATE SET
       client_id=EXCLUDED.client_id,
       state='collect_name',
       pending_name=NULL,
       pending_contact=EXCLUDED.pending_contact,
       pending_date_of_birth=EXCLUDED.pending_date_of_birth,
       pending_gender=EXCLUDED.pending_gender,
       booking_requested=TRUE,
       updated_at=NOW()`,
    [key, client.id, client.date_of_birth || null, client.gender || null]
  );
}

async function forceMatchedClientNameConfirmation(phone, clientId) {
  const key = normalizePhone(phone);
  const result = await pool.query(
    `UPDATE client_onboarding_sessions
        SET state = 'collect_name', pending_name = NULL, updated_at = NOW()
      WHERE phone = $1 AND client_id = $2
      RETURNING phone, client_id, state`,
    [key, clientId]
  );
  return result.rowCount === 1;
}

async function guardActiveNameConfirmation(phone, text) {
  const key = normalizePhone(phone);
  const sessionResult = await pool.query(
    `SELECT s.client_id, s.state, s.pending_date_of_birth, s.pending_gender,
            c.display_name
       FROM client_onboarding_sessions s
       JOIN clients c ON c.id = s.client_id
      WHERE s.phone = $1
        AND s.client_id IS NOT NULL`,
    [key]
  );

  if (sessionResult.rowCount === 0) {
    const imported = await findImportedUnverifiedClient(phone);
    if (imported.status === "ambiguous") {
      return {
        handled: true,
        reply: "I found more than one possible Shiloh client profile for this number, so I won't link WhatsApp automatically. Please contact the clinic team so we can verify the correct profile safely.",
      };
    }
    if (imported.status === "claim_required") {
      await startImportedClientClaim(phone, imported.client);
      return {
        handled: true,
        reply: "Hi 👋 It looks like this number may be linked to an existing Shiloh client profile. Before I link WhatsApp to that profile, please confirm your name.",
      };
    }
    return { handled: false };
  }

  if (sessionResult.rowCount !== 1) {
    return {
      handled: true,
      reply: "I found an identity conflict for this WhatsApp number, so I won't update any client record automatically. Please contact the clinic team so we can verify the correct profile safely.",
    };
  }

  const client = sessionResult.rows[0];
  if (client.state === "complete") return { handled: false };

  if (client.state === "collect_name") {
    if (!namesCompatible(text, client.display_name)) {
      return {
        handled: true,
        reply: "I couldn't safely match that name to the existing client profile. I won't change or merge any client records automatically. Please send the full name as the clinic knows it, or contact the clinic team so we can verify the profile safely.",
      };
    }

    await pool.query(
      `UPDATE client_onboarding_sessions
          SET pending_name=$3, updated_at=NOW()
        WHERE phone=$1 AND client_id=$2 AND state='collect_name'`,
      [key, client.client_id, client.display_name]
    );
    return { handled: false, identityNameVerified: true };
  }

  const naturalDob = parseNaturalDateOfBirth(text);
  const gender = extractGender(text);
  if (naturalDob || gender) {
    await pool.query(
      `UPDATE client_onboarding_sessions
          SET pending_date_of_birth=COALESCE($3::date,pending_date_of_birth),
              pending_gender=COALESCE($4,pending_gender),
              updated_at=NOW()
        WHERE phone=$1 AND client_id=$2 AND state <> 'complete'`,
      [key, client.client_id, naturalDob, gender]
    );
  }
  return { handled: false };
}

module.exports = {
  forceMatchedClientNameConfirmation,
  guardActiveNameConfirmation,
  namesCompatible,
  parseNaturalDateOfBirth,
  expandTwoDigitYear,
};
