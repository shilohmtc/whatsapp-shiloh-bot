'use strict';

const { pool } = require('../db/pool');

const AUTHORIZED_RUN_ID = 'calendar-reset-2026-08-30-v1';
const AUDIT_ACTION = 'control.calendar_occupancy_reset';
const LOCK_KEY = 'shiloh:control:calendar-occupancy-reset:2026-08-30:v1';
const MAX_APPOINTMENTS = 50000;
const RETRYABLE_DELIVERY_STATUSES = ['pending', 'failed', 'sending'];

function configuredRunId(env = process.env) {
  return String(env.SHILOH_CALENDAR_OCCUPANCY_RESET_RUN_ID || '').trim();
}

function configuredReleaseSha(env = process.env) {
  return String(env.SHILOH_CALENDAR_OCCUPANCY_RESET_RELEASE_SHA || '').trim().toLowerCase();
}

function currentRenderSha(env = process.env) {
  return String(env.RENDER_GIT_COMMIT || '').trim().toLowerCase();
}

function validSha(value) {
  return /^[0-9a-f]{40}$/.test(String(value || ''));
}

async function snapshotCounts(db) {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM appointments WHERE status <> 'cancelled') AS active_appointments,
      (SELECT COUNT(*)::int FROM calendar_blocks) AS calendar_blocks,
      (SELECT COUNT(*)::int FROM appointment_lifecycle WHERE status IN ('confirmed','confirmed_by_client')) AS active_lifecycle,
      (SELECT COUNT(*)::int FROM appointment_booking_approvals WHERE status='pending') AS pending_approvals,
      (SELECT COUNT(*)::int FROM customer_message_deliveries WHERE message_kind='booking_confirmation' AND status=ANY($1::text[])) AS retryable_confirmations,
      (SELECT COUNT(*)::int FROM crm_v2_clients) AS crm_v2_rows,
      (SELECT COUNT(*)::int FROM clients) AS legacy_client_rows,
      (SELECT COUNT(*)::int FROM staff) AS staff_rows,
      (SELECT COUNT(*)::int FROM services) AS service_rows,
      (SELECT COUNT(*)::int FROM locations) AS location_rows,
      (SELECT COUNT(*)::int FROM staff_schedule_exceptions) AS schedule_exception_rows
  `, [RETRYABLE_DELIVERY_STATUSES]);
  return result.rows[0];
}

function preservedCountsMatch(before, after) {
  for (const key of ['crm_v2_rows', 'legacy_client_rows', 'staff_rows', 'service_rows', 'location_rows', 'schedule_exception_rows']) {
    if (Number(before[key]) !== Number(after[key])) return false;
  }
  return true;
}

function assertPostconditions(before, after) {
  if (Number(after.active_appointments) !== 0) throw new Error('Calendar reset postcondition failed: active appointments remain');
  if (Number(after.calendar_blocks) !== 0) throw new Error('Calendar reset postcondition failed: calendar blocks remain');
  if (Number(after.active_lifecycle) !== 0) throw new Error('Calendar reset postcondition failed: active lifecycle reminders remain');
  if (Number(after.pending_approvals) !== 0) throw new Error('Calendar reset postcondition failed: pending practitioner approvals remain');
  if (Number(after.retryable_confirmations) !== 0) throw new Error('Calendar reset postcondition failed: retryable booking confirmations remain');
  if (!preservedCountsMatch(before, after)) throw new Error('Calendar reset preservation postcondition failed');
}

async function postcommitVerification(dbPool, before) {
  const db = await dbPool.connect();
  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const after = await snapshotCounts(db);
    assertPostconditions(before, after);
    await db.query('COMMIT');
    return after;
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function executeCalendarOccupancyReset({ runId, dbPool = pool } = {}) {
  if (runId !== AUTHORIZED_RUN_ID) return { status: 'refused', reason: 'run_id_mismatch' };

  const db = await dbPool.connect();
  let before;
  let changed = null;
  try {
    await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    await db.query(`SET LOCAL statement_timeout = '120s'`);
    await db.query(`SET LOCAL lock_timeout = '5s'`);
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [LOCK_KEY]);

    const replay = await db.query(
      `SELECT 1 FROM crm_audit_events WHERE action=$1 AND metadata->>'runId'=$2 ORDER BY id LIMIT 1`,
      [AUDIT_ACTION, runId]
    );
    if (replay.rowCount) {
      before = await snapshotCounts(db);
      assertPostconditions(before, before);
      await db.query('COMMIT');
      return { status: 'already_executed', runId, after: before };
    }

    before = await snapshotCounts(db);
    if (Number(before.active_appointments) > MAX_APPOINTMENTS) {
      throw new Error(`Calendar reset safety bound exceeded: ${before.active_appointments} active appointments`);
    }

    await db.query(`
      CREATE TEMP TABLE shiloh_calendar_reset_targets ON COMMIT DROP AS
      SELECT id,status FROM appointments WHERE status <> 'cancelled' ORDER BY id
    `);
    const targetCount = await db.query(`SELECT COUNT(*)::int AS count FROM shiloh_calendar_reset_targets`);
    if (Number(targetCount.rows[0]?.count || 0) !== Number(before.active_appointments)) {
      throw new Error('Calendar reset target count changed before lock');
    }

    const history = await db.query(`
      INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
      SELECT id,status,'cancelled','control:00','Authorized clean-calendar occupancy reset #584'
        FROM shiloh_calendar_reset_targets
      RETURNING appointment_id
    `);

    const appointments = await db.query(`
      UPDATE appointments a
         SET status='cancelled',updated_at=NOW()
        FROM shiloh_calendar_reset_targets t
       WHERE a.id=t.id AND a.status=t.status
      RETURNING a.id
    `);
    if (appointments.rowCount !== Number(before.active_appointments) || history.rowCount !== appointments.rowCount) {
      throw new Error('Calendar reset appointment write count mismatch');
    }

    const lifecycle = await db.query(`
      UPDATE appointment_lifecycle
         SET status='cancelled',updated_at=NOW()
       WHERE status IN ('confirmed','confirmed_by_client')
      RETURNING id
    `);

    const approvals = await db.query(`
      UPDATE appointment_booking_approvals
         SET status='declined',
             decided_at=COALESCE(decided_at,NOW()),
             decision_note=COALESCE(decision_note,'authorized_calendar_reset_584'),
             updated_at=NOW()
       WHERE status='pending'
      RETURNING appointment_id
    `);

    const deliveries = await db.query(`
      UPDATE customer_message_deliveries d
         SET status='uncertain',
             updated_at=NOW(),
             next_attempt_at=NOW(),
             last_error='appointment_cancelled_by_authorized_calendar_reset'
       WHERE d.message_kind='booking_confirmation'
         AND d.status=ANY($1::text[])
         AND EXISTS (SELECT 1 FROM appointments a WHERE a.id=d.appointment_id AND a.status='cancelled')
      RETURNING d.appointment_id
    `, [RETRYABLE_DELIVERY_STATUSES]);

    const blocks = await db.query(`DELETE FROM calendar_blocks RETURNING id`);

    const after = await snapshotCounts(db);
    assertPostconditions(before, after);

    changed = {
      appointmentsCancelled: appointments.rowCount,
      lifecycleRowsCancelled: lifecycle.rowCount,
      approvalsClosed: approvals.rowCount,
      confirmationRetriesSuppressed: deliveries.rowCount,
      calendarBlocksRemoved: blocks.rowCount,
    };

    await db.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES($1,'calendar',NULL,$2::jsonb)
    `, [AUDIT_ACTION, JSON.stringify({
      runId,
      issue: 584,
      authorizedBy: 'JP',
      changed,
      before: {
        activeAppointments: Number(before.active_appointments),
        calendarBlocks: Number(before.calendar_blocks),
        activeLifecycle: Number(before.active_lifecycle),
        pendingApprovals: Number(before.pending_approvals),
        retryableConfirmations: Number(before.retryable_confirmations),
      },
      after: {
        activeAppointments: Number(after.active_appointments),
        calendarBlocks: Number(after.calendar_blocks),
        activeLifecycle: Number(after.active_lifecycle),
        pendingApprovals: Number(after.pending_approvals),
        retryableConfirmations: Number(after.retryable_confirmations),
      },
      preserved: {
        crmV2Rows: Number(after.crm_v2_rows),
        legacyClientRows: Number(after.legacy_client_rows),
        staffRows: Number(after.staff_rows),
        serviceRows: Number(after.service_rows),
        locationRows: Number(after.location_rows),
        scheduleExceptionRows: Number(after.schedule_exception_rows),
      },
      whatsappMessagesSent: 0,
      googleMutations: 0,
    })]);

    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  const verified = await postcommitVerification(dbPool, before);
  return { status: 'complete', runId, changed, after: verified };
}

async function runConfiguredCalendarOccupancyReset({ env = process.env, dbPool = pool } = {}) {
  const runId = configuredRunId(env);
  if (!runId) return { status: 'disabled' };
  if (runId !== AUTHORIZED_RUN_ID) return { status: 'refused', reason: 'run_id_mismatch' };

  const expectedSha = configuredReleaseSha(env);
  const deployedSha = currentRenderSha(env);
  if (!validSha(expectedSha) || !validSha(deployedSha) || expectedSha !== deployedSha) {
    return { status: 'refused', reason: 'release_sha_mismatch' };
  }

  return executeCalendarOccupancyReset({ runId, dbPool });
}

module.exports = {
  AUTHORIZED_RUN_ID,
  AUDIT_ACTION,
  executeCalendarOccupancyReset,
  runConfiguredCalendarOccupancyReset,
};
