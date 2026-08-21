const crypto = require('node:crypto');
const { pool } = require('../db/pool');
const logger = require('../lib/logger');
const {
  calendarEnabled,
  cancelBookingEventOnCalendar,
  eventIdForAppointment,
} = require('./googleBookingCalendar');
const {
  ENV_BY_STAFF,
  normalizeStaffName,
  cancelPractitionerBookingEvent,
} = require('./practitionerGoogleCalendar');

const FINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show']);
const CLEANUP_REASON = 'Controlled Juvan booking cleanup before identity reset';
const CLEANUP_ACTOR_PREFIX = 'admin:controlled_juvan_booking_cleanup:';
const NO_MESSAGE_SUPPRESSION_REASON = 'controlled_juvan_administrative_reset';

function canCleanControlledJuvanBookings(admin) {
  return String(admin?.display_name || '').trim().toLowerCase() === 'jean-pierre'
    && admin?.business_role === 'business_admin'
    && admin?.calendar_scope === 'all_business'
    && admin?.service_scope === 'all_services';
}

function cleanupActor(adminId) {
  return `${CLEANUP_ACTOR_PREFIX}${Number(adminId)}`;
}

async function tableExists(db, name) {
  const result = await db.query('SELECT to_regclass($1) AS table_name', [`public.${name}`]);
  return Boolean(result.rows[0]?.table_name);
}

function parseStaff(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) { return []; }
  }
  return [];
}

function normalizeAppointment(row) {
  return {
    id: Number(row.id),
    status: String(row.status || '').toLowerCase(),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    serviceName: String(row.service_name || 'Unknown service'),
    staff: parseStaff(row.staff).map((item) => ({
      staffId: item.staffId == null ? null : Number(item.staffId),
      staffName: String(item.staffName || '').trim(),
    })).filter((item) => item.staffName),
    sharedCalendar: row.shared_event_id ? {
      calendarId: row.shared_calendar_id,
      eventId: row.shared_event_id,
      syncStatus: row.shared_sync_status,
    } : null,
    retryOnly: FINAL_STATUSES.has(String(row.status || '').toLowerCase()),
  };
}

async function loadCleanupAppointments(clientId, db = pool, lock = false) {
  const result = await db.query(`
    SELECT a.id,a.status,a.starts_at,a.ends_at,
           COALESCE((SELECT string_agg(COALESCE(s.name,aps.service_name_snapshot), ' + ' ORDER BY aps.position)
                       FROM appointment_services aps
                       LEFT JOIN services s ON s.id=aps.service_id
                      WHERE aps.appointment_id=a.id),a.title,'Unknown service') AS service_name,
           COALESCE((SELECT jsonb_agg(jsonb_build_object(
                                  'staffId',ast.staff_id,
                                  'staffName',COALESCE(st.display_name,ast.staff_name_snapshot))
                                ) ORDER BY ast.position,ast.id)
                       FROM appointment_staff ast
                       LEFT JOIN staff st ON st.id=ast.staff_id
                      WHERE ast.appointment_id=a.id),'[]'::jsonb) AS staff,
           ace.calendar_id AS shared_calendar_id,
           ace.event_id AS shared_event_id,
           ace.sync_status AS shared_sync_status
      FROM appointments a
      LEFT JOIN appointment_calendar_events ace
        ON ace.appointment_id=a.id AND ace.provider='google_calendar'
     WHERE a.client_id=$1
       AND (
         LOWER(a.status) NOT IN ('cancelled','completed','no_show')
         OR EXISTS (
           SELECT 1
             FROM appointment_status_history history
            WHERE history.appointment_id=a.id
              AND history.changed_by LIKE $2
              AND history.reason=$3
         )
       )
     ORDER BY a.starts_at,a.id${lock ? ' FOR UPDATE OF a' : ''}`,
    [clientId, `${CLEANUP_ACTOR_PREFIX}%`, CLEANUP_REASON]
  );
  return result.rows.map(normalizeAppointment);
}

function appointmentDigest(clientId, appointments = []) {
  const stable = appointments.map((appointment) => ({
    id: Number(appointment.id),
    status: appointment.status,
    startsAt: new Date(appointment.startsAt).toISOString(),
    endsAt: new Date(appointment.endsAt).toISOString(),
    serviceName: appointment.serviceName,
    staff: appointment.staff.map((item) => [item.staffId, item.staffName]),
    sharedCalendar: appointment.sharedCalendar
      ? [appointment.sharedCalendar.calendarId, appointment.sharedCalendar.eventId, appointment.sharedCalendar.syncStatus]
      : null,
    retryOnly: appointment.retryOnly,
  }));
  return crypto.createHash('sha256').update(JSON.stringify({ clientId: Number(clientId), appointments: stable })).digest('hex').slice(0, 20);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function knownCalendarMirrors(appointment) {
  const deterministicId = eventIdForAppointment(appointment.id);
  const mirrors = [];
  if (appointment.sharedCalendar) {
    mirrors.push(`Shared ${appointment.sharedCalendar.eventId} (${appointment.sharedCalendar.syncStatus || 'unknown'})`);
    if (appointment.sharedCalendar.eventId !== deterministicId) mirrors.push(`Shared deterministic ${deterministicId}`);
  } else {
    mirrors.push(`Shared deterministic ${deterministicId}`);
  }
  for (const item of appointment.staff) {
    const recognized = Boolean(ENV_BY_STAFF[normalizeStaffName(item.staffName)]);
    mirrors.push(`${item.staffName} ${recognized ? deterministicId : '(Calendar mapping unresolved)'}`);
  }
  return mirrors;
}

function appointmentPreviewBlock(appointment) {
  return [
    `*Appointment #${appointment.id}*${appointment.retryOnly ? ' — Calendar retry' : ''}`,
    `Status: ${appointment.status}`,
    `Service: ${appointment.serviceName}`,
    `Practitioner: ${appointment.staff.map((item) => item.staffName).join(' + ') || 'Unassigned'}`,
    `When: ${formatDateTime(appointment.startsAt)}–${new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(appointment.endsAt))}`,
    `Calendar: ${knownCalendarMirrors(appointment).join('; ')}`,
  ].join('\n');
}

function paginatePreview(client, contacts, appointments, maxBody = 880) {
  const identity = [
    '*Clean Juvan bookings and reset?*',
    `CRM profile: ${client.display_name}`,
    `CRM ID: #${client.id}`,
    `Controlled identity: ${contacts.map((item) => `${item.contact_type} +${String(item.normalized_value || '').replace(/\D/g, '')}`).join(', ')}`,
    '',
  ].join('\n');
  const footer = '\n\nNo client cancellation message will be sent. Completed, no-show and already-cancelled history remains preserved.';
  if (!appointments.length) return [`${identity}No non-final appointments were found.${footer}`];
  const pages = [];
  let current = identity;
  for (const appointment of appointments) {
    const block = appointmentPreviewBlock(appointment);
    if ((current.length + block.length + footer.length + 2) > maxBody && current !== identity) {
      pages.push(`${current.trim()}${footer}`);
      current = `${identity}${block}\n\n`;
    } else {
      current += `${block}\n\n`;
    }
  }
  pages.push(`${current.trim()}${footer}`);
  return pages;
}

async function terminalizeRelatedState(db, appointmentIds, adminId) {
  if (!appointmentIds.length) return { approvals: 0, reschedules: 0, lifecycle: 0, notifications: 0 };
  const counts = { approvals: 0, reschedules: 0, lifecycle: 0, notifications: 0 };
  if (await tableExists(db, 'appointment_booking_approvals')) {
    const result = await db.query(`
      UPDATE appointment_booking_approvals
         SET status='declined',decided_at=COALESCE(decided_at,NOW()),decided_by_admin_id=$2,
             decision_note=COALESCE(decision_note,$3),updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status='pending'`, [appointmentIds, adminId, CLEANUP_REASON]);
    counts.approvals = result.rowCount;
  }
  if (await tableExists(db, 'appointment_reschedule_requests')) {
    const result = await db.query(`
      UPDATE appointment_reschedule_requests
         SET status='superseded',decided_at=COALESCE(decided_at,NOW()),decided_by_admin_id=$2,
             decision_note=COALESCE(decision_note,$3),updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status IN ('pending','notification_failed')`, [appointmentIds, adminId, CLEANUP_REASON]);
    counts.reschedules = result.rowCount;
  }
  if (await tableExists(db, 'appointment_lifecycle')) {
    const result = await db.query(`
      UPDATE appointment_lifecycle
         SET status='cancelled',updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status NOT IN ('cancelled','completed')`, [appointmentIds]);
    counts.lifecycle = result.rowCount;
  }
  if (await tableExists(db, 'customer_change_notifications')) {
    const result = await db.query(`
      UPDATE customer_change_notifications
         SET status='suppressed',suppression_reason=$2,
             suppressed_at=COALESCE(suppressed_at,NOW()),updated_at=NOW()
       WHERE appointment_id = ANY($1::bigint[]) AND status IN ('pending','sending','failed')`, [appointmentIds, NO_MESSAGE_SUPPRESSION_REASON]);
    counts.notifications = result.rowCount;
  }
  return counts;
}

async function cancelOperationalAppointments(db, clientId, adminId, appointments) {
  const cancelled = [];
  const preservedForRetry = [];
  for (const appointment of appointments) {
    if (FINAL_STATUSES.has(appointment.status)) {
      preservedForRetry.push(appointment.id);
      continue;
    }
    const updated = await db.query(`
      UPDATE appointments
         SET status='cancelled',updated_at=NOW()
       WHERE id=$1 AND client_id=$2 AND status=$3
       RETURNING id,status`, [appointment.id, clientId, appointment.status]);
    if (!updated.rowCount) throw new Error(`Controlled Juvan booking cleanup conflict on appointment #${appointment.id}`);
    await db.query(`
      INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
      VALUES($1,$2,'cancelled',$3,$4)`, [appointment.id, appointment.status, cleanupActor(adminId), CLEANUP_REASON]);
    await db.query(`
      INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
      VALUES($1,'admin.controlled_demo_appointment_cancelled','appointment',$2,$3::jsonb)`, [
      adminId,
      String(appointment.id),
      JSON.stringify({
        clientId: Number(clientId),
        demoKey: 'juvan_botha',
        fromStatus: appointment.status,
        toStatus: 'cancelled',
        reason: CLEANUP_REASON,
        noClientMessage: true,
      }),
    ]);
    cancelled.push(appointment.id);
  }
  return { cancelled, preservedForRetry };
}

function sharedTargets(appointment) {
  const currentCalendarId = String(process.env.GOOGLE_BOOKING_CALENDAR_ID || '').trim();
  const deterministicId = eventIdForAppointment(appointment.id);
  const targets = [];
  if (appointment.sharedCalendar?.calendarId && appointment.sharedCalendar?.eventId) {
    targets.push({ calendarId: appointment.sharedCalendar.calendarId, eventId: appointment.sharedCalendar.eventId, source: 'mapping' });
  }
  if (currentCalendarId && !targets.some((target) => target.calendarId === currentCalendarId && target.eventId === deterministicId)) {
    targets.push({ calendarId: currentCalendarId, eventId: deterministicId, source: 'deterministic' });
  }
  return targets;
}

async function markSharedCalendarMapping(appointmentId, status, error = null, db = pool) {
  if (!(await tableExists(db, 'appointment_calendar_events'))) return;
  await db.query(`
    UPDATE appointment_calendar_events
       SET sync_status=$2,last_error=$3,updated_at=NOW()
     WHERE appointment_id=$1 AND provider='google_calendar'`, [appointmentId, status, error ? String(error).slice(0, 2000) : null]);
}

async function cleanupAppointmentCalendars(appointments, deps = {}) {
  const isEnabled = deps.calendarEnabled || calendarEnabled;
  const cancelShared = deps.cancelBookingEventOnCalendar || cancelBookingEventOnCalendar;
  const cancelPractitioner = deps.cancelPractitionerBookingEvent || cancelPractitionerBookingEvent;
  const markMapping = deps.markSharedCalendarMapping || markSharedCalendarMapping;
  if (!isEnabled()) {
    return appointments.map((appointment) => ({
      appointmentId: appointment.id,
      status: 'unresolved',
      unresolvedMirrors: ['google_calendar_disabled'],
      shared: [],
      practitioners: [],
    }));
  }

  const results = [];
  for (const appointment of appointments) {
    const unresolvedMirrors = [];
    const shared = [];
    const practitioners = [];
    const targets = sharedTargets(appointment);
    if (!targets.length) unresolvedMirrors.push('shared_calendar_not_configured');
    for (const target of targets) {
      try {
        const result = await cancelShared(target.eventId, target.calendarId);
        shared.push({ ...target, cancelled: result?.cancelled === true, alreadyMissing: result?.alreadyMissing === true });
        if (result?.cancelled !== true) unresolvedMirrors.push(`shared:${target.calendarId}:${target.eventId}`);
      } catch (error) {
        shared.push({ ...target, cancelled: false, error: String(error.message || error) });
        unresolvedMirrors.push(`shared:${target.calendarId}:${target.eventId}`);
      }
    }
    for (const assigned of appointment.staff) {
      if (!ENV_BY_STAFF[normalizeStaffName(assigned.staffName)]) {
        practitioners.push({ staffName: assigned.staffName, cancelled: false, error: 'unrecognized_practitioner_calendar' });
        unresolvedMirrors.push(`practitioner:${assigned.staffName}:unrecognized`);
        continue;
      }
      try {
        const result = await cancelPractitioner({ appointmentId: appointment.id, staffName: assigned.staffName });
        practitioners.push({ staffName: assigned.staffName, ...result });
        if (result?.cancelled !== true) unresolvedMirrors.push(`practitioner:${assigned.staffName}`);
      } catch (error) {
        practitioners.push({ staffName: assigned.staffName, cancelled: false, error: String(error.message || error) });
        unresolvedMirrors.push(`practitioner:${assigned.staffName}`);
      }
    }
    const status = unresolvedMirrors.length ? 'unresolved' : 'cancelled';
    try {
      await markMapping(appointment.id, status === 'cancelled' ? 'cancelled' : 'error', unresolvedMirrors.join(', ') || null);
    } catch (error) {
      unresolvedMirrors.push('calendar_mapping_audit_failed');
    }
    results.push({ appointmentId: appointment.id, status: unresolvedMirrors.length ? 'unresolved' : 'cancelled', unresolvedMirrors, shared, practitioners });
  }
  return results;
}

async function recordCalendarCleanup(adminId, clientId, calendarResults, db = pool) {
  await db.query(`
    INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
    VALUES($1,'admin.controlled_demo_calendar_cleanup','client',$2,$3::jsonb)`, [
    adminId,
    String(clientId),
    JSON.stringify({
      demoKey: 'juvan_botha',
      appointmentIds: calendarResults.map((item) => item.appointmentId),
      unresolvedMirrors: calendarResults.flatMap((item) => item.unresolvedMirrors),
      results: calendarResults,
      noClientMessage: true,
    }),
  ]);
}

async function cleanControlledJuvanBookings({ admin, expectedClientId, expectedDigest, resolveBoundJuvan, deps = {} }) {
  if (!canCleanControlledJuvanBookings(admin)) {
    return { status: 'unauthorized', reply: 'Booking cleanup and Reset Juvan are restricted to Jean-Pierre business administration.' };
  }
  const dbPool = deps.pool || pool;
  const client = await dbPool.connect();
  let clientId;
  let appointments;
  let related;
  let cancellation;
  try {
    await client.query('BEGIN');
    const resolved = await resolveBoundJuvan(client, true);
    if (resolved.status !== 'ready') {
      await client.query('ROLLBACK');
      return { status: resolved.status, reply: 'Booking cleanup blocked: the controlled Juvan identity is no longer safely bound.' };
    }
    clientId = Number(resolved.client.id);
    appointments = await loadCleanupAppointments(clientId, client, true);
    const digest = appointmentDigest(clientId, appointments);
    if (clientId !== Number(expectedClientId) || digest !== expectedDigest) {
      await client.query('ROLLBACK');
      return { status: 'preview_changed', reply: 'Booking cleanup blocked: the controlled Juvan profile or appointment preview changed. Open Reset Juvan and review the current preview again.' };
    }
    cancellation = await cancelOperationalAppointments(client, clientId, admin.id, appointments);
    related = await terminalizeRelatedState(client, appointments.map((item) => item.id), admin.id);
    await client.query(`
      INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
      VALUES($1,'admin.controlled_demo_booking_cleanup_committed','client',$2,$3::jsonb)`, [
      admin.id,
      String(clientId),
      JSON.stringify({
        demoKey: 'juvan_botha',
        cancelledAppointmentIds: cancellation.cancelled,
        retryAppointmentIds: cancellation.preservedForRetry,
        related,
        noClientMessage: true,
        preservedAppointmentRows: true,
      }),
    ]);
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }

  const calendarResults = await cleanupAppointmentCalendars(appointments, deps);
  const unresolved = calendarResults.flatMap((item) => item.unresolvedMirrors.map((mirror) => ({ appointmentId: item.appointmentId, mirror })));
  try {
    await (deps.recordCalendarCleanup || recordCalendarCleanup)(admin.id, clientId, calendarResults);
  } catch (error) {
    unresolved.push({ appointmentId: null, mirror: 'calendar_cleanup_audit_failed' });
    logger.error({ err: error, clientId }, 'Controlled Juvan Calendar cleanup audit failed');
  }
  return {
    status: unresolved.length ? 'calendar_partial' : 'bookings_clean',
    clientId,
    appointmentIds: appointments.map((item) => item.id),
    cancelledAppointmentIds: cancellation.cancelled,
    related,
    calendars: calendarResults,
    unresolved,
    noClientMessage: true,
  };
}

module.exports = {
  FINAL_STATUSES,
  CLEANUP_REASON,
  CLEANUP_ACTOR_PREFIX,
  NO_MESSAGE_SUPPRESSION_REASON,
  canCleanControlledJuvanBookings,
  cleanupActor,
  loadCleanupAppointments,
  appointmentDigest,
  knownCalendarMirrors,
  appointmentPreviewBlock,
  paginatePreview,
  terminalizeRelatedState,
  cancelOperationalAppointments,
  sharedTargets,
  markSharedCalendarMapping,
  cleanupAppointmentCalendars,
  recordCalendarCleanup,
  cleanControlledJuvanBookings,
};
