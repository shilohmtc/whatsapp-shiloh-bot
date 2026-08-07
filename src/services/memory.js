const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

let initialized = false;

async function ensureTable() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversation_sessions (
      phone VARCHAR(32) PRIMARY KEY,
      response_id TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  initialized = true;
}

async function getSession(phone) {
  await ensureTable();

  const result = await pool.query(
    "SELECT response_id FROM conversation_sessions WHERE phone = $1",
    [phone]
  );

  return result.rows[0]?.response_id;
}

async function saveSession(phone, responseId) {
  await ensureTable();

  await pool.query(
    `
      INSERT INTO conversation_sessions (phone, response_id, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (phone)
      DO UPDATE SET
        response_id = EXCLUDED.response_id,
        updated_at = NOW()
    `,
    [phone, responseId]
  );
}

async function clearSession(phone) {
  await ensureTable();

  await pool.query(
    "DELETE FROM conversation_sessions WHERE phone = $1",
    [phone]
  );
}

module.exports = {
  getSession,
  saveSession,
  clearSession,
};
