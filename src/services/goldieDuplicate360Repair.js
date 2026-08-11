const { pool } = require('../db/pool');
const logger = require('../lib/logger');
const {
  calendarEnabled,
  findBookingEventByAppointmentId,
  cancelBookingEvent,
} = require('./googleBookingCalendar');

const CANCEL_ID = 360;
const KEEP_ID = 551;
const REASON = 'Goldie cutover duplicate repair; canonical appointment #551 retained';

function normalizedList(rows, key) {
  return rows
    .map((row) => String(row[key] || '').trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort();
}

function sameList(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

async function loadSnapshots(db, appointmentId) {
  const [services, staff] = await Promise.all([
    db.query(
      `SELECT service_name_snapshot
         FROM appointment_services
        WHERE appointment_id=$1
        ORDER BY position, service_name_snapshot`,
      [appointmentId]
    ),
    db.query(
      `SELECT staff_name_snapshot
         FROM appointment_staff
        WHERE appointment_id=$1
        ORDER BY position, staff_name_snapshot`,
      [appointmentId]
    ),
  ]);
  return {
    services: normalizedList(services.rows, 'service_name_snapshot'),
    staff: normalizedList(staff.rows, 'staff_name_snapshot'),
  };
}

async function verifyAndCancelDuplicate() {
  const db = await pool.connect();
  let eventId = null;
  let beforeStatus = null;

  try {
    await db.query('BEGIN');
    const result = await db.query(
      `SELECT id, starts_at, ends_at, status, source
         FROM appointments
        WHERE id = ANY($1::bigint[])
        ORDER BY id
        FOR UPDATE`,
      [[CANCEL_ID, KEEP_ID]]
    );

    if (result.rowCount !== 2) {
      throw new Error(`Expected appointments #${CANCEL_ID} and #${KEEP_ID}; found ${result.rowCount}.`);
    }

    const cancelRow = result.rows.find((row) => Number(row.id) === CANCEL_ID);
    const keepRow = result.rows.find((row) => Number(row.id) === KEEP_ID);
    if (!cancelRow || !keepRow) throw new Error('Expected duplicate pair is not present.');
    if (keepRow.status === 'cancelled') throw new Error(`#${KEEP_ID} is cancelled; refusing duplicate repair.`);

    const [cancelSnapshots, keepSnapshots] = await Promise.all([
      loadSnapshots(db, CANCEL_ID),
      loadSnapshots(db, KEEP_ID),
    ]);

    const sameTimes =
      new Date(cancelRow.starts_at).getTime() === new Date(keepRow.starts_at).getTime() &&
      new Date(cancelRow.ends_at).getTime() === new Date(keepRow.ends_at).getTime();
    const sameServices = sameList(cancelSnapshots.services, keepSnapshots.services);
    const sameStaff = sameList(cancelSnapshots.staff, keepSnapshots.staff);

    if (!sameTimes || !sameServices || !sameStaff) {
      throw new Error('Appointments #360/#551 no longer match on time, service and staff; refusing repair.');
    }
    if (String(cancelRow.source) !== 'goldie' || String(keepRow.source) !== 'goldie_import') {
      throw new Error(`Unexpected sources for #360/#551 (${cancelRow.source}/${keepRow.source}); refusing repair.`);
    }

    if (cancelRow.status === 'cancelled') {
      await db.query('ROLLBACK');
      return {
        status: 'already_cancelled',
        cancelledAppointmentId: CANCEL_ID,
        keptAppointmentId: KEEP_ID,
        writesPerformed: false,
      };
    }

    beforeStatus = cancelRow.status;
    const mapping = await db.query(
      `SELECT event_id
         FROM appointment_calendar_events
        WHERE appointment_id=$1 AND provider='google_calendar'
        LIMIT 1`,
      [CANCEL_ID]
    );
    eventId = mapping.rows[0]?.event_id || null;

    const updated = await db.query(
      `UPDATE appointments
          SET status='cancelled', updated_at=NOW()
        WHERE id=$1 AND status <> 'cancelled'
        RETURNING id, status`,
      [CANCEL_ID]
    );
    if (updated.rowCount !== 1) throw new Error(`#${CANCEL_ID} was not cancelled.`);

    await db.query(
      `INSERT INTO appointment_status_history
         (appointment_id, from_status, to_status, changed_by, reason)
       VALUES ($1,$2,'cancelled','system:goldie_cutover',$3)`,
      [CANCEL_ID, beforeStatus, REASON]
    );

    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  let calendar = { enabled: calendarEnabled(), status: 'not_required' };
  if (calendarEnabled()) {
    try {
      if (!eventId) {
        const discovered = await findBookingEventByAppointmentId(CANCEL_ID);
        eventId = discovered?.id || null;
      }
      if (eventId) {
        const cancelled = await cancelBookingEvent(eventId);
        calendar = { enabled: true, status: 'cancelled', eventId, result: cancelled };
        await pool.query(
          `UPDATE appointment_calendar_events
              SET sync_status='cancelled', last_error=NULL, updated_at=NOW()
            WHERE appointment_id=$1 AND provider='google_calendar'`,
          [CANCEL_ID]
        );
      } else {
        calendar = { enabled: true, status: 'no_event' };
      }
    } catch (error) {
      logger.error({ err: error, appointmentId: CANCEL_ID }, 'Goldie duplicate CRM repair succeeded but Calendar cleanup failed');
      calendar = { enabled: true, status: 'error', error: String(error.message || error) };
    }
  }

  return {
    status: 'cancelled',
    cancelledAppointmentId: CANCEL_ID,
    keptAppointmentId: KEEP_ID,
    writesPerformed: true,
    whatsappMessagesSent: 0,
    calendar,
  };
}

async function runGoldieDuplicate360RepairFromEnv() {
  if (String(process.env.RUN_GOLDIE_DUPLICATE_360_REPAIR || '').toLowerCase() !== 'true') {
    return { status: 'disabled', writesPerformed: false };
  }
  const result = await verifyAndCancelDuplicate();
  logger.info({ result }, 'Goldie duplicate #360 repair completed');
  return result;
}

module.exports = {
  verifyAndCancelDuplicate,
  runGoldieDuplicate360RepairFromEnv,
};
