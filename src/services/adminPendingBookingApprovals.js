const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { sendWhatsAppTemplate } = require('./whatsapp');
const {
  APPROVE_PREFIX,
  DECLINE_PREFIX,
  CONTROLLED_JUVAN_MODE,
  requestPractitionerApproval,
} = require('./clientBookingApproval');
const APPROVAL_TEMPLATE_NAME = 'shiloh_booking_approval_request_v1';
const TEMPLATE_LANGUAGE = 'en';
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
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approver_template_name TEXT`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS last_approver_notification_attempt_at TIMESTAMPTZ`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approval_mode TEXT NOT NULL DEFAULT 'standard'`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS backup_notified_at TIMESTAMPTZ`);
}

async function adminForSender(sender, db = pool) {
  const result = await db.query(`SELECT id,staff_id,display_name,normalized_whatsapp,business_role,calendar_scope,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE ORDER BY id LIMIT 1`, [normalizePhone(sender)]);
  return result.rows[0] || null;
}

function authorizedWhere(admin) {
  if (!admin) return { sql: 'FALSE', params: [] };
  return { sql: '(aba.approver_admin_id = $1 OR aba.approver_staff_id = $2 OR aba.observer_staff_id = $2)', params: [admin.id, admin.staff_id || 0] };
}

async function hasPendingForAdmin(admin, db = pool) {
  const auth = authorizedWhere(admin);
  const result = await db.query(`
    SELECT EXISTS(
      SELECT 1
        FROM appointment_booking_approvals aba
        JOIN appointments a ON a.id=aba.appointment_id
       WHERE aba.status='pending'
         AND a.status<>'cancelled'
         AND ${auth.sql}
    ) AS has_pending
  `, auth.params);
  return result.rows[0]?.has_pending === true;
}

async function listPending(admin, db = pool) {
  await ensureApprovalDeliveryState(db);
  const auth = authorizedWhere(admin);
  const result = await db.query(`
    SELECT aba.appointment_id,aba.requested_at,aba.approval_mode,aba.approver_staff_id,aba.approver_admin_id,
           aba.approver_notification_attempts,aba.approver_message_id,aba.last_approver_notification_attempt_at,
           a.starts_at,c.display_name AS client_name,
           COALESCE((SELECT string_agg(aps.service_name_snapshot,' + ' ORDER BY aps.position)
                     FROM appointment_services aps WHERE aps.appointment_id=a.id),a.title) AS service_name,
           COALESCE((SELECT string_agg(ast.staff_name_snapshot,' + ' ORDER BY ast.position)
                     FROM appointment_staff ast WHERE ast.appointment_id=a.id),primary_staff.display_name,backup_admin.display_name) AS staff_name,
           primary_staff.display_name AS primary_name,
           backup_admin.display_name AS backup_name,
           CASE
             WHEN aba.approval_mode=$3 AND aba.approver_admin_id=$1 THEN 'Backup'
             WHEN aba.approval_mode=$3 AND aba.approver_staff_id=$2 THEN 'Primary'
             WHEN aba.observer_staff_id=$2 THEN 'Observer'
             ELSE 'Approver'
           END AS viewer_role
      FROM appointment_booking_approvals aba
      JOIN appointments a ON a.id=aba.appointment_id
      JOIN clients c ON c.id=a.client_id
      LEFT JOIN staff primary_staff ON primary_staff.id=aba.approver_staff_id
      LEFT JOIN staff_admin_accounts backup_admin ON backup_admin.id=aba.approver_admin_id AND backup_admin.active=TRUE
     WHERE aba.status='pending' AND a.status<>'cancelled' AND ${auth.sql}
     ORDER BY a.starts_at,aba.appointment_id
     LIMIT 8
  `, [...auth.params, CONTROLLED_JUVAN_MODE]);
  return result.rows;
}

function pendingDescription(row) {
  const base = `${row.service_name || 'Service'} • ${fmtDateTime(row.starts_at)}`;
  if (row.approval_mode !== CONTROLLED_JUVAN_MODE) return base;
  return `${base} • Primary ${row.primary_name || 'unresolved'} • Backup ${row.backup_name || 'unresolved'} • You: ${row.viewer_role || 'Approver'}`;
}

function pendingListInteractive(rows) {
  if (!rows.length) return null;
  return {
    type: 'list',
    body: '*Pending booking approvals*\nThese requests are still held and require an explicit approval or decline. Controlled Juvan rows show Primary, Backup and your current role. Select one to safely refresh any missing approval delivery.',
    buttonText: 'Pending approvals',
    sectionTitle: 'Pending approvals',
    rows: [
      ...rows.map((row) => ({
        id: `${RESEND_PREFIX}${row.appointment_id}`,
        title: compactListTitle(`#${row.appointment_id} ${row.client_name || 'Client'}`),
        description: fullLabelDescription(row.client_name || 'Client', pendingDescription(row)),
      })),
      { id: 'menu', title: '← Back to Admin', description: 'Return to the main admin menu' },
    ],
  };
}

async function resendPendingApproval(admin, appointmentId, db = pool) {
  await ensureApprovalDeliveryState(db);
  const auth = authorizedWhere(admin);
  const result = await db.query(`
    SELECT aba.appointment_id,aba.status,aba.approval_mode,a.starts_at,c.display_name AS client_name,
           COALESCE((SELECT string_agg(aps.service_name_snapshot,' + ' ORDER BY aps.position) FROM appointment_services aps WHERE aps.appointment_id=a.id),a.title) AS service_name,
           COALESCE((SELECT string_agg(ast.staff_name_snapshot,' + ' ORDER BY ast.position) FROM appointment_staff ast WHERE ast.appointment_id=a.id),practitioner.display_name,approver_admin.display_name) AS staff_name,
           COALESCE(approver_admin.normalized_whatsapp,approver_staff_admin.normalized_whatsapp) AS approver_whatsapp
      FROM appointment_booking_approvals aba
      JOIN appointments a ON a.id=aba.appointment_id
      JOIN clients c ON c.id=a.client_id
      LEFT JOIN staff practitioner ON practitioner.id=aba.approver_staff_id
      LEFT JOIN staff_admin_accounts approver_admin ON approver_admin.id=aba.approver_admin_id AND approver_admin.active=TRUE
      LEFT JOIN staff_admin_accounts approver_staff_admin ON approver_staff_admin.staff_id=aba.approver_staff_id AND approver_staff_admin.active=TRUE
     WHERE aba.appointment_id=$3 AND aba.status='pending' AND a.status<>'cancelled' AND ${auth.sql}
     LIMIT 1
  `, [...auth.params, appointmentId]);
  const row = result.rows[0];
  if (!row) return { handled: true, reply: 'That pending approval is no longer available or you are not authorized to refresh it.' };

  if (row.approval_mode === CONTROLLED_JUVAN_MODE) {
    const refreshed = await requestPractitionerApproval({ appointmentId });
    if (!refreshed.sent) {
      return { handled: true, reply: `Controlled Juvan approval #${appointmentId} remains pending, but its current Primary/Backup delivery could not be refreshed safely (${refreshed.reason || 'blocked'}). No duplicate decision or confirmation was created.` };
    }
    return { handled: true, reply: `Controlled Juvan approval #${appointmentId} was revalidated against current CRM/appointment truth. Primary: ${refreshed.primaryApprover}. Backup: ${refreshed.backupApprover}. Any already-recorded delivery was not duplicated.` };
  }

  if (!row.approver_whatsapp) return { handled: true, reply: 'The approval request is still pending, but the approver has no active WhatsApp contact configured. No message was sent.' };
  const response = await sendWhatsAppTemplate(
    row.approver_whatsapp,
    APPROVAL_TEMPLATE_NAME,
    [row.client_name,row.service_name,row.staff_name,fmtDateTime(row.starts_at),String(appointmentId)],
    TEMPLATE_LANGUAGE,
    [`${APPROVE_PREFIX}${appointmentId}`,`${DECLINE_PREFIX}${appointmentId}`]
  );
  const messageId = response?.messages?.[0]?.id || null;
  await db.query(`UPDATE appointment_booking_approvals SET approver_notification_attempts=approver_notification_attempts+1,approver_message_id=$2,approver_template_name=$3,last_approver_notification_attempt_at=NOW(),approver_notified_at=COALESCE(approver_notified_at,NOW()),updated_at=NOW() WHERE appointment_id=$1 AND status='pending'`, [appointmentId,messageId,APPROVAL_TEMPLATE_NAME]);
  await db.query(`INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,'client.booking_approval.notification_attempted','appointment',$2,$3::jsonb)`, [admin.id,appointmentId,JSON.stringify({ channel:'whatsapp',reason:'explicit_admin_resend',templateName:APPROVAL_TEMPLATE_NAME,messageId })]);
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

module.exports = { APPROVAL_TEMPLATE_NAME,TEMPLATE_LANGUAGE,RESEND_PREFIX,ensureApprovalDeliveryState,hasPendingForAdmin,listPending,pendingDescription,pendingListInteractive,processAdminPendingBookingApprovalsMessage,resendPendingApproval };
