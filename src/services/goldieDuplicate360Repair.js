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

function sortedIds(rows, key) {
  return rows.map((row) => Number(row[key])).filter(Number.isFinite).sort((a, b) => a - b);
}

function sameList(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

async function loadCanonicalAssignments(db, appointmentId) {
  const services = await db.query(
    `SELECT service_id
       FROM appointment_services
      WHERE appointment_id=$1
      ORDER BY position, service_id`,
    [appointmentId]
  );
  const staff = await db.query(
    `SELECT staff_id
       FROM appointment_staff
      WHERE appointment_id=$1
      ORDER BY position, staff_id`,
    [appointmentId]
  );
  return {
    services: sortedIds(services.rows, 'service_id'),
    staff: sortedIds(staff.rows, 'staff_id'),
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

    const cancelAssignments = await loadCanonicalAssignments(db, CANCEL_ID);
    const keepAssignments = await loadCanonicalAssignments(db, KEEP_ID);

    const sameTimes =
      new Date(cancelRow.starts_at).getTime() === new Date(keepRow.starts_at).getTime() &&
      new Date(cancelRow.ends_at).getTime() === new Date(keepRow.ends_at).getTime();
    const sameServices = sameList(cancelAssignments.services, keepAssignments.services);
    const sameStaff = sameList(cancelAssignments.staff, keepAssignments.staff);

    if (!sameTimes || !sameServices || !sameStaff) {
      logger.error({
        sameTimes,
        sameServices,
        sameStaff,
        cancelServiceIds: cancelAssignments.services,
        keepServiceIds: keepAssignments.services,
        cancelStaffIds: cancelAssignments.staff,
        keepStaffIds: keepAssignments.staff,
      }, 'Goldie duplicate repair guard mismatch');
      throw new Error('Appointments #360/#551 no longer match on canonical time, service and staff; refusing repair.');
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
