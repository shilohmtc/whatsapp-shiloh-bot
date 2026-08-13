const { pool } = require('../db/pool');

let schemaReady = false;

async function ensureRecoveryTable(db = pool) {
  if (db === pool && schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS client_booking_calendar_write_attempts (
      id BIGSERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      calendar_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      appointment_id BIGINT NOT NULL,
      staff_name TEXT,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reconciled_at TIMESTAMPTZ,
      resolution TEXT,
      last_error TEXT,
      UNIQUE (provider, calendar_id, event_id)
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_client_booking_calendar_write_attempts_pending
      ON client_booking_calendar_write_attempts(provider, id)
      WHERE reconciled_at IS NULL
  `);

  if (db === pool) schemaReady = true;
}

function compactError(error) {
  return String(error?.message || error || 'unknown calendar reconciliation error').slice(0, 500);
}

async function markReconciled(db, id, resolution) {
  await db.query(`
    UPDATE client_booking_calendar_write_attempts
       SET reconciled_at = NOW(), resolution = $2, last_error = NULL
     WHERE id = $1
  `, [id, resolution]);
}

async function reconcilePendingCalendarWrites({
  provider,
  currentAppointmentId,
  cancelEvent,
  db = pool,
}) {
  if (!provider) throw new Error('provider is required for calendar write reconciliation.');
  if (typeof cancelEvent !== 'function') throw new Error('cancelEvent is required for calendar write reconciliation.');

  await ensureRecoveryTable(db);
  const pending = await db.query(`
    SELECT id, provider, calendar_id, event_id, appointment_id
      FROM client_booking_calendar_write_attempts
     WHERE provider = $1
       AND reconciled_at IS NULL
       AND appointment_id <> $2
     ORDER BY id
     LIMIT 100
  `, [provider, currentAppointmentId]);

  let reconciled = 0;
  for (const attempt of pending.rows) {
    const canonical = await db.query(
      'SELECT 1 FROM appointments WHERE id = $1 LIMIT 1',
      [attempt.appointment_id]
    );

    if (canonical.rowCount > 0) {
      await markReconciled(db, attempt.id, 'canonical_appointment_exists');
      reconciled += 1;
      continue;
    }

    try {
      await cancelEvent(attempt.event_id, attempt.calendar_id);
      await markReconciled(db, attempt.id, 'rolled_back_attempt_cleaned');
      reconciled += 1;
    } catch (error) {
      await db.query(`
        UPDATE client_booking_calendar_write_attempts
           SET last_error = $2
         WHERE id = $1
      `, [attempt.id, compactError(error)]);
      const blocked = new Error('A prior Google Calendar write is still uncertain, so this booking cannot safely create another calendar event yet.');
      blocked.code = 'CALENDAR_RECONCILIATION_PENDING';
      blocked.cause = error;
      throw blocked;
    }
  }

  return { reconciled };
}

async function recordCalendarWriteAttempt({
  provider,
  calendarId,
  eventId,
  appointmentId,
  staffName = null,
  startsAt = null,
  endsAt = null,
  db = pool,
}) {
  await ensureRecoveryTable(db);
  await db.query(`
    INSERT INTO client_booking_calendar_write_attempts
      (provider, calendar_id, event_id, appointment_id, staff_name, starts_at, ends_at, attempted_at, reconciled_at, resolution, last_error)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NULL, NULL, NULL)
    ON CONFLICT (provider, calendar_id, event_id) DO UPDATE SET
      appointment_id = EXCLUDED.appointment_id,
      staff_name = EXCLUDED.staff_name,
      starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at,
      attempted_at = NOW(),
      reconciled_at = NULL,
      resolution = NULL,
      last_error = NULL
  `, [provider, calendarId, eventId, appointmentId, staffName, startsAt, endsAt]);
  return { provider, calendarId, eventId, appointmentId };
}

async function prepareCalendarWrite(args) {
  await reconcilePendingCalendarWrites({
    provider: args.provider,
    currentAppointmentId: args.appointmentId,
    cancelEvent: args.cancelEvent,
    db: args.db || pool,
  });
  return recordCalendarWriteAttempt(args);
}

module.exports = {
  ensureRecoveryTable,
  reconcilePendingCalendarWrites,
  recordCalendarWriteAttempt,
  prepareCalendarWrite,
};
