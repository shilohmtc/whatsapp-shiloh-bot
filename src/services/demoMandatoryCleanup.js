const { pool } = require('../db/pool');
const logger = require('../lib/logger');
const { calendarEnabled, getBookingEvent, cancelBookingEvent } = require('./googleBookingCalendar');

const DEFAULT_INTERVAL_MS = 5000;
let running = false;
let timer = null;

function intervalMs() {
  const configured = Number(process.env.DEMO_CLEANUP_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  if (!Number.isFinite(configured)) return DEFAULT_INTERVAL_MS;
  return Math.max(1000, Math.floor(configured));
}

async function loadBookedDemoSessions() {
  const result = await pool.query(
    `SELECT s.admin_id,s.virtual_phone,s.demo_client_id,s.demo_appointment_id,s.state,
            a.display_name AS admin_name
       FROM admin_client_demo_sessions s
       JOIN staff_admin_accounts a ON a.id=s.admin_id
      WHERE s.state='booked'
        AND s.demo_client_id IS NOT NULL
        AND s.demo_appointment_id IS NOT NULL
      ORDER BY s.updated_at,s.admin_id
      LIMIT 20`
  );
  return result.rows;
}

async function verifyDemoBooking(session) {
  const result = await pool.query(
    `SELECT a.id,a.client_id,a.source,a.starts_at,a.ends_at,
            c.source AS client_source,c.custom_attributes,
            ace.event_id
       FROM appointments a
       JOIN clients c ON c.id=a.client_id
       LEFT JOIN appointment_calendar_events ace
         ON ace.appointment_id=a.id AND ace.provider='google_calendar'
      WHERE a.id=$1`,
    [session.demo_appointment_id]
  );
  const row = result.rows[0] || null;
  if (!row) return { verified:false, reason:'appointment_missing' };
  const owner = String(row.custom_attributes?.demo_admin_id || '');
  if (
    String(row.client_id) !== String(session.demo_client_id) ||
    row.source !== 'shiloh_demo_whatsapp' ||
    row.client_source !== 'whatsapp_demo' ||
    owner !== String(session.admin_id)
  ) {
    return { verified:false, reason:'ownership_proof_failed' };
  }
  if (calendarEnabled()) {
    if (!row.event_id) return { verified:false, reason:'calendar_mapping_missing' };
    const event = await getBookingEvent(row.event_id);
    if (!event) return { verified:false, reason:'calendar_event_missing' };
    const appointmentId = String(event.extendedProperties?.private?.shilohAppointmentId || '');
    if (appointmentId !== String(row.id)) return { verified:false, reason:'calendar_appointment_mismatch' };
  }
  return { verified:true, row };
}

async function purgeVerifiedDemo(session, verified) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const locked = await db.query(
      `SELECT a.id,a.client_id,a.source,a.starts_at,a.ends_at,
              c.source AS client_source,c.custom_attributes,
              ace.event_id
         FROM appointments a
         JOIN clients c ON c.id=a.client_id
         LEFT JOIN appointment_calendar_events ace
           ON ace.appointment_id=a.id AND ace.provider='google_calendar'
        WHERE a.id=$1
        FOR UPDATE OF a,c`,
      [session.demo_appointment_id]
    );
    const row = locked.rows[0];
    if (!row) {
      await db.query('ROLLBACK');
      return { cleaned:false, reason:'appointment_disappeared_before_cleanup' };
    }
    const owner = String(row.custom_attributes?.demo_admin_id || '');
    if (
      String(row.client_id) !== String(session.demo_client_id) ||
      row.source !== 'shiloh_demo_whatsapp' ||
      row.client_source !== 'whatsapp_demo' ||
      owner !== String(session.admin_id)
    ) {
      await db.query('ROLLBACK');
      return { cleaned:false, reason:'locked_ownership_proof_failed' };
    }
    if (calendarEnabled() && String(row.event_id || '') !== String(verified.row.event_id || '')) {
      await db.query('ROLLBACK');
      return { cleaned:false, reason:'calendar_mapping_changed_before_cleanup' };
    }
    const redemption = await db.query(`SELECT 1 FROM loyalty_redemptions WHERE appointment_id=$1 LIMIT 1`, [row.id]);
    if (redemption.rowCount) {
      await db.query('ROLLBACK');
      return { cleaned:false, reason:'loyalty_dependency_detected' };
    }

    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'admin.demo_booking_verified_for_cleanup','appointment',$2,$3::jsonb)`,
      [session.admin_id, row.id, JSON.stringify({
        demoClientId: row.client_id,
        calendarVerified: calendarEnabled(),
        eventId: row.event_id || null,
        mandatoryCleanup: true,
      })]
    );

    if (row.event_id) await cancelBookingEvent(row.event_id);

    await db.query(`DELETE FROM appointments WHERE id=$1`, [row.id]);
    await db.query(`DELETE FROM booking_intents WHERE phone=$1`, [session.virtual_phone]);
    await db.query(`DELETE FROM client_onboarding_sessions WHERE phone=$1`, [session.virtual_phone]);
    await db.query(`DELETE FROM booking_policy_acceptances WHERE phone=$1`, [session.virtual_phone]);
    await db.query(`DELETE FROM admin_client_demo_sessions WHERE admin_id=$1`, [session.admin_id]);
    await db.query(
      `UPDATE clients
          SET status='inactive',updated_at=NOW(),
              custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) ||
                jsonb_build_object(
                  'demo_cleanup','mandatory_auto_purge',
                  'demo_cleanup_at',NOW()::text,
                  'demo_removed_from_active_crm',true
                )
        WHERE id=$1
          AND source='whatsapp_demo'
          AND NOT EXISTS (SELECT 1 FROM appointments WHERE client_id=$1)`,
      [row.client_id]
    );
    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'admin.demo_booking_auto_purged','appointment',$2,$3::jsonb)`,
      [session.admin_id, row.id, JSON.stringify({
        demoClientId: row.client_id,
        googleCalendarEventRemoved: Boolean(row.event_id),
        syntheticClientRemovedFromActiveCrm: true,
        mandatoryCleanup: true,
        startsAt: row.starts_at,
      })]
    );
    await db.query('COMMIT');
    return { cleaned:true, appointmentId:row.id, clientId:row.client_id };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function cleanupBookedDemoSession(session) {
  const verified = await verifyDemoBooking(session);
  if (!verified.verified) {
    logger.error({
      adminId:session.admin_id,
      appointmentId:session.demo_appointment_id,
      reason:verified.reason,
    }, 'Mandatory demo cleanup blocked: verification failed');
    return { cleaned:false, reason:verified.reason };
  }
  const result = await purgeVerifiedDemo(session, verified);
  if (result.cleaned) {
    logger.info({
      adminId:session.admin_id,
      appointmentId:result.appointmentId,
      clientId:result.clientId,
    }, 'Mandatory demo cleanup completed');
  } else {
    logger.error({
      adminId:session.admin_id,
      appointmentId:session.demo_appointment_id,
      reason:result.reason,
    }, 'Mandatory demo cleanup remains required');
  }
  return result;
}

async function runMandatoryDemoCleanup() {
  if (running) return { skipped:true };
  running = true;
  try {
    const sessions = await loadBookedDemoSessions();
    let cleaned = 0;
    let blocked = 0;
    for (const session of sessions) {
      try {
        const result = await cleanupBookedDemoSession(session);
        if (result.cleaned) cleaned += 1;
        else blocked += 1;
      } catch (error) {
        blocked += 1;
        logger.error({ err:error, adminId:session.admin_id, appointmentId:session.demo_appointment_id }, 'Mandatory demo cleanup failed closed');
      }
    }
    return { scanned:sessions.length, cleaned, blocked };
  } finally {
    running = false;
  }
}

function startMandatoryDemoCleanupScheduler() {
  const ms = intervalMs();
  runMandatoryDemoCleanup().catch((error) => logger.error({ err:error }, 'Initial mandatory demo cleanup sweep failed'));
  timer = setInterval(() => {
    runMandatoryDemoCleanup().catch((error) => logger.error({ err:error }, 'Mandatory demo cleanup sweep failed'));
  }, ms);
  timer.unref?.();
  logger.info({ intervalMs:ms }, 'Mandatory demo cleanup scheduler started');
  return timer;
}

module.exports = {
  intervalMs,
  verifyDemoBooking,
  cleanupBookedDemoSession,
  runMandatoryDemoCleanup,
  startMandatoryDemoCleanupScheduler,
};
