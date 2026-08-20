const { pool } = require('../db/pool');
const { checkClinicHours } = require('./clinicHours');
const { checkAuthoritativeSchedule } = require('./adminAvailability');
const {
  checkCalendarAvailability,
  findBookingEventByAppointmentId,
  updateBookingEvent,
} = require('./googleBookingCalendar');
const {
  checkPractitionerCalendarAvailability,
  eventIdForAppointment,
  syncPractitionerBookingEvent,
} = require('./practitionerGoogleCalendar');
const { sendWhatsAppTemplate } = require('./whatsapp');
const { queueCustomerChangeNotification } = require('./customerChangeNotification');
const logger = require('../lib/logger');

const TIME_ZONE = 'Africa/Johannesburg';
const APPROVE_PREFIX = 'reschedule_approval_approve_';
const DECLINE_PREFIX = 'reschedule_approval_decline_';
const APPROVAL_TEMPLATE = 'shiloh_reschedule_approval_request_v1';
const DECLINED_TEMPLATE = 'shiloh_reschedule_declined_v1';

function featureEnabled() {
  return process.env.WHATSAPP_RESCHEDULE_APPROVAL_ENABLED === 'true';
}

function normalizePhone(value = '') {
  return String(value || '').replace(/\D/g, '');
}

function fmtDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '02-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function fmtDate(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function fmtTimeRange(startsAt, endsAt) {
  const fmt = (value) => new Intl.DateTimeFormat('en-ZA', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
  return `${fmt(startsAt)}–${fmt(endsAt)}`;
}

function parseClock(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  let match = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (minute > 59) return null;
    if (match[3]) {
      if (hour < 1 || hour > 12) return null;
      if (match[3] === 'pm' && hour !== 12) hour += 12;
      if (match[3] === 'am' && hour === 12) hour = 0;
    }
    if (hour > 23) return null;
    return { hour, minute };
  }
  match = raw.match(/^(\d{1,2})\s*(am|pm)$/);
  if (match) {
    let hour = Number(match[1]);
    if (hour < 1 || hour > 12) return null;
    if (match[2] === 'pm' && hour !== 12) hour += 12;
    if (match[2] === 'am' && hour === 12) hour = 0;
    return { hour, minute: 0 };
  }
  if (/^\d{1,2}$/.test(raw)) {
    const hour = Number(raw);
    return hour <= 23 ? { hour, minute: 0 } : null;
  }
  return null;
}

function localDateTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return null;
  const clock = parseClock(time);
  if (!clock) return null;
  const value = new Date(`${date}T${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}:00+02:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function isClientConfirmation(text = '') {
  return /^(yes|y|confirm|confirmed|correct|proceed|continue|ok|okay)$/i.test(String(text).trim());
}

function decisionFromText(text = '') {
  const raw = String(text || '').trim();
  let match = raw.match(/^reschedule_approval_approve_(\d+)$/i);
  if (match) return { requestId: Number(match[1]), decision: 'approved' };
  match = raw.match(/^reschedule_approval_decline_(\d+)$/i);
  if (match) return { requestId: Number(match[1]), decision: 'declined' };
  return null;
}

async function pendingRescheduleConflicts({ db = pool, staffId, startsAt, endsAt, excludeRequestId = null }) {
  const result = await db.query(`
    SELECT 'reschedule_hold'::text AS conflict_type,
           request.id,
           request.proposed_starts_at AS starts_at,
           request.proposed_ends_at AS ends_at,
           'Pending client reschedule approval'::text AS label
      FROM appointment_reschedule_requests request
     WHERE request.approver_staff_id=$1
       AND request.status='pending'
       AND request.proposed_starts_at<$3
       AND request.proposed_ends_at>$2
       AND ($4::bigint IS NULL OR request.id<>$4)
     ORDER BY request.proposed_starts_at,request.id
  `, [staffId, startsAt, endsAt, excludeRequestId]);
  return result.rows;
}

async function loadAppointmentForRequest(phone, appointmentId, db = pool) {
  const normalized = normalizePhone(phone);
  const result = await db.query(`
    SELECT a.id,a.client_id,a.location_id,a.starts_at,a.ends_at,a.status,a.source,
           c.display_name AS client_name,
           ast.staff_id,COALESCE(st.display_name,ast.staff_name_snapshot,'Shiloh practitioner') AS staff_name,
           aps.service_id,COALESCE(s.name,aps.service_name_snapshot,a.title,'Shiloh appointment') AS service_name,
           (SELECT COUNT(*)::int FROM appointment_staff x WHERE x.appointment_id=a.id) AS staff_count,
           (SELECT COUNT(*)::int FROM appointment_services x WHERE x.appointment_id=a.id) AS service_count,
           ace.event_id
      FROM appointments a
      JOIN clients c ON c.id=a.client_id
      JOIN client_contacts cc ON cc.client_id=c.id
      JOIN appointment_staff ast ON ast.appointment_id=a.id AND ast.position=1
      LEFT JOIN staff st ON st.id=ast.staff_id
      JOIN appointment_services aps ON aps.appointment_id=a.id AND aps.position=1
      LEFT JOIN services s ON s.id=aps.service_id
      LEFT JOIN appointment_calendar_events ace
        ON ace.appointment_id=a.id AND ace.provider='google_calendar'
     WHERE a.id=$2
       AND a.status<>'cancelled'
       AND cc.normalized_value=$1
       AND LOWER(cc.contact_type) IN ('whatsapp','mobile','phone','telephone')
     ORDER BY cc.is_primary DESC,cc.id
     LIMIT 1
  `, [normalized, Number(appointmentId)]);
  return result.rows[0] || null;
}

async function resolveApproverContact(staffId, db = pool) {
  const result = await db.query(`
    SELECT id,staff_id,display_name,normalized_whatsapp
      FROM staff_admin_accounts
     WHERE staff_id=$1
       AND active=TRUE
       AND normalized_whatsapp IS NOT NULL
     ORDER BY id
  `, [staffId]);
  if (result.rowCount !== 1) return { ok: false, reason: result.rowCount ? 'approver_identity_ambiguous' : 'approver_whatsapp_unavailable' };
  return { ok: true, admin: result.rows[0] };
}

async function canonicalConflicts({ db = pool, appointmentId, staffId, startsAt, endsAt }) {
  const result = await db.query(`
    SELECT ap.id,ap.starts_at,ap.ends_at
      FROM appointments ap
      JOIN appointment_staff ast ON ast.appointment_id=ap.id
     WHERE ast.staff_id=$1
       AND ap.id<>$2
       AND ap.status<>'cancelled'
       AND ap.starts_at<$4
       AND ap.ends_at>$3
     LIMIT 1
  `, [staffId, appointmentId, startsAt, endsAt]);
  return result.rows;
}

async function validateCandidate({ db = pool, appointment, proposedStartsAt, proposedEndsAt, excludeRequestId = null }) {
  if (!appointment || Number(appointment.staff_count) !== 1 || !appointment.staff_id) {
    return { ok: false, reason: 'complex_practitioner_setup' };
  }
  if (Number(appointment.service_count) !== 1) return { ok: false, reason: 'complex_service_setup' };
  if (proposedStartsAt.getTime() <= Date.now()) return { ok: false, reason: 'past_time' };

  const clinic = await checkClinicHours({ db, locationId: appointment.location_id, startsAt: proposedStartsAt, endsAt: proposedEndsAt });
  if (!clinic.covered) return { ok: false, reason: 'clinic_hours' };

  const schedule = await checkAuthoritativeSchedule({
    db,
    staffId: Number(appointment.staff_id),
    locationId: appointment.location_id,
    startsAt: proposedStartsAt,
    endsAt: proposedEndsAt,
  });
  if (schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException) || !schedule.covered) {
    return { ok: false, reason: 'staff_schedule' };
  }

  const conflicts = await canonicalConflicts({
    db,
    appointmentId: appointment.id,
    staffId: appointment.staff_id,
    startsAt: proposedStartsAt,
    endsAt: proposedEndsAt,
  });
  if (conflicts.length) return { ok: false, reason: 'crm_conflict' };

  const holds = await pendingRescheduleConflicts({
    db,
    staffId: appointment.staff_id,
    startsAt: proposedStartsAt,
    endsAt: proposedEndsAt,
    excludeRequestId,
  });
  if (holds.length) return { ok: false, reason: 'reschedule_hold_conflict' };

  return { ok: true };
}

async function validateExternalCalendars(appointment, startsAt, endsAt) {
  let sharedEventId = appointment.event_id || null;
  if (!sharedEventId) {
    const existing = await findBookingEventByAppointmentId(appointment.id);
    sharedEventId = existing?.id || null;
  }
  const shared = await checkCalendarAvailability({
    startsAt,
    endsAt,
    staffName: appointment.staff_name,
    ignoreEventId: sharedEventId || null,
  });
  if (shared.enabled && !shared.available) return { ok: false, reason: 'shared_calendar_conflict', sharedEventId };

  const practitionerEventId = eventIdForAppointment(appointment.id);
  const practitioner = await checkPractitionerCalendarAvailability({
    staffName: appointment.staff_name,
    startsAt,
    endsAt,
    ignoreEventId: practitionerEventId,
  });
  if (practitioner.enabled && practitioner.configured && !practitioner.available) {
    return { ok: false, reason: 'practitioner_calendar_conflict', sharedEventId, practitionerEventId };
  }
  return { ok: true, sharedEventId, practitionerEventId };
}

function requestFailureReply(reason, staffName = 'the practitioner') {
  const messages = {
    past_time: 'That requested time has already passed.',
    clinic_hours: 'That requested time is outside Shiloh’s clinic hours.',
    staff_schedule: `${staffName} is not available at that requested time.`,
    crm_conflict: 'That requested time is no longer available.',
    reschedule_hold_conflict: 'That requested time is already being held for another pending change.',
    shared_calendar_conflict: 'That requested time is no longer clear on the Shiloh calendar.',
    practitioner_calendar_conflict: `${staffName} is no longer free on the connected practitioner calendar.`,
    complex_practitioner_setup: 'This appointment has a complex practitioner setup, so the clinic team needs to help reschedule it safely.',
    complex_service_setup: 'This appointment has a complex service setup, so the clinic team needs to help reschedule it safely.',
    approver_whatsapp_unavailable: `I can’t safely send ${staffName} the required approval request right now.`,
    approver_identity_ambiguous: `I can’t safely resolve one authorized WhatsApp approver for ${staffName}.`,
  };
  return `${messages[reason] || 'I couldn’t safely create that reschedule request.'}\n\nYour current appointment is unchanged.`;
}

async function sendApprovalRequest(request, appointment, approver) {
  const configured = String(process.env.WHATSAPP_RESCHEDULE_APPROVAL_REQUEST_TEMPLATE || '').trim();
  if (configured !== APPROVAL_TEMPLATE) throw new Error('Reschedule approval request template is not configured to the frozen contract');
  await sendWhatsAppTemplate(
    approver.normalized_whatsapp,
    APPROVAL_TEMPLATE,
    [
      appointment.client_name,
      appointment.service_name,
      fmtDateTime(appointment.starts_at),
      fmtDateTime(request.proposed_starts_at),
      String(appointment.id),
    ],
    process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en',
    [`${APPROVE_PREFIX}${request.id}`, `${DECLINE_PREFIX}${request.id}`]
  );
}

async function createPendingRescheduleRequest(phone, intent) {
  if (!featureEnabled()) return { status: 'feature_disabled' };
  const appointment = await loadAppointmentForRequest(phone, intent?.appointment_id);
  if (!appointment) return { status: 'appointment_not_found', reply: 'That booking is no longer available to change. Your current appointments were not modified.' };

  const proposedStartsAt = localDateTime(intent?.preferred_date, intent?.preferred_time);
  if (!proposedStartsAt) return { status: 'invalid_time', reply: 'I couldn’t safely resolve that requested date and time. Your current appointment is unchanged.' };
  const duration = new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime();
  if (!(duration > 0)) return { status: 'invalid_duration', reply: 'This appointment does not have a valid duration, so the clinic team needs to help reschedule it safely. Your current appointment is unchanged.' };
  const proposedEndsAt = new Date(proposedStartsAt.getTime() + duration);

  const approver = await resolveApproverContact(appointment.staff_id);
  if (!approver.ok) return { status: approver.reason, reply: requestFailureReply(approver.reason, appointment.staff_name) };

  const initial = await validateCandidate({ appointment, proposedStartsAt, proposedEndsAt });
  if (!initial.ok) return { status: initial.reason, reply: requestFailureReply(initial.reason, appointment.staff_name) };
  const initialExternal = await validateExternalCalendars(appointment, proposedStartsAt, proposedEndsAt);
  if (!initialExternal.ok) return { status: initialExternal.reason, reply: requestFailureReply(initialExternal.reason, appointment.staff_name) };

  const db = await pool.connect();
  let request;
  try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock($1::bigint)', [Number(appointment.staff_id)]);
    const locked = await loadAppointmentForRequest(phone, appointment.id, db);
    if (!locked) {
      await db.query('ROLLBACK');
      return { status: 'appointment_changed', reply: 'That appointment changed while I was checking it. Your current booking was not moved; please start the reschedule again.' };
    }
    if (
      new Date(locked.starts_at).getTime() !== new Date(appointment.starts_at).getTime()
      || new Date(locked.ends_at).getTime() !== new Date(appointment.ends_at).getTime()
      || Number(locked.staff_id) !== Number(appointment.staff_id)
      || Number(locked.service_id || 0) !== Number(appointment.service_id || 0)
    ) {
      await db.query('ROLLBACK');
      return { status: 'appointment_changed', reply: 'That appointment changed while I was checking it. Your current booking was not moved; please start the reschedule again.' };
    }

    const final = await validateCandidate({ db, appointment: locked, proposedStartsAt, proposedEndsAt });
    if (!final.ok) {
      await db.query('ROLLBACK');
      return { status: final.reason, reply: requestFailureReply(final.reason, locked.staff_name) };
    }
    const finalExternal = await validateExternalCalendars(locked, proposedStartsAt, proposedEndsAt);
    if (!finalExternal.ok) {
      await db.query('ROLLBACK');
      return { status: finalExternal.reason, reply: requestFailureReply(finalExternal.reason, locked.staff_name) };
    }

    const inserted = await db.query(`
      INSERT INTO appointment_reschedule_requests
        (appointment_id,client_id,service_id,approver_staff_id,requested_by_phone,
         original_starts_at,original_ends_at,proposed_starts_at,proposed_ends_at,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
      ON CONFLICT (appointment_id) WHERE status='pending' DO NOTHING
      RETURNING *
    `, [
      locked.id,
      locked.client_id,
      locked.service_id,
      locked.staff_id,
      normalizePhone(phone),
      locked.starts_at,
      locked.ends_at,
      proposedStartsAt,
      proposedEndsAt,
    ]);
    if (!inserted.rowCount) {
      await db.query('ROLLBACK');
      return { status: 'already_pending', reply: 'A reschedule request is already awaiting approval for this appointment. Your current appointment remains confirmed until that request is decided.' };
    }
    request = inserted.rows[0];
    await db.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES ('client.reschedule_approval.requested','appointment',$1,$2::jsonb)
    `, [locked.id, JSON.stringify({ requestId: Number(request.id), proposedStartsAt: proposedStartsAt.toISOString(), approverStaffId: Number(locked.staff_id) })]);
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  try {
    await sendApprovalRequest(request, appointment, approver.admin);
    await pool.query(`UPDATE appointment_reschedule_requests SET approver_notified_at=NOW(),updated_at=NOW() WHERE id=$1 AND status='pending'`, [request.id]);
    await pool.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES ('client.reschedule_approval.approver_notified','appointment',$1,$2::jsonb)
    `, [appointment.id, JSON.stringify({ requestId: Number(request.id), approverStaffId: Number(appointment.staff_id), approverAdminId: Number(approver.admin.id) })]);
  } catch (error) {
    logger.error({ err: error, appointmentId: appointment.id, requestId: Number(request.id) }, 'Client reschedule approval notification failed');
    await pool.query(`UPDATE appointment_reschedule_requests SET status='notification_failed',decision_note=$2,updated_at=NOW() WHERE id=$1 AND status='pending'`, [request.id, String(error.message || error).slice(0, 1000)]);
    await pool.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES ('client.reschedule_approval.notification_failed','appointment',$1,$2::jsonb)
    `, [appointment.id, JSON.stringify({ requestId: Number(request.id), error: String(error.message || error).slice(0, 500) })]);
    return { status: 'notification_failed', reply: `I couldn’t safely send ${appointment.staff_name} the required approval request, so no change request is being held. Your current appointment remains unchanged.` };
  }

  return {
    status: 'pending_approval',
    requestId: Number(request.id),
    reply: [
      '*Reschedule request sent 🌿*',
      '',
      `We’ve asked ${appointment.staff_name} to approve your requested new time.`,
      '',
      `*Current:* ${fmtDateTime(appointment.starts_at)}`,
      `*Requested:* ${fmtDateTime(proposedStartsAt)}`,
      '',
      'Your current appointment remains confirmed and unchanged until the requested change is approved.',
    ].join('\n'),
  };
}

async function resolveAdminByWhatsApp(sender, db = pool) {
  const normalized = normalizePhone(sender);
  const result = await db.query(`
    SELECT id,staff_id,display_name,normalized_whatsapp
      FROM staff_admin_accounts
     WHERE normalized_whatsapp=$1 AND active=TRUE
     ORDER BY id
  `, [normalized]);
  if (result.rowCount !== 1) return null;
  return result.rows[0];
}

async function loadRequestContext(requestId, db = pool) {
  const result = await db.query(`
    SELECT request.*,
           a.location_id,a.starts_at AS current_starts_at,a.ends_at AS current_ends_at,a.status AS appointment_status,
           c.display_name AS client_name,
           COALESCE(s.name,aps.service_name_snapshot,a.title,'Shiloh appointment') AS service_name,
           COALESCE(st.display_name,ast.staff_name_snapshot,'Shiloh practitioner') AS staff_name,
           ast.staff_id AS current_staff_id,aps.service_id AS current_service_id,
           (SELECT COUNT(*)::int FROM appointment_staff x WHERE x.appointment_id=a.id) AS staff_count,
           (SELECT COUNT(*)::int FROM appointment_services x WHERE x.appointment_id=a.id) AS service_count,
           ace.event_id,
           (SELECT normalized_value FROM client_contacts cc WHERE cc.client_id=a.client_id AND LOWER(cc.contact_type) IN ('whatsapp','mobile','phone','telephone') AND cc.normalized_value IS NOT NULL ORDER BY cc.is_primary DESC,cc.id LIMIT 1) AS client_phone
      FROM appointment_reschedule_requests request
      JOIN appointments a ON a.id=request.appointment_id
      JOIN clients c ON c.id=a.client_id
      JOIN appointment_staff ast ON ast.appointment_id=a.id AND ast.position=1
      LEFT JOIN staff st ON st.id=ast.staff_id
      JOIN appointment_services aps ON aps.appointment_id=a.id AND aps.position=1
      LEFT JOIN services s ON s.id=aps.service_id
      LEFT JOIN appointment_calendar_events ace ON ace.appointment_id=a.id AND ace.provider='google_calendar'
     WHERE request.id=$1
     LIMIT 1
  `, [requestId]);
  return result.rows[0] || null;
}

async function sendDeclinedOutcome(context) {
  if (!context.client_phone) return { sent: false, reason: 'client_phone_unavailable' };
  const configured = String(process.env.WHATSAPP_RESCHEDULE_DECLINED_TEMPLATE || '').trim();
  if (configured !== DECLINED_TEMPLATE) return { sent: false, reason: 'template_not_configured' };
  try {
    await sendWhatsAppTemplate(
      context.client_phone,
      DECLINED_TEMPLATE,
      [
        context.client_name,
        context.service_name,
        fmtDateTime(context.proposed_starts_at),
        fmtDateTime(context.original_starts_at),
        String(context.appointment_id),
      ],
      process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en',
      ['client_reschedule_booking']
    );
    await pool.query(`UPDATE appointment_reschedule_requests SET client_notified_at=NOW(),updated_at=NOW() WHERE id=$1`, [context.id]);
    return { sent: true };
  } catch (error) {
    logger.error({ err: error, requestId: Number(context.id), appointmentId: Number(context.appointment_id) }, 'Client reschedule decline notification failed');
    return { sent: false, reason: 'send_failed' };
  }
}

async function approveRequest(admin, context) {
  const db = await pool.connect();
  let sharedEventId = context.event_id || null;
  let calendarMutationAttempted = false;
  let practitionerMutationAttempted = false;
  try {
    await db.query('BEGIN');
    const lockedResult = await db.query(`
      SELECT request.*,
             a.location_id,a.starts_at,a.ends_at,a.status AS appointment_status,
             ast.staff_id,COALESCE(st.display_name,ast.staff_name_snapshot,'Shiloh practitioner') AS staff_name,
             aps.service_id,
             COALESCE(c.display_name,a.source_client_name,'Client') AS client_name,
             COALESCE(s.name,aps.service_name_snapshot,a.title,'Shiloh appointment') AS service_name,
             (SELECT COUNT(*)::int FROM appointment_staff x WHERE x.appointment_id=a.id) AS staff_count,
             (SELECT COUNT(*)::int FROM appointment_services x WHERE x.appointment_id=a.id) AS service_count,
             ace.event_id
        FROM appointment_reschedule_requests request
        JOIN appointments a ON a.id=request.appointment_id
        JOIN clients c ON c.id=a.client_id
        JOIN appointment_staff ast ON ast.appointment_id=a.id AND ast.position=1
        LEFT JOIN staff st ON st.id=ast.staff_id
        JOIN appointment_services aps ON aps.appointment_id=a.id AND aps.position=1
        LEFT JOIN services s ON s.id=aps.service_id
        LEFT JOIN appointment_calendar_events ace ON ace.appointment_id=a.id AND ace.provider='google_calendar'
       WHERE request.id=$1
       FOR UPDATE OF request,a
    `, [context.id]);
    const locked = lockedResult.rows[0];
    if (!locked) { await db.query('ROLLBACK'); return { handled: true, reply: 'That reschedule approval request no longer exists.' }; }
    if (locked.status !== 'pending') { await db.query('ROLLBACK'); return { handled: true, reply: `This reschedule request has already been ${locked.status}.` }; }
    if (Number(admin.staff_id) !== Number(locked.approver_staff_id)) { await db.query('ROLLBACK'); return { handled: true, reply: 'You are not authorized to decide this reschedule request, so no change was made.' }; }
    if (locked.appointment_status === 'cancelled') {
      await db.query(`UPDATE appointment_reschedule_requests SET status='superseded',decided_at=NOW(),decided_by_admin_id=$2,decision_note='appointment cancelled',updated_at=NOW() WHERE id=$1`, [locked.id, admin.id]);
      await db.query('COMMIT');
      return { handled: true, reply: 'This reschedule request is no longer active because the appointment has been cancelled.' };
    }
    if (
      new Date(locked.starts_at).getTime() !== new Date(locked.original_starts_at).getTime()
      || new Date(locked.ends_at).getTime() !== new Date(locked.original_ends_at).getTime()
      || Number(locked.staff_id) !== Number(locked.approver_staff_id)
      || Number(locked.service_id || 0) !== Number(locked.current_service_id || locked.service_id || 0)
      || Number(locked.staff_count) !== 1
      || Number(locked.service_count) !== 1
    ) {
      await db.query(`UPDATE appointment_reschedule_requests SET status='superseded',decided_at=NOW(),decided_by_admin_id=$2,decision_note='canonical appointment changed',updated_at=NOW() WHERE id=$1`, [locked.id, admin.id]);
      await db.query('COMMIT');
      return { handled: true, reply: 'The original appointment changed after this request was made, so this approval request was closed without applying another change.' };
    }

    await db.query('SELECT pg_advisory_xact_lock($1::bigint)', [Number(locked.staff_id)]);
    const proposedStartsAt = new Date(locked.proposed_starts_at);
    const proposedEndsAt = new Date(locked.proposed_ends_at);
    const candidate = await validateCandidate({ db, appointment: locked, proposedStartsAt, proposedEndsAt, excludeRequestId: locked.id });
    if (!candidate.ok) {
      await db.query(`UPDATE appointment_reschedule_requests SET status='superseded',decided_at=NOW(),decided_by_admin_id=$2,decision_note=$3,updated_at=NOW() WHERE id=$1`, [locked.id, admin.id, `availability changed: ${candidate.reason}`]);
      await db.query('COMMIT');
      return { handled: true, reply: `That requested time is no longer safely available (${candidate.reason}). The original appointment remains unchanged.` };
    }
    const external = await validateExternalCalendars(locked, proposedStartsAt, proposedEndsAt);
    if (!external.ok) {
      await db.query(`UPDATE appointment_reschedule_requests SET status='superseded',decided_at=NOW(),decided_by_admin_id=$2,decision_note=$3,updated_at=NOW() WHERE id=$1`, [locked.id, admin.id, `calendar changed: ${external.reason}`]);
      await db.query('COMMIT');
      return { handled: true, reply: 'That requested time is no longer clear on the connected calendars. The original appointment remains unchanged.' };
    }
    sharedEventId = external.sharedEventId || locked.event_id || null;

    await db.query(`UPDATE appointments SET starts_at=$1,ends_at=$2,updated_at=NOW() WHERE id=$3`, [proposedStartsAt, proposedEndsAt, locked.appointment_id]);
    await db.query(`UPDATE appointment_lifecycle SET appointment_at=$1,appointment_ends_at=$2,reminder_sent_at=NULL,updated_at=NOW() WHERE appointment_id=$3`, [proposedStartsAt, proposedEndsAt, locked.appointment_id]);

    if (sharedEventId) {
      calendarMutationAttempted = true;
      await updateBookingEvent({
        eventId: sharedEventId,
        appointmentId: locked.appointment_id,
        startsAt: proposedStartsAt,
        endsAt: proposedEndsAt,
        clientName: locked.client_name,
        serviceName: locked.service_name,
        staffName: locked.staff_name,
      });
      await db.query(`UPDATE appointment_calendar_events SET sync_status='synced',last_error=NULL,updated_at=NOW() WHERE appointment_id=$1 AND provider='google_calendar'`, [locked.appointment_id]);
    }

    practitionerMutationAttempted = true;
    await syncPractitionerBookingEvent({
      appointmentId: locked.appointment_id,
      clientName: locked.client_name,
      serviceName: locked.service_name,
      staffName: locked.staff_name,
      startsAt: proposedStartsAt,
      endsAt: proposedEndsAt,
      source: 'client_reschedule_approval',
    });

    await db.query(`UPDATE appointment_reschedule_requests SET status='approved',decided_at=NOW(),decided_by_admin_id=$2,updated_at=NOW() WHERE id=$1`, [locked.id, admin.id]);
    await db.query(`INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason) VALUES($1,$2,$2,$3,'Client reschedule approved by practitioner')`, [locked.appointment_id, locked.appointment_status, `staff_admin:${admin.id}`]);
    const timeAudit = await db.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES ('appointment.time_updated','appointment',$1,$2::jsonb)
      RETURNING id
    `, [locked.appointment_id, JSON.stringify({ source: 'client_reschedule_approval', requestId: Number(locked.id), requestedByPhone: locked.requested_by_phone, approvedByAdminId: Number(admin.id), fromStart: locked.original_starts_at, toStart: proposedStartsAt.toISOString() })]);
    await db.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES ('client.reschedule_approval.approved','appointment',$1,$2::jsonb)
    `, [locked.appointment_id, JSON.stringify({ requestId: Number(locked.id), timeAuditEventId: Number(timeAudit.rows[0].id), approvedByAdminId: Number(admin.id), approvedByName: admin.display_name })]);
    await db.query('COMMIT');

    try {
      await queueCustomerChangeNotification(locked.appointment_id, 'time');
    } catch (notificationError) {
      logger.error({ err: notificationError, appointmentId: Number(locked.appointment_id), requestId: Number(locked.id) }, 'Approved client reschedule customer notification queue failed');
    }
    return {
      handled: true,
      status: 'approved',
      reply: `Approved by ${admin.display_name}. Appointment #${locked.appointment_id} has been moved to ${fmtDateTime(proposedStartsAt)} and the client update has been queued.`,
    };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    if ((calendarMutationAttempted || practitionerMutationAttempted) && context.original_starts_at && context.original_ends_at) {
      try {
        if (sharedEventId && calendarMutationAttempted) {
          await updateBookingEvent({
            eventId: sharedEventId,
            appointmentId: context.appointment_id,
            startsAt: context.original_starts_at,
            endsAt: context.original_ends_at,
            clientName: context.client_name,
            serviceName: context.service_name,
            staffName: context.staff_name,
          });
        }
        if (practitionerMutationAttempted) {
          await syncPractitionerBookingEvent({
            appointmentId: context.appointment_id,
            clientName: context.client_name,
            serviceName: context.service_name,
            staffName: context.staff_name,
            startsAt: context.original_starts_at,
            endsAt: context.original_ends_at,
            source: 'client_reschedule_approval_compensation',
          });
        }
      } catch (compensationError) {
        logger.error({ err: compensationError, appointmentId: Number(context.appointment_id), requestId: Number(context.id) }, 'Practitioner-approved reschedule calendar compensation failed');
      }
    }
    throw error;
  } finally {
    db.release();
  }
}

async function declineRequest(admin, context) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const result = await db.query(`SELECT * FROM appointment_reschedule_requests WHERE id=$1 FOR UPDATE`, [context.id]);
    const locked = result.rows[0];
    if (!locked) { await db.query('ROLLBACK'); return { handled: true, reply: 'That reschedule approval request no longer exists.' }; }
    if (Number(admin.staff_id) !== Number(locked.approver_staff_id)) { await db.query('ROLLBACK'); return { handled: true, reply: 'You are not authorized to decide this reschedule request, so no change was made.' }; }
    if (locked.status !== 'pending') { await db.query('ROLLBACK'); return { handled: true, reply: `This reschedule request has already been ${locked.status}.` }; }
    await db.query(`UPDATE appointment_reschedule_requests SET status='declined',decided_at=NOW(),decided_by_admin_id=$2,updated_at=NOW() WHERE id=$1`, [locked.id, admin.id]);
    await db.query(`
      INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
      VALUES ('client.reschedule_approval.declined','appointment',$1,$2::jsonb)
    `, [locked.appointment_id, JSON.stringify({ requestId: Number(locked.id), declinedByAdminId: Number(admin.id), declinedByName: admin.display_name })]);
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
  const delivery = await sendDeclinedOutcome(context);
  return {
    handled: true,
    status: 'declined',
    reply: delivery.sent
      ? `Declined by ${admin.display_name}. The client's original appointment is unchanged and the client has been notified.`
      : `Declined by ${admin.display_name}. The client's original appointment is unchanged. Client notification status: ${delivery.reason}.`,
  };
}

async function processRescheduleApprovalDecision(sender, text) {
  const decision = decisionFromText(text);
  if (!decision) return { handled: false };
  const admin = await resolveAdminByWhatsApp(sender);
  if (!admin) return { handled: true, reply: 'I can’t resolve this WhatsApp number to exactly one active staff admin identity, so no reschedule decision was recorded.' };
  const context = await loadRequestContext(decision.requestId);
  if (!context) return { handled: true, reply: 'That reschedule approval request no longer exists.' };
  if (Number(admin.staff_id) !== Number(context.approver_staff_id)) return { handled: true, reply: 'You are not authorized to decide this reschedule request, so no change was made.' };
  try {
    return decision.decision === 'approved' ? await approveRequest(admin, context) : await declineRequest(admin, context);
  } catch (error) {
    logger.error({ err: error, requestId: decision.requestId, decision: decision.decision }, 'Client reschedule approval decision failed');
    return { handled: true, reply: 'I couldn’t safely complete that reschedule decision. The canonical appointment was not intentionally changed; please review the request again or contact the clinic team.' };
  }
}

module.exports = {
  APPROVE_PREFIX,
  DECLINE_PREFIX,
  APPROVAL_TEMPLATE,
  DECLINED_TEMPLATE,
  featureEnabled,
  isClientConfirmation,
  decisionFromText,
  localDateTime,
  pendingRescheduleConflicts,
  createPendingRescheduleRequest,
  processRescheduleApprovalDecision,
  loadRequestContext,
};
