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
  const result = await pool.query(
    `SELECT s.client_id, c.display_name
       FROM client_onboarding_sessions s
       JOIN clients c ON c.id = s.client_id
      WHERE s.phone = $1
        AND s.state = 'collect_name'
        AND s.client_id IS NOT NULL`,
    [key]
  );

  if (result.rowCount === 0) return { handled: false };
  if (result.rowCount !== 1) {
    return {
      handled: true,
      reply: "I found an identity conflict for this WhatsApp number, so I won't update any client record automatically. Please contact the clinic team so we can verify the correct profile safely.",
    };
  }

  const client = result.rows[0];
  const supplied = comparableName(text);
  const expected = comparableName(client.display_name);

  if (!supplied || supplied !== expected) {
    return {
      handled: true,
      reply: `The name you provided doesn't match the client profile currently linked to this WhatsApp number. I won't change or merge client records automatically. Please contact the clinic team so we can verify the correct profile safely.`,
    };
  }

  return { handled: false };
}

module.exports = {
  forceMatchedClientNameConfirmation,
  guardActiveNameConfirmation,
};
