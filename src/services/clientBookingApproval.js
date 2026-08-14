const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { sendWhatsAppMessage, sendWhatsAppReplyButtons } = require('./whatsapp');
const { sendCustomerBookingConfirmationForAppointment } = require('./customerBookingConfirmation');
const { cancelBookingEvent } = require('./googleBookingCalendar');
const { cancelPractitionerBookingEvent } = require('./practitionerGoogleCalendar');
const logger = require('../lib/logger');

const APPROVE_PREFIX = 'booking_approval_approve_';
const DECLINE_PREFIX = 'booking_approval_decline_';

function fmtDateTime(value) {
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

async function ensureBookingApprovalTable(db = pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS appointment_booking_approvals (
      appointment_id BIGINT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
      approver_staff_id BIGINT NOT NULL REFERENCES staff(id),
      observer_staff_id BIGINT REFERENCES staff(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approver_notified_at TIMESTAMPTZ,
      observer_notified_at TIMESTAMPTZ,
      decided_at TIMESTAMPTZ,
      decided_by_admin_id BIGINT,
      decision_note TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_status ON appointment_booking_approvals(status, requested_at)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_approver ON appointment_booking_approvals(approver_staff_id, status)`);
}

async function resolveObserverStaffId(db, staffName) {
  // Compatibility column: for Abigail bookings this stores Christel as the second authorized decision-maker.
  if (String(staffName || '').trim().toLowerCase() !== 'abigail') return null;
  const result = await db.query(`
    SELECT id
      FROM staff
     WHERE LOWER(display_name) = 'christel'
       AND status = 'active'
     ORDER BY id
     LIMIT 1
  `);
  return result.rows[0]?.id || null;
}

async function createPendingBookingApproval(db, { appointmentId, staffId, staffName }) {
  await ensureBookingApprovalTable(db);
  const observerStaffId = await resolveObserverStaffId(db, staffName);
  const result = await db.query(`
    INSERT INTO appointment_booking_approvals
      (appointment_id, approver_staff_id, observer_staff_id, status)
    VALUES ($1, $2, $3, 'pending')
    ON CONFLICT (appointment_id) DO UPDATE SET
      approver_staff_id = EXCLUDED.approver_staff_id,
      observer_staff_id = EXCLUDED.observer_staff_id,
      updated_at = NOW()
    RETURNING appointment_id, approver_staff_id, observer_staff_id, status
  `, [appointmentId, staffId, observerStaffId]);
  return result.rows[0];
}

async function approvalContext(appointmentId, db = pool) {
  await ensureBookingApprovalTable(db);
  const result = await db.query(`
    SELECT aba.appointment_id, aba.approver_staff_id, aba.observer_staff_id, aba.status,
           aba.approver_notified_at, aba.observer_notified_at,
           a.client_id, a.starts_at, a.ends_at, a.status AS appointment_status,
           c.display_name AS client_name,
           COALESCE((SELECT string_agg(aps.service_name_snapshot, ' + ' ORDER BY aps.position)
                       FROM appointment_services aps WHERE aps.appointment_id = a.id), a.title) AS service_name,
           COALESCE((SELECT string_agg(ast.staff_name_snapshot, ' + ' ORDER BY ast.position)
                       FROM appointment_staff ast WHERE ast.appointment_id = a.id), approver.display_name) AS staff_name,
           approver.display_name AS approver_name,
           observer.display_name AS observer_name
      FROM appointment_booking_approvals aba
      JOIN appointments a ON a.id = aba.appointment_id
      JOIN clients c ON c.id = a.client_id
      JOIN staff approver ON approver.id = aba.approver_staff_id
      LEFT JOIN staff observer ON observer.id = aba.observer_staff_id
     WHERE aba.appointment_id = $1
  `, [appointmentId]);
  return result.rows[0] || null;
}

async function adminContactForStaff(staffId, db = pool) {
  const result = await db.query(`
    SELECT id, staff_id, display_name, normalized_whatsapp
      FROM staff_admin_accounts
     WHERE staff_id = $1
       AND active = TRUE
       AND normalized_whatsapp IS NOT NULL
     ORDER BY id
     LIMIT 1
  `, [staffId]);
  return result.rows[0] || null;
}

async function clientPhone(clientId, db = pool) {
  const result = await db.query(`
    SELECT normalized_value
      FROM client_contacts
     WHERE client_id = $1
       AND contact_type IN ('whatsapp', 'phone', 'mobile')
       AND normalized_value IS NOT NULL
     ORDER BY is_primary DESC, id
     LIMIT 1
  `, [clientId]);
  return result.rows[0]?.normalized_value || null;
}

function approvalButtons(appointmentId) {
  return [
    { id: `${APPROVE_PREFIX}${appointmentId}`, title: 'Approve' },
    { id: `${DECLINE_PREFIX}${appointmentId}`, title: 'Decline' },
  ];
}

function isAuthorizedDecisionMaker(admin, context) {
  if (!admin || !context) return false;
  if (Number(context.approver_staff_id) === Number(admin.staff_id)) return true;
  return Boolean(context.observer_staff_id)
    && Number(context.observer_staff_id) === Number(admin.staff_id);
}

function approvalRequestBody(context) {
  return [
    '*Booking approval required*',
    '',
    `Client: ${context.client_name}`,
    `Treatment: ${context.service_name}`,
    `With: ${context.staff_name}`,
    `Time: ${fmtDateTime(context.starts_at)}`,
    '',
    'This time is being held and will remain unavailable until an authorized approver approves or declines the request.',
    context.observer_staff_id ? 'For Abigail bookings, either Abigail or Christel may make the first decision.' : null,
  ].filter(Boolean).join('\n');
}

async function requestPractitionerApproval({ appointmentId }) {
  const context = await approvalContext(appointmentId);
  if (!context || context.status !== 'pending' || context.appointment_status === 'cancelled') {
    return { sent: false, reason: 'not_pending' };
  }

  const approver = await adminContactForStaff(context.approver_staff_id);
  if (!approver) {
    await pool.query(`
      INSERT INTO crm_audit_events (action, entity_type, entity_id, metadata)
      VALUES ('client.booking_approval.notification_blocked', 'appointment', $1, $2::jsonb)
    `, [appointmentId, JSON.stringify({ reason: 'approver_whatsapp_unavailable', approverStaffId: context.approver_staff_id })]);
    return { sent: false, reason: 'approver_whatsapp_unavailable' };
  }

  const body = approvalRequestBody(context);
  if (!context.approver_notified_at) {
    await sendWhatsAppReplyButtons(approver.normalized_whatsapp, body, approvalButtons(appointmentId));
    await pool.query(`UPDATE appointment_booking_approvals SET approver_notified_at = NOW(), updated_at = NOW() WHERE appointment_id = $1 AND status = 'pending'`, [appointmentId]);
  }

  if (context.observer_staff_id && !context.observer_notified_at) {
    const observer = await adminContactForStaff(context.observer_staff_id);
    if (observer) {
      await sendWhatsAppReplyButtons(observer.normalized_whatsapp, body, approvalButtons(appointmentId));
      await pool.query(`UPDATE appointment_booking_approvals SET observer_notified_at = NOW(), updated_at = NOW() WHERE appointment_id = $1 AND status = 'pending'`, [appointmentId]);
    }
  }

  return { sent: true, approver: context.approver_name, secondaryApprover: context.observer_name || null };
}

function parseApprovalDecision(value = '') {
  const text = String(value || '').trim().toLowerCase();
  let match = text.match(/^booking_approval_approve_(\d+)$/);
  if (match) return { appointmentId: Number(match[1]), decision: 'approved' };
  match = text.match(/^booking_approval_decline_(\d+)$/);
  if (match) return { appointmentId: Number(match[1]), decision: 'declined' };
  return null;
}

async function resolveAdminByWhatsApp(sender, db = pool) {
  const normalized = normalizePhone(sender);
  const result = await db.query(`
    SELECT id, staff_id, display_name, normalized_whatsapp
      FROM staff_admin_accounts
     WHERE normalized_whatsapp = $1
       AND active = TRUE
     ORDER BY id
     LIMIT 1
  `, [normalized]);
  return result.rows[0] || null;
}

async function notifyOtherDecisionMaker(context, decision, decidingAdmin) {
  if (!context?.observer_staff_id) return;
  const otherStaffId = Number(decidingAdmin.staff_id) === Number(context.approver_staff_id)
    ? context.observer_staff_id
    : context.approver_staff_id;
  const other = await adminContactForStaff(otherStaffId);
  if (!other || Number(other.id) === Number(decidingAdmin.id)) return;
  await sendWhatsAppMessage(other.normalized_whatsapp, [
    '*Abigail booking request update*',
    '',
    `${context.client_name} — ${context.service_name} — ${fmtDateTime(context.starts_at)}`,
    `${decidingAdmin.display_name} has ${decision === 'approved' ? 'approved' : 'declined'} the request.`,
    'The first valid decision is final for this request.',
  ].join('\n'));
}

async function approveBookingRequest(admin, context) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const locked = await db.query(`
      SELECT aba.status, aba.approver_staff_id, aba.observer_staff_id, a.status AS appointment_status
        FROM appointment_booking_approvals aba
        JOIN appointments a ON a.id = aba.appointment_id
       WHERE aba.appointment_id = $1
       FOR UPDATE
    `, [context.appointment_id]);
    const row = locked.rows[0];
    if (!row) {
      await db.query('ROLLBACK');
      return { handled: true, reply: 'That booking approval request no longer exists.' };
    }
    if (!isAuthorizedDecisionMaker(admin, row)) {
      await db.query('ROLLBACK');
      return { handled: true, reply: 'You are not authorized to decide this booking request, so no decision was recorded.' };
    }
    if (row.status !== 'pending') {
      await db.query('ROLLBACK');
      return { handled: true, reply: `This booking request has already been ${row.status}.` };
    }
    if (row.appointment_status === 'cancelled') {
      await db.query(`UPDATE appointment_booking_approvals SET status = 'declined', decided_at = NOW(), decided_by_admin_id = $2, decision_note = 'appointment already cancelled', updated_at = NOW() WHERE appointment_id = $1`, [context.appointment_id, admin.id]);
      await db.query('COMMIT');
      return { handled: true, reply: 'This booking request is no longer active because the appointment was already cancelled.' };
    }

    await db.query(`UPDATE appointment_booking_approvals SET status = 'approved', decided_at = NOW(), decided_by_admin_id = $2, updated_at = NOW() WHERE appointment_id = $1 AND status = 'pending'`, [context.appointment_id, admin.id]);
    await db.query(`INSERT INTO crm_audit_events (action, entity_type, entity_id, metadata) VALUES ('client.booking_approval.approved', 'appointment', $1, $2::jsonb)`, [context.appointment_id, JSON.stringify({ decisionMakerStaffId: admin.staff_id, decisionMakerAdminId: admin.id, decisionMakerName: admin.display_name })]);
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  const confirmation = await sendCustomerBookingConfirmationForAppointment(context.appointment_id);
  try { await notifyOtherDecisionMaker(context, 'approved', admin); } catch (error) { logger.warn({ err: error, appointmentId: context.appointment_id }, 'Booking approval peer outcome notification failed'); }
  return {
    handled: true,
    status: 'approved',
    reply: confirmation.sent
      ? `Approved by ${admin.display_name}. Appointment #${context.appointment_id} is confirmed and the client confirmation has been sent.`
      : `Approved by ${admin.display_name}. Appointment #${context.appointment_id} is confirmed. Client confirmation delivery status: ${confirmation.reason || 'not sent'}.`,
  };
}

async function declineBookingRequest(admin, context) {
  const db = await pool.connect();
  let sharedEventId = null;
  try {
    await db.query('BEGIN');
    const locked = await db.query(`
      SELECT aba.status, aba.approver_staff_id, aba.observer_staff_id, a.status AS appointment_status,
             (SELECT event_id FROM appointment_calendar_events ace WHERE ace.appointment_id = a.id AND ace.provider = 'google_calendar' LIMIT 1) AS shared_event_id
        FROM appointment_booking_approvals aba
        JOIN appointments a ON a.id = aba.appointment_id
       WHERE aba.appointment_id = $1
       FOR UPDATE
    `, [context.appointment_id]);
    const row = locked.rows[0];
    if (!row) {
      await db.query('ROLLBACK');
      return { handled: true, reply: 'That booking approval request no longer exists.' };
    }
    if (!isAuthorizedDecisionMaker(admin, row)) {
      await db.query('ROLLBACK');
      return { handled: true, reply: 'You are not authorized to decide this booking request, so no decision was recorded.' };
    }
    if (row.status !== 'pending') {
      await db.query('ROLLBACK');
      return { handled: true, reply: `This booking request has already been ${row.status}.` };
    }
    sharedEventId = row.shared_event_id || null;
    await db.query(`UPDATE appointment_booking_approvals SET status = 'declined', decided_at = NOW(), decided_by_admin_id = $2, updated_at = NOW() WHERE appointment_id = $1 AND status = 'pending'`, [context.appointment_id, admin.id]);
    if (row.appointment_status !== 'cancelled') {
      await db.query(`UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status <> 'cancelled'`, [context.appointment_id]);
      await db.query(`INSERT INTO appointment_status_history (appointment_id, from_status, to_status, changed_by, reason) VALUES ($1, $2, 'cancelled', $3, 'Authorized practitioner/supervisor declined client booking request')`, [context.appointment_id, row.appointment_status, `admin:${admin.id}`]);
    }
    await db.query(`INSERT INTO crm_audit_events (action, entity_type, entity_id, metadata) VALUES ('client.booking_approval.declined', 'appointment', $1, $2::jsonb)`, [context.appointment_id, JSON.stringify({ decisionMakerStaffId: admin.staff_id, decisionMakerAdminId: admin.id, decisionMakerName: admin.display_name })]);
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  if (sharedEventId) {
    try { await cancelBookingEvent(sharedEventId); } catch (error) { logger.error({ err: error, appointmentId: context.appointment_id }, 'Declined booking shared-calendar release failed'); }
  }
  try { await cancelPractitionerBookingEvent({ appointmentId: context.appointment_id, staffName: context.staff_name }); } catch (error) { logger.error({ err: error, appointmentId: context.appointment_id }, 'Declined booking practitioner-calendar release failed'); }

  const phone = await clientPhone(context.client_id);
  if (phone) {
    try {
      await sendWhatsAppMessage(phone, [
        '*Booking request update*',
        '',
        `Your request for ${context.service_name} on ${fmtDateTime(context.starts_at)} could not be confirmed.`,
        'The held time has been released. Nothing is booked.',
        '',
        'Reply *BOOKING* when you would like to choose another available time. 🌿',
      ].join('\n'));
    } catch (error) {
      logger.error({ err: error, appointmentId: context.appointment_id }, 'Declined booking client notification failed');
    }
  }
  try { await notifyOtherDecisionMaker(context, 'declined', admin); } catch (error) { logger.warn({ err: error, appointmentId: context.appointment_id }, 'Booking decline peer outcome notification failed'); }

  return { handled: true, status: 'declined', reply: `Declined by ${admin.display_name}. Appointment request #${context.appointment_id} was cancelled and the held time was released.` };
}

async function processClientBookingApprovalMessage(sender, text) {
  const decision = parseApprovalDecision(text);
  if (!decision) return { handled: false };
  await ensureBookingApprovalTable();
  const admin = await resolveAdminByWhatsApp(sender);
  if (!admin) return { handled: true, reply: 'This approval action is restricted to an authorized Shiloh practitioner or supervisor.' };
  const context = await approvalContext(decision.appointmentId);
  if (!context) return { handled: true, reply: 'That booking approval request no longer exists.' };
  if (!isAuthorizedDecisionMaker(admin, context)) {
    return { handled: true, reply: 'You are not authorized to decide this booking request, so no decision was recorded.' };
  }
  return decision.decision === 'approved'
    ? approveBookingRequest(admin, context)
    : declineBookingRequest(admin, context);
}

module.exports = {
  APPROVE_PREFIX,
  DECLINE_PREFIX,
  approvalButtons,
  createPendingBookingApproval,
  ensureBookingApprovalTable,
  isAuthorizedDecisionMaker,
  parseApprovalDecision,
  processClientBookingApprovalMessage,
  requestPractitionerApproval,
};
