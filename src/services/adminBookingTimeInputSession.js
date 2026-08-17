const { pool } = require('../db/pool');

const SESSION_TTL_MS = 30 * 60 * 1000;
let initialized = false;

async function ensureTable() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_booking_time_input_sessions (
      phone VARCHAR(32) PRIMARY KEY,
      appointment_id BIGINT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_booking_time_input_sessions_expires_at
      ON admin_booking_time_input_sessions (expires_at)
  `);
  initialized = true;
}

function key(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function saveAdminBookingTimeInputSession(phone, appointmentId) {
  await ensureTable();
  const normalized = key(phone);
  const id = Number(appointmentId);
  if (!normalized || !Number.isInteger(id) || id <= 0) return null;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(`
    INSERT INTO admin_booking_time_input_sessions
      (phone, appointment_id, expires_at, updated_at)
    VALUES ($1,$2,$3,NOW())
    ON CONFLICT (phone) DO UPDATE SET
      appointment_id=EXCLUDED.appointment_id,
      expires_at=EXCLUDED.expires_at,
      updated_at=NOW()
  `, [normalized, id, expiresAt]);
  return { appointmentId: id, expiresAt };
}

async function loadAdminBookingTimeInputSession(phone) {
  await ensureTable();
  const normalized = key(phone);
  if (!normalized) return null;
  await pool.query(`DELETE FROM admin_booking_time_input_sessions WHERE phone=$1 AND expires_at<=NOW()`, [normalized]);
  const r = await pool.query(`
    SELECT appointment_id
      FROM admin_booking_time_input_sessions
     WHERE phone=$1 AND expires_at>NOW()
  `, [normalized]);
  return r.rows[0] ? { appointmentId: Number(r.rows[0].appointment_id) } : null;
}

async function clearAdminBookingTimeInputSession(phone) {
  await ensureTable();
  const normalized = key(phone);
  if (!normalized) return;
  await pool.query(`DELETE FROM admin_booking_time_input_sessions WHERE phone=$1`, [normalized]);
}

module.exports = {
  SESSION_TTL_MS,
  saveAdminBookingTimeInputSession,
  loadAdminBookingTimeInputSession,
  clearAdminBookingTimeInputSession,
};
