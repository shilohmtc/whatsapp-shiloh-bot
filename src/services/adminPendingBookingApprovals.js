const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { sendWhatsAppReplyButtons } = require('./whatsapp');
const { compactListTitle, fullLabelDescription } = require('../presentation/whatsappListRowPresentation');

const RESEND_PREFIX = 'resend_booking_approval_';

function fmtDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

async function ensureApprovalDeliveryState(db = pool) {
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approver_notification_attempts INTEGER NOT NULL DEFAULT 0`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approver_message_id TEXT`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS last_approver_notification_attempt_at TIMESTAMPTZ`);
}

async function adminForSender(sender, db = pool) {
  const result = await db.query(`SELECT id, staff_id, display_name, normalized_whatsapp, business_role, calendar_scope, permissions FROM staff_admin_accounts WHERE normalized_whatsapp = $1 AND active = TRUE ORDER BY id LIMIT 1`, [normalizePhone(sender)]);
  return result.rows[0] || null;
}

function authorizedWhere(admin) {
  if (!admin) return { sql: 'FALSE', params: [] };
  if (['owner', 'business_admin'].includes(admin.business_role) || admin.calendar_scope === 'all_business') {
    return { sql: '(aba.approver_admin_id = $1 OR aba.approver_staff_id = $2 OR aba.observer_staff_id = $2)', params: [admin.id, admin.staff_id || 0] };
  }
  return { sql: '(aba.approver_admin_id = $1 OR aba.approver_staff_id = $2 OR aba.observer_staff_id = $2)', params: [admin.id, admin.staff_id || 0] };
}

async function listPending(admin, db = pool) {
  await ensureApprovalDeliveryState(db);
  const auth = authorizedWhere(admin);
  const result = await db.query(`
    SELECT aba.appointment_id, aba.requested_at, aba.approver_notification_attempts,
           aba.approver_message_id, aba.last_approver_notification_attempt_at,
           a.starts_at, c.display_name AS client_name,
           COALESCE((SELECT string_agg(aps.service_name_snapshot, ' + ' ORDER BY aps.position)
                     FROM appointment_services aps WHERE aps.appointment_id = a.id), a.title) AS service_name,
           COALESCE((SELECT string_agg(ast.staff_name_snapshot, ' + ' ORDER BY ast.position)
                     FROM appointment_staff ast WHERE ast.appointment_id = a.id), s.display_name, saa.display_name) AS staff_name
    FROM appointment_booking_approvals aba
    JOIN appointments a ON a.id = aba.appointment_id
    JOIN clients c ON c.id = a.client_id
    LEFT JOIN staff s ON s.id = aba.approver_staff_id
    LEFT JOIN staff_admin_accounts saa ON saa.id = aba.approver_admin_id
    WHERE aba.status = 'pending' AND a.status <> 'cancelled' AND ${auth.sql}
    ORDER BY a.starts_at, aba.appointment_id
    LIMIT 8
  `, auth.params);
  return result.rows;
}

function pendingListInteractive(rows) {
  if (!rows.length) return null;
  return {
    type: 'list',
    body: '*Pending booking approvals*\nThese requests are still held and require an explicit approval or decline. Select one to resend its approval request safely.',
    buttonText: 'Pending approvals',
    sectionTitle: 'Pending approvals',
    rows: [
      ...rows.map((row) => ({
        id: `${RESEND_PREFIX}${row.appointment_id}`,
        title: compactListTitle(`#${row.appointment_id} ${row.client_name || 'Client'}`),
        description: fullLabelDescription(row.client_name || 'Client', `${row.service_name || 'Service'} • ${fmtDateTime(row.starts_at)}`),
      })),
      { id: 'menu', title: '← Back to Admin', description: 'Return to the main admin menu' },
    ],
  };
}

async function resendPendingApproval(admin, appointmentId, db = pool) {
  await ensureApprovalDeliveryState(db);
  const auth = authorizedWhere(admin);
  const result = await db.query(`
    SELECT aba.appointment_id, aba.status, a.starts_at, c.display_name AS client_name,
           COALESCE((SELECT string_agg(aps.service_name_snapshot, ' + ' ORDER BY aps.position) FROM appointment_services aps WHERE aps.appointment_id = a.id), a.title) AS service_name,
           COALESCE((SELECT string_agg(ast.staff_name_snapshot, ' + ' ORDER BY ast.position) FROM appointment_staff ast WHERE ast.appointment_id = a.id), practitioner.display_name, approver_admin.display_name) AS staff_name,
           COALESCE(approver_admin.normalized_whatsapp, approver_staff_admin.normalized_whatsapp) AS approver_whatsapp
    FROM appointment_booking_approvals aba
    JOIN appointments a ON a.id = aba.appointment_id
    JOIN clients c ON c.id = a.client_id
    LEFT JOIN staff practitioner ON practitioner.id = aba.approver_staff_id
    LEFT JOIN staff_admin_accounts approver_admin ON approver_admin.id = aba.approver_admin_id AND approver_admin.active = TRUE
    LEFT JOIN staff_admin_accounts approver_staff_admin ON approver_staff_admin.staff_id = aba.approver_staff_id AND approver_staff_admin.active = TRUE
    WHERE aba.appointment_id = $3 AND aba.status = 'pending' AND a.status <> 'cancelled' AND ${auth.sql}
    LIMIT 1
  `, [...auth.params, appointmentId]);
  const row = result.rows[0];
  if (!row) return { handled: true, reply: 'That pending approval is no longer available or you are not authorized to resend it.' };
  if (!row.approver_whatsapp) return { handled: true, reply: 'The approval request is still pending, but the approver has no active WhatsApp contact configured. No message was sent.' };

  const body = ['*Booking approval required*', '', `Client: ${row.client_name}`, `Treatment: ${row.service_name}`, `With: ${row.staff_name}`, `Time: ${fmtDateTime(row.starts_at)}`, '', 'This request is still pending. Approve or decline explicitly; resending does not create another appointment.'].join('\n');
  const response = await sendWhatsAppReplyButtons(row.approver_whatsapp, body, [
    { id: `booking_approval_approve_${appointmentId}`, title: 'Approve' },
    { id: `booking_approval_decline_${appointmentId}`, title: 'Decline' },
  ]);
  const messageId = response?.messages?.[0]?.id || null;
  await db.query(`UPDATE appointment_booking_approvals SET approver_notification_attempts = approver_notification_attempts + 1, approver_message_id = $2, last_approver_notification_attempt_at = NOW(), approver_notified_at = COALESCE(approver_notified_at, NOW()), updated_at = NOW() WHERE appointment_id = $1 AND status = 'pending'`, [appointmentId, messageId]);
  await db.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1, 'client.booking_approval.notification_attempted', 'appointment', $2, $3::jsonb)`, [admin.id, appointmentId, JSON.stringify({ channel: 'whatsapp', reason: 'explicit_admin_resend', messageId })]);
  return { handled: true, reply: `Approval request for appointment #${appointmentId} was resent. The appointment remains pending until an authorized approver decides it.` };
}

async function processAdminPendingBookingApprovalsMessage(sender, text) {
  const admin = await adminForSender(sender);
  if (!admin || admin.permissions?.['appointment:view'] !== true) return { handled: false };
  const raw = String(text || '').trim();
  if (/^(pending approvals|pending booking approvals|admin_action_pending_approvals)$/i.test(raw)) {
    const rows = await listPending(admin);
    const interactive = pendingListInteractive(rows);
    return interactive ? { handled: true, admin, interactive } : { handled: true, admin, reply: 'There are no pending booking approvals in your authorized scope.' };
  }
  const match = raw.match(/^resend_booking_approval_(\d+)$/i);
  if (!match) return { handled: false };
  return resendPendingApproval(admin, Number(match[1]));
}

module.exports = { RESEND_PREFIX, ensureApprovalDeliveryState, listPending, pendingListInteractive, processAdminPendingBookingApprovalsMessage, resendPendingApproval };
