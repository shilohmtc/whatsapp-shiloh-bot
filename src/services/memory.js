const { Pool } = require("pg");
const logger = require("../lib/logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("error", (error) => {
  logger.error({ err: error }, "unexpected PostgreSQL pool error");
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
  try {
    await ensureTable();

    const result = await pool.query(
      "SELECT response_id FROM conversation_sessions WHERE phone = $1",
      [phone]
    );

    return result.rows[0]?.response_id;
  } catch (error) {
    logger.error({ err: error }, "failed to read conversation session");
    return undefined;
  }
}

async function saveSession(phone, responseId) {
  try {
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

    return true;
  } catch (error) {
    logger.error({ err: error }, "failed to persist conversation session");
    return false;
  }
}

async function clearSession(phone) {
  try {
    await ensureTable();

    await pool.query(
      "DELETE FROM conversation_sessions WHERE phone = $1",
      [phone]
    );

    return true;
  } catch (error) {
    logger.error({ err: error }, "failed to clear conversation session");
    return false;
  }
}

async function checkDatabase() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    logger.error({ err: error }, "database health check failed");
    return false;
  }
}

module.exports = {
  getSession,
  saveSession,
  clearSession,
  checkDatabase,
};
