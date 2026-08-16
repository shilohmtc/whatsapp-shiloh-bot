const { pool } = require('../db/pool');

const SESSION_TTL_MS = 30 * 60 * 1000;
let initialized = false;

async function ensureAdminMobileBookingSessionTable() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_mobile_booking_flow_sessions (
      phone VARCHAR(32) PRIMARY KEY,
      state JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_mobile_booking_flow_sessions_expires_at
      ON admin_mobile_booking_flow_sessions (expires_at)
  `);
  initialized = true;
}

async function loadAdminMobileBookingSession(phone) {
  await ensureAdminMobileBookingSessionTable();
  const result = await pool.query(
    `DELETE FROM admin_mobile_booking_flow_sessions
      WHERE phone = $1 AND expires_at <= NOW()
      RETURNING phone`,
    [phone]
  );
  if (result.rowCount) return null;
  const active = await pool.query(
    `SELECT state
       FROM admin_mobile_booking_flow_sessions
      WHERE phone = $1
        AND expires_at > NOW()`,
    [phone]
  );
  return active.rows[0]?.state || null;
}

async function saveAdminMobileBookingSession(phone, state) {
  await ensureAdminMobileBookingSessionTable();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `INSERT INTO admin_mobile_booking_flow_sessions
       (phone, state, expires_at, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (phone) DO UPDATE SET
       state = EXCLUDED.state,
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()`,
    [phone, JSON.stringify(state), expiresAt]
  );
  return state;
}

async function clearAdminMobileBookingSession(phone) {
  await ensureAdminMobileBookingSessionTable();
  await pool.query(`DELETE FROM admin_mobile_booking_flow_sessions WHERE phone = $1`, [phone]);
}

module.exports = {
  SESSION_TTL_MS,
  ensureAdminMobileBookingSessionTable,
  loadAdminMobileBookingSession,
  saveAdminMobileBookingSession,
  clearAdminMobileBookingSession,
};
