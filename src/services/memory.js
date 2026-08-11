const { pool } = require("../db/pool");
const logger = require("../lib/logger");

const DEFAULT_SESSION_TTL_HOURS = 24;
const MIN_SESSION_TTL_HOURS = 1;
const MAX_SESSION_TTL_HOURS = 168;
const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let initialized = false;
let cleanupTimer = null;

function normalizeSessionTtlHours(value = process.env.CONVERSATION_SESSION_TTL_HOURS) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SESSION_TTL_HOURS;
  return Math.max(MIN_SESSION_TTL_HOURS, Math.min(MAX_SESSION_TTL_HOURS, Math.floor(parsed)));
}

function isSessionFresh(updatedAt, nowMs = Date.now(), ttlHours = normalizeSessionTtlHours()) {
  const updatedMs = new Date(updatedAt).getTime();
  if (!Number.isFinite(updatedMs)) return false;
  return updatedMs >= nowMs - ttlHours * 60 * 60 * 1000;
}

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
      "SELECT response_id, updated_at FROM conversation_sessions WHERE phone = $1",
      [phone]
    );

    const session = result.rows[0];
    if (!session) return undefined;

    if (!isSessionFresh(session.updated_at)) {
      await pool.query("DELETE FROM conversation_sessions WHERE phone = $1", [phone]);
      return undefined;
    }

    return session.response_id;
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

async function cleanupExpiredSessions() {
  try {
    await ensureTable();
    const ttlHours = normalizeSessionTtlHours();
    const result = await pool.query(
      `DELETE FROM conversation_sessions
        WHERE updated_at < NOW() - make_interval(hours => $1::int)`,
      [ttlHours]
    );
    if (result.rowCount > 0) {
      logger.info({ expiredSessionCount: result.rowCount, ttlHours }, "Expired stale conversation sessions");
    }
    return result.rowCount;
  } catch (error) {
    logger.error({ err: error }, "failed to expire stale conversation sessions");
    return 0;
  }
}

function startConversationSessionCleanupScheduler() {
  if (cleanupTimer) return cleanupTimer;

  cleanupExpiredSessions();
  cleanupTimer = setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
  return cleanupTimer;
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
  cleanupExpiredSessions,
  startConversationSessionCleanupScheduler,
  normalizeSessionTtlHours,
  isSessionFresh,
  checkDatabase,
  DEFAULT_SESSION_TTL_HOURS,
  MAX_SESSION_TTL_HOURS,
};
