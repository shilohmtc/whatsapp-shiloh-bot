const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { sendWhatsAppMessage, sendWhatsAppReplyButtons, sendWhatsAppTemplate } = require('./whatsapp');
const { sendCustomerBookingConfirmationForAppointment } = require('./customerBookingConfirmation');
const {
  DEMO_KEY,
  resolveCurrentControlledDemoClient,
  getControlledDemoIdentity,
} = require('./controlledDemoIdentity');
const logger = require('../lib/logger');

const APPROVE_PREFIX = 'booking_approval_approve_';
const DECLINE_PREFIX = 'booking_approval_decline_';
const DUMMY_TEST_DISPLAY_NAME = 'Dummy Test';
const JUVAN_POLICY_KEY = 'juvan_botha_jp_booking_approval';
const JP_DISPLAY_NAME = 'Jean-Pierre';
const CONTROLLED_JUVAN_MODE = 'controlled_juvan_primary_backup';
const TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';

function fmtDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

async function ensureBookingApprovalTable(db = pool) {
  await db.query(`CREATE TABLE IF NOT EXISTS appointment_booking_approvals (appointment_id BIGINT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE, approver_staff_id BIGINT REFERENCES staff(id), approver_admin_id BIGINT REFERENCES staff_admin_accounts(id), observer_staff_id BIGINT REFERENCES staff(id), status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')), approval_mode TEXT NOT NULL DEFAULT 'standard', requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), approver_notified_at TIMESTAMPTZ, backup_notified_at TIMESTAMPTZ, observer_notified_at TIMESTAMPTZ, decided_at TIMESTAMPTZ, decided_by_admin_id BIGINT, decision_note TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approver_admin_id BIGINT REFERENCES staff_admin_accounts(id)`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approval_mode TEXT NOT NULL DEFAULT 'standard'`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS backup_notified_at TIMESTAMPTZ`);
  await db.query(`ALTER TABLE appointment_booking_approvals ALTER COLUMN approver_staff_id DROP NOT NULL`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_status ON appointment_booking_approvals(status, requested_at)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_approver ON appointment_booking_approvals(approver_staff_id, status)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_admin_approver ON appointment_booking_approvals(approver_admin_id, status)`);
  await db.query(`CREATE TABLE IF NOT EXISTS client_booking_approval_policies (policy_key TEXT PRIMARY KEY, client_id BIGINT UNIQUE REFERENCES clients(id) ON DELETE RESTRICT, approver_admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE RESTRICT, expected_display_name TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query(`ALTER TABLE client_booking_approval_policies ALTER COLUMN client_id DROP NOT NULL`);
}

async function resolveObserverStaffId(db, staffName) {
  if (String(staffName || '').trim().toLowerCase() !== 'abigail') return null;
  const result = await db.query(`SELECT id FROM staff WHERE LOWER(display_name) = 'christel' AND status = 'active' ORDER BY id LIMIT 1`);
  return result.rows[0]?.id || null;
}

async function primaryAssignment(db, appointmentId) {
  const result = await db.query(`
    SELECT ast.staff_id, st.display_name
      FROM appointment_staff ast
      JOIN staff st ON st.id=ast.staff_id
     WHERE ast.appointment_id=$1
       AND ast.position=1
       AND st.status='active'
     ORDER BY ast.id
     LIMIT 1`, [appointmentId]);
  return result.rows[0] || null;
}

async function exactJeanPierreAdmin(db, adminId) {
  if (!adminId) return null;
  const result = await db.query(`
    SELECT id,staff_id,display_name,normalized_whatsapp,business_role,calendar_scope,service_scope
      FROM staff_admin_accounts
     WHERE id=$1
       AND LOWER(TRIM(display_name))='jean-pierre'
       AND active=TRUE
       AND business_role='business_admin'
       AND calendar_scope='all_business'
       AND service_scope='all_services'
       AND normalized_whatsapp IS NOT NULL`, [adminId]);
  return result.rowCount === 1 ? result.rows[0] : null;
}

async function resolveJuvanApprovalPolicy(db, appointmentId) {
  const appointment = await db.query(`SELECT id,client_id FROM appointments WHERE id=$1`, [appointmentId]);
  const row = appointment.rows[0];
  if (!row) return null;

  const state = await resolveCurrentControlledDemoClient(db);
  const currentId = state.client?.id == null ? null : Number(state.client.id);
  if (state.status !== 'bound') {
    if (currentId != null && Number(row.client_id) === currentId) {
      throw new Error(`Controlled Juvan booking approval blocked: current demo identity is ${state.status}`);
    }
    return null;
  }
  if (Number(row.client_id) !== currentId) return null;

  const primary = await primaryAssignment(db, appointmentId);
  if (!primary?.staff_id) throw new Error('Controlled Juvan booking approval blocked: assigned Primary practitioner could not be resolved');
  const backup = await exactJeanPierreAdmin(db, state.approverAdminId);
  if (!backup) throw new Error('Controlled Juvan booking approval blocked: Jean-Pierre backup authority drifted');

  return {
    approverAdminId: Number(backup.id),
    approverStaffId: Number(primary.staff_id),
    observerStaffId: null,
    mode: CONTROLLED_JUVAN_MODE,
    clientId: currentId,
    primaryName: primary.display_name,
    backupName: backup.display_name,
  };
}

async function resolveDummyTestApprovalPolicy(db, appointmentId) {
  const appointment = await db.query(`SELECT a.client_id, c.display_name, (SELECT COUNT(*)::int FROM clients dc WHERE LOWER(TRIM(dc.display_name)) = LOWER($2) AND dc.status = 'active') AS active_dummy_count FROM appointments a JOIN clients c ON c.id = a.client_id WHERE a.id = $1`, [appointmentId, DUMMY_TEST_DISPLAY_NAME]);
  const row = appointment.rows[0];
  if (!row || String(row.display_name || '').trim().toLowerCase() !== DUMMY_TEST_DISPLAY_NAME.toLowerCase()) return null;
  if (Number(row.active_dummy_count) !== 1) throw new Error(`Dummy Test approval blocked: expected exactly one active CRM ${DUMMY_TEST_DISPLAY_NAME} profile`);
  const jp = await db.query(`SELECT saa.id AS admin_id, saa.display_name, saa.normalized_whatsapp FROM staff_admin_accounts saa WHERE LOWER(TRIM(saa.display_name)) = LOWER($1) AND saa.active = TRUE AND saa.business_role = 'business_admin' AND saa.calendar_scope = 'all_business' AND saa.service_scope = 'all_services' AND saa.normalized_whatsapp IS NOT NULL ORDER BY saa.id`, [JP_DISPLAY_NAME]);
  if (jp.rowCount !== 1) throw new Error(`Dummy Test approval blocked: expected exactly one active ${JP_DISPLAY_NAME} business_admin account with all_business/all_services scope and WhatsApp identity`);
  return { approverAdminId: Number(jp.rows[0].admin_id), approverStaffId: null, observerStaffId: null, mode: 'standard' };
}

async function resolveClientApprovalPolicy(db, appointmentId) {
  return (await resolveJuvanApprovalPolicy(db, appointmentId)) || resolveDummyTestApprovalPolicy(db, appointmentId);
}

async function createPendingBookingApproval(db, { appointmentId, staffId, staffName }) {
  await ensureBookingApprovalTable(db);
  const specialPolicy = await resolveClientApprovalPolicy(db, appointmentId);
  const controlledJuvan = specialPolicy?.mode === CONTROLLED_JUVAN_MODE;
  const observerStaffId = specialPolicy ? null : await resolveObserverStaffId(db, staffName);
  const approverStaffId = controlledJuvan ? specialPolicy.approverStaffId : (specialPolicy ? null : Number(staffId));
  const approverAdminId = specialPolicy?.approverAdminId || null;
  const approvalMode = controlledJuvan ? CONTROLLED_JUVAN_MODE : 'standard';
  const result = await db.query(`
    INSERT INTO appointment_booking_approvals
      (appointment_id,approver_staff_id,approver_admin_id,observer_staff_id,status,approval_mode)
    VALUES ($1,$2,$3,$4,'pending',$5)
    ON CONFLICT (appointment_id) DO UPDATE SET
      approver_staff_id=EXCLUDED.approver_staff_id,
      approver_admin_id=EXCLUDED.approver_admin_id,
      observer_staff_id=EXCLUDED.observer_staff_id,
      approval_mode=EXCLUDED.approval_mode,
      updated_at=NOW()
    WHERE appointment_booking_approvals.status='pending'
    RETURNING appointment_id,approver_staff_id,approver_admin_id,observer_staff_id,status,approval_mode`,
  [appointmentId, approverStaffId, approverAdminId, observerStaffId, approvalMode]);
  return result.rows[0] || null;
}

async function approvalContext(appointmentId, db = pool) {
  await ensureBookingApprovalTable(db);
  const result = await db.query(`
    SELECT aba.appointment_id,aba.approver_staff_id,aba.approver_admin_id,aba.observer_staff_id,
           aba.status,aba.approval_mode,aba.approver_notified_at,aba.backup_notified_at,aba.observer_notified_at,
           aba.decided_at,aba.decided_by_admin_id,aba.decision_note,
           a.client_id,a.crm_v2_client_id,a.starts_at,a.ends_at,a.status AS appointment_status,
           CASE WHEN a.crm_v2_client_id IS NOT NULL THEN 'crm_v2' ELSE 'legacy' END AS identity_model,
           COALESCE(v2.name,c.display_name,a.source_client_name) AS client_name,
           CASE WHEN a.crm_v2_client_id IS NOT NULL THEN v2.normalized_mobile
                ELSE (SELECT normalized_value FROM client_contacts cc WHERE cc.client_id=a.client_id AND contact_type IN ('whatsapp','mobile') AND normalized_value IS NOT NULL ORDER BY is_primary DESC,id LIMIT 1)
           END AS client_phone,
           COALESCE((SELECT string_agg(aps.service_name_snapshot, ' + ' ORDER BY aps.position) FROM appointment_services aps WHERE aps.appointment_id=a.id),a.title) AS service_name,
           COALESCE((SELECT string_agg(ast.staff_name_snapshot, ' + ' ORDER BY ast.position) FROM appointment_staff ast WHERE ast.appointment_id=a.id),primary_staff.display_name,backup_admin.display_name) AS staff_name,
           primary_staff.display_name AS primary_name,
           backup_admin.display_name AS backup_name,
           observer.display_name AS observer_name
      FROM appointment_booking_approvals aba
      JOIN appointments a ON a.id=aba.appointment_id
      LEFT JOIN clients c ON c.id=a.client_id
      LEFT JOIN crm_v2_clients v2 ON v2.id=a.crm_v2_client_id AND v2.status='active'
      LEFT JOIN staff primary_staff ON primary_staff.id=aba.approver_staff_id
      LEFT JOIN staff_admin_accounts backup_admin ON backup_admin.id=aba.approver_admin_id AND backup_admin.active=TRUE
      LEFT JOIN staff observer ON observer.id=aba.observer_staff_id
     WHERE aba.appointment_id=$1
       AND num_nonnulls(a.client_id,a.crm_v2_client_id)=1
       AND (a.crm_v2_client_id IS NULL OR v2.id IS NOT NULL)`, [appointmentId]);
  return result.rows[0] || null;
}

async function adminContactForStaff(staffId, db = pool) {
  if (!staffId) return null;
  const result = await db.query(`SELECT id,staff_id,display_name,normalized_whatsapp FROM staff_admin_accounts WHERE staff_id=$1 AND active=TRUE AND normalized_whatsapp IS NOT NULL ORDER BY id LIMIT 1`, [staffId]);
  return result.rows[0] || null;
}

async function adminContactForAdmin(adminId, db = pool) {
  if (!adminId) return null;
  const result = await db.query(`SELECT id,staff_id,display_name,normalized_whatsapp FROM staff_admin_accounts WHERE id=$1 AND active=TRUE AND normalized_whatsapp IS NOT NULL LIMIT 1`, [adminId]);
  return result.rows[0] || null;
}

async function clientPhone(clientId, db = pool) {
  const result = await db.query(`SELECT normalized_value FROM client_contacts WHERE client_id=$1 AND contact_type IN ('whatsapp','mobile') AND normalized_value IS NOT NULL ORDER BY is_primary DESC,id LIMIT 1`, [clientId]);
  return result.rows[0]?.normalized_value || null;
}

function approvalButtons(appointmentId) {
  return [{ id: `${APPROVE_PREFIX}${appointmentId}`, title: 'Approve' }, { id: `${DECLINE_PREFIX}${appointmentId}`, title: 'Decline' }];
}

function isAuthorizedDecisionMaker(admin, context) {
  if (!admin || !context) return false;
  if (context.approver_admin_id && Number(context.approver_admin_id) === Number(admin.id)) return true;
  if (context.approver_staff_id && Number(context.approver_staff_id) === Number(admin.staff_id)) return true;
  return Boolean(context.observer_staff_id) && Number(context.observer_staff_id) === Number(admin.staff_id);
}

async function sendApprovalRequest(to, context, role = null) {
  const primary = context.primary_name || context.staff_name || 'Assigned practitioner';
  const backup = context.backup_name || JP_DISPLAY_NAME;
  const staffPresentation = role
    ? `${primary} | Primary: ${primary} | Backup: ${backup} | Your role: ${role}`
    : context.staff_name;
  return sendWhatsAppTemplate(to, 'shiloh_booking_approval_request_v1', [context.client_name, context.service_name, staffPresentation, fmtDateTime(context.starts_at), String(context.appointment_id)], TEMPLATE_LANGUAGE, [`${APPROVE_PREFIX}${context.appointment_id}`, `${DECLINE_PREFIX}${context.appointment_id}`]);
}

async function validateControlledJuvanRead(context, db = pool) {
  const state = await resolveCurrentControlledDemoClient(db);
  if (state.status !== 'bound' || Number(state.client?.id) !== Number(context.client_id)) {
    return { ok: false, reason: `controlled_identity_${state.status}` };
  }
  const primary = await primaryAssignment(db, context.appointment_id);
  const backup = await exactJeanPierreAdmin(db, state.approverAdminId);
  if (!primary?.staff_id || !backup) return { ok: false, reason: 'approver_truth_unavailable' };
  if (Number(primary.staff_id) !== Number(context.approver_staff_id)
      || Number(backup.id) !== Number(context.approver_admin_id)) {
    return { ok: false, reason: 'stored_approver_truth_drift' };
  }
  return { ok: true, state, primary, backup };
}

async function requestControlledJuvanApproval(context) {
  const validation = await validateControlledJuvanRead(context);
  if (!validation.ok) {
    await pool.query(`INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata) VALUES ('client.booking_approval.notification_blocked','appointment',$1,$2::jsonb)`, [context.appointment_id, JSON.stringify({ reason: validation.reason, approvalMode: CONTROLLED_JUVAN_MODE })]);
    return { sent: false, reason: validation.reason };
  }

  const primaryContact = await adminContactForStaff(validation.primary.staff_id);
  const backupContact = await adminContactForAdmin(validation.backup.id);
  if (!primaryContact || !backupContact) {
    const reason = !primaryContact ? 'primary_whatsapp_unavailable' : 'backup_whatsapp_unavailable';
    await pool.query(`INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata) VALUES ('client.booking_approval.notification_blocked','appointment',$1,$2::jsonb)`, [context.appointment_id, JSON.stringify({ reason, approvalMode: CONTROLLED_JUVAN_MODE, primaryStaffId: validation.primary.staff_id, backupAdminId: validation.backup.id })]);
    return { sent: false, reason };
  }

  let primarySent = Boolean(context.approver_notified_at);
  let backupSent = Boolean(context.backup_notified_at);
  if (!primarySent) {
    await sendApprovalRequest(primaryContact.normalized_whatsapp, { ...context, primary_name: validation.primary.display_name, backup_name: validation.backup.display_name }, 'Primary');
    await pool.query(`UPDATE appointment_booking_approvals SET approver_notified_at=NOW(),updated_at=NOW() WHERE appointment_id=$1 AND status='pending' AND approval_mode=$2`, [context.appointment_id, CONTROLLED_JUVAN_MODE]);
    primarySent = true;
  }
  if (!backupSent) {
    await sendApprovalRequest(backupContact.normalized_whatsapp, { ...context, primary_name: validation.primary.display_name, backup_name: validation.backup.display_name }, 'Backup');
    await pool.query(`UPDATE appointment_booking_approvals SET backup_notified_at=NOW(),updated_at=NOW() WHERE appointment_id=$1 AND status='pending' AND approval_mode=$2`, [context.appointment_id, CONTROLLED_JUVAN_MODE]);
    backupSent = true;
  }
  return {
    sent: primarySent && backupSent,
    primaryApprover: validation.primary.display_name,
    backupApprover: validation.backup.display_name,
  };
}

async function requestPractitionerApproval({ appointmentId }) {
  const context = await approvalContext(appointmentId);
  if (!context || context.status !== 'pending' || context.appointment_status === 'cancelled') return { sent: false, reason: 'not_pending' };
  if (context.approval_mode === CONTROLLED_JUVAN_MODE) return requestControlledJuvanApproval(context);

  const approver = context.approver_admin_id ? await adminContactForAdmin(context.approver_admin_id) : await adminContactForStaff(context.approver_staff_id);
  if (!approver) {
    await pool.query(`INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata) VALUES ('client.booking_approval.notification_blocked','appointment',$1,$2::jsonb)`, [appointmentId, JSON.stringify({ reason: 'approver_whatsapp_unavailable', approverStaffId: context.approver_staff_id || null, approverAdminId: context.approver_admin_id || null })]);
    return { sent: false, reason: 'approver_whatsapp_unavailable' };
  }
  if (!context.approver_notified_at) {
    await sendApprovalRequest(approver.normalized_whatsapp, context);
    await pool.query(`UPDATE appointment_booking_approvals SET approver_notified_at=NOW(),updated_at=NOW() WHERE appointment_id=$1 AND status='pending'`, [appointmentId]);
  }
  if (context.observer_staff_id && !context.observer_notified_at) {
    const observer = await adminContactForStaff(context.observer_staff_id);
    if (observer) {
      await sendApprovalRequest(observer.normalized_whatsapp, context);
      await pool.query(`UPDATE appointment_booking_approvals SET observer_notified_at=NOW(),updated_at=NOW() WHERE appointment_id=$1 AND status='pending'`, [appointmentId]);
    }
  }
  return { sent: true, approver: approver.display_name, secondaryApprover: context.observer_name || null };
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
  const result = await db.query(`SELECT id,staff_id,display_name,normalized_whatsapp FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE ORDER BY id LIMIT 1`, [normalized]);
  return result.rows[0] || null;
}

async function lockedDecisionContext(db, appointmentId) {
  const result = await db.query(`
    SELECT aba.appointment_id,aba.approver_staff_id,aba.approver_admin_id,aba.observer_staff_id,
           aba.status,aba.approval_mode,aba.decided_by_admin_id,aba.decision_note,
           a.client_id,a.crm_v2_client_id,a.starts_at,a.ends_at,a.status AS appointment_status,
           CASE WHEN a.crm_v2_client_id IS NOT NULL THEN 'crm_v2' ELSE 'legacy' END AS identity_model,
           COALESCE(v2.name,c.display_name,a.source_client_name) AS client_name,
           CASE WHEN a.crm_v2_client_id IS NOT NULL THEN v2.normalized_mobile
                ELSE (SELECT normalized_value FROM client_contacts cc WHERE cc.client_id=a.client_id AND contact_type IN ('whatsapp','mobile') AND normalized_value IS NOT NULL ORDER BY is_primary DESC,id LIMIT 1)
           END AS client_phone,
           COALESCE((SELECT string_agg(aps.service_name_snapshot,' + ' ORDER BY aps.position) FROM appointment_services aps WHERE aps.appointment_id=a.id),a.title) AS service_name,
           COALESCE((SELECT string_agg(ast.staff_name_snapshot,' + ' ORDER BY ast.position) FROM appointment_staff ast WHERE ast.appointment_id=a.id),'Shiloh practitioner') AS staff_name
      FROM appointment_booking_approvals aba
      JOIN appointments a ON a.id=aba.appointment_id
      LEFT JOIN clients c ON c.id=a.client_id
      LEFT JOIN crm_v2_clients v2 ON v2.id=a.crm_v2_client_id AND v2.status='active'
     WHERE aba.appointment_id=$1
       AND num_nonnulls(a.client_id,a.crm_v2_client_id)=1
       AND (a.crm_v2_client_id IS NULL OR v2.id IS NOT NULL)
     FOR UPDATE OF aba,a`, [appointmentId]);
  return result.rows[0] || null;
}

async function validateControlledJuvanDecision(db, row, admin) {
  const state = await resolveCurrentControlledDemoClient(db);
  if (state.status !== 'bound' || Number(state.client?.id) !== Number(row.client_id)) {
    return { ok: false, reason: `controlled_identity_${state.status}` };
  }
  const primary = await primaryAssignment(db, row.appointment_id);
  const backup = await exactJeanPierreAdmin(db, state.approverAdminId);
  if (!primary?.staff_id || !backup) return { ok: false, reason: 'approver_truth_unavailable' };
  if (Number(primary.staff_id) !== Number(row.approver_staff_id)
      || Number(backup.id) !== Number(row.approver_admin_id)) {
    return { ok: false, reason: 'stored_approver_truth_drift' };
  }

  let role = null;
  if (Number(admin.staff_id) === Number(primary.staff_id)) role = 'Primary';
  else if (Number(admin.id) === Number(backup.id)) role = 'Backup';
  if (!role) return { ok: false, reason: 'not_authorized' };

  const primaryContact = await adminContactForStaff(primary.staff_id, db);
  const backupContact = await adminContactForAdmin(backup.id, db);
  return { ok: true, state, primary, backup, role, primaryContact, backupContact };
}

async function winnerLabel(db, row, validation) {
  if (!row.decided_by_admin_id) return 'another authorized approver';
  const result = await db.query(`SELECT id,staff_id,display_name FROM staff_admin_accounts WHERE id=$1`, [row.decided_by_admin_id]);
  const winner = result.rows[0];
  if (!winner) return 'another authorized approver';
  const role = Number(winner.id) === Number(validation.backup.id)
    ? 'Backup'
    : (Number(winner.staff_id) === Number(validation.primary.staff_id) ? 'Primary' : 'authorized approver');
  return `${winner.display_name} (${role})`;
}

function controlledStaleReply(reason) {
  if (reason === 'not_authorized') return 'You are not the current Primary practitioner or Jean-Pierre Backup for this controlled Juvan booking, so no decision was recorded.';
  return 'This controlled Juvan booking approval no longer matches the current canonical CRM identity and appointment truth. No decision was recorded.';
}

async function notifyGenericOtherDecisionMaker(context, decision, decidingAdmin) {
  if (!context?.observer_staff_id) return;
  const otherStaffId = Number(decidingAdmin.staff_id) === Number(context.approver_staff_id) ? context.observer_staff_id : context.approver_staff_id;
  const other = await adminContactForStaff(otherStaffId);
  if (!other || Number(other.id) === Number(decidingAdmin.id)) return;
  const template = process.env.WHATSAPP_BOOKING_APPROVAL_OUTCOME_TEMPLATE;
  if (template) return sendWhatsAppTemplate(other.normalized_whatsapp, template, [context.client_name, context.service_name, fmtDateTime(context.starts_at), decidingAdmin.display_name, decision, String(context.appointment_id)], TEMPLATE_LANGUAGE);
  return sendWhatsAppMessage(other.normalized_whatsapp, ['*Booking request update*', '', `${context.client_name} — ${context.service_name} — ${fmtDateTime(context.starts_at)}`, `${decidingAdmin.display_name} has ${decision} the request.`, 'The first valid decision is final for this request.'].join('\n'));
}

async function notifyControlledOtherDecisionMaker(context, decision, decidingAdmin, validation) {
  const other = validation.role === 'Primary' ? validation.backupContact : validation.primaryContact;
  const otherRole = validation.role === 'Primary' ? 'Backup' : 'Primary';
  if (!other || Number(other.id) === Number(decidingAdmin.id)) return;
  const decider = `${decidingAdmin.display_name} (${validation.role})`;
  const template = process.env.WHATSAPP_BOOKING_APPROVAL_OUTCOME_TEMPLATE;
  if (template) return sendWhatsAppTemplate(other.normalized_whatsapp, template, [context.client_name, context.service_name, fmtDateTime(context.starts_at), decider, decision, String(context.appointment_id)], TEMPLATE_LANGUAGE);
  return sendWhatsAppMessage(other.normalized_whatsapp, [
    '*Juvan booking request update*', '',
    `Client: ${context.client_name}`,
    `Treatment: ${context.service_name}`,
    `With: ${validation.primary.display_name}`,
    `Time: ${fmtDateTime(context.starts_at)}`,
    `Primary: ${validation.primary.display_name}`,
    `Backup: ${validation.backup.display_name}`,
    '',
    `${decider} has ${decision} the request.`,
    `Your ${otherRole} decision is no longer required. The first valid decision is final.`,
  ].join('\n'));
}

async function approveBookingRequest(admin, context) {
  const db = await pool.connect();
  let controlledValidation = null;
  let locked = null;
  try {
    await db.query('BEGIN');
    if (context.approval_mode === CONTROLLED_JUVAN_MODE) await getControlledDemoIdentity(db, true);
    locked = await lockedDecisionContext(db, context.appointment_id);
    if (!locked) { await db.query('ROLLBACK'); return { handled: true, reply: 'That booking approval request no longer exists.' }; }

    if (locked.approval_mode === CONTROLLED_JUVAN_MODE) {
      controlledValidation = await validateControlledJuvanDecision(db, locked, admin);
      if (!controlledValidation.ok) { await db.query('ROLLBACK'); return { handled: true, reply: controlledStaleReply(controlledValidation.reason) }; }
      if (locked.status !== 'pending') {
        const winner = await winnerLabel(db, locked, controlledValidation);
        await db.query('ROLLBACK');
        return { handled: true, status: locked.status, reply: `This booking request has already been ${locked.status} by ${winner}. No second decision was recorded.` };
      }
    } else {
      if (!isAuthorizedDecisionMaker(admin, locked)) { await db.query('ROLLBACK'); return { handled: true, reply: 'You are not authorized to decide this booking request, so no decision was recorded.' }; }
      if (locked.status !== 'pending') { await db.query('ROLLBACK'); return { handled: true, status: locked.status, reply: `This booking request has already been ${locked.status}.` }; }
    }

    if (locked.appointment_status === 'cancelled') {
      await db.query(`UPDATE appointment_booking_approvals SET status='declined',decided_at=NOW(),decided_by_admin_id=$2,decision_note='appointment already cancelled',updated_at=NOW() WHERE appointment_id=$1 AND status='pending'`, [locked.appointment_id, admin.id]);
      await db.query('COMMIT');
      return { handled: true, status: 'declined', reply: 'This booking request is no longer active because the appointment was already cancelled.' };
    }

    const note = controlledValidation ? `first_decision:${controlledValidation.role.toLowerCase()}` : null;
    const updated = await db.query(`UPDATE appointment_booking_approvals SET status='approved',decided_at=NOW(),decided_by_admin_id=$2,decision_note=COALESCE($3,decision_note),updated_at=NOW() WHERE appointment_id=$1 AND status='pending' RETURNING appointment_id`, [locked.appointment_id, admin.id, note]);
    if (updated.rowCount !== 1) { await db.query('ROLLBACK'); return { handled: true, reply: 'This booking request changed before your decision could be recorded. No second decision was written.' }; }
    await db.query(`INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata) VALUES ('client.booking_approval.approved','appointment',$1,$2::jsonb)`, [locked.appointment_id, JSON.stringify({ decisionMakerStaffId: admin.staff_id || null, decisionMakerAdminId: admin.id, decisionMakerName: admin.display_name, approvalRole: controlledValidation?.role || null, approvalMode: locked.approval_mode, controlledDemoKey: controlledValidation ? DEMO_KEY : null, identityModel: locked.identity_model, clientId: locked.client_id || null, crmV2ClientId: locked.crm_v2_client_id || null })]);
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  const confirmation = await sendCustomerBookingConfirmationForAppointment(locked.appointment_id);
  try {
    if (controlledValidation) await notifyControlledOtherDecisionMaker(locked, 'approved', admin, controlledValidation);
    else await notifyGenericOtherDecisionMaker(locked, 'approved', admin);
  } catch (error) { logger.warn({ err: error, appointmentId: locked.appointment_id }, 'Booking approval peer outcome notification failed'); }
  const roleLabel = controlledValidation ? ` (${controlledValidation.role})` : '';
  return {
    handled: true,
    status: 'approved',
    reply: confirmation.sent
      ? `Approved by ${admin.display_name}${roleLabel}. Appointment #${locked.appointment_id} is confirmed and the client confirmation has been sent.`
      : `Approved by ${admin.display_name}${roleLabel}. Appointment #${locked.appointment_id} is confirmed. Client confirmation delivery status: ${confirmation.reason || 'not sent'}.`,
  };
}

async function declineBookingRequest(admin, context) {
  const db = await pool.connect();
  let controlledValidation = null;
  let locked = null;
  try {
    await db.query('BEGIN');
    if (context.approval_mode === CONTROLLED_JUVAN_MODE) await getControlledDemoIdentity(db, true);
    locked = await lockedDecisionContext(db, context.appointment_id);
    if (!locked) { await db.query('ROLLBACK'); return { handled: true, reply: 'That booking approval request no longer exists.' }; }

    if (locked.approval_mode === CONTROLLED_JUVAN_MODE) {
      controlledValidation = await validateControlledJuvanDecision(db, locked, admin);
      if (!controlledValidation.ok) { await db.query('ROLLBACK'); return { handled: true, reply: controlledStaleReply(controlledValidation.reason) }; }
      if (locked.status !== 'pending') {
        const winner = await winnerLabel(db, locked, controlledValidation);
        await db.query('ROLLBACK');
        return { handled: true, status: locked.status, reply: `This booking request has already been ${locked.status} by ${winner}. No second decision was recorded.` };
      }
    } else {
      if (!isAuthorizedDecisionMaker(admin, locked)) { await db.query('ROLLBACK'); return { handled: true, reply: 'You are not authorized to decide this booking request, so no decision was recorded.' }; }
      if (locked.status !== 'pending') { await db.query('ROLLBACK'); return { handled: true, status: locked.status, reply: `This booking request has already been ${locked.status}.` }; }
    }

    const note = controlledValidation ? `first_decision:${controlledValidation.role.toLowerCase()}` : null;
    const updated = await db.query(`UPDATE appointment_booking_approvals SET status='declined',decided_at=NOW(),decided_by_admin_id=$2,decision_note=COALESCE($3,decision_note),updated_at=NOW() WHERE appointment_id=$1 AND status='pending' RETURNING appointment_id`, [locked.appointment_id, admin.id, note]);
    if (updated.rowCount !== 1) { await db.query('ROLLBACK'); return { handled: true, reply: 'This booking request changed before your decision could be recorded. No second decision was written.' }; }
    if (locked.appointment_status !== 'cancelled') {
      await db.query(`UPDATE appointments SET status='cancelled',updated_at=NOW() WHERE id=$1 AND status<>'cancelled'`, [locked.appointment_id]);
      await db.query(`INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason) VALUES ($1,$2,'cancelled',$3,'Authorized practitioner/supervisor declined client booking request')`, [locked.appointment_id, locked.appointment_status, `admin:${admin.id}`]);
    }
    await db.query(`INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata) VALUES ('client.booking_approval.declined','appointment',$1,$2::jsonb)`, [locked.appointment_id, JSON.stringify({ decisionMakerStaffId: admin.staff_id || null, decisionMakerAdminId: admin.id, decisionMakerName: admin.display_name, approvalRole: controlledValidation?.role || null, approvalMode: locked.approval_mode, controlledDemoKey: controlledValidation ? DEMO_KEY : null, identityModel: locked.identity_model, clientId: locked.client_id || null, crmV2ClientId: locked.crm_v2_client_id || null })]);
    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  const phone = locked.client_phone || (locked.client_id ? await clientPhone(locked.client_id) : null);
  if (phone) {
    const template = process.env.WHATSAPP_BOOKING_DECLINED_TEMPLATE;
    try {
      if (template) await sendWhatsAppTemplate(phone, template, [locked.client_name, locked.service_name, fmtDateTime(locked.starts_at), String(locked.appointment_id)], TEMPLATE_LANGUAGE, ['BOOKING']);
      else {
        const body = ['*Booking request update*', '', `Your request for ${locked.service_name} on ${fmtDateTime(locked.starts_at)} could not be confirmed.`, 'The held time has been released. Nothing is booked.', '', 'Would you like to choose another available time? 🌿', 'Use the button below, or type *BOOKING*.'].join('\n');
        await sendWhatsAppReplyButtons(phone, body, [{ id: 'BOOKING', title: 'Book another time' }]);
      }
    } catch (error) { logger.error({ err: error, appointmentId: locked.appointment_id }, 'Declined booking client notification failed'); }
  }
  try {
    if (controlledValidation) await notifyControlledOtherDecisionMaker(locked, 'declined', admin, controlledValidation);
    else await notifyGenericOtherDecisionMaker(locked, 'declined', admin);
  } catch (error) { logger.warn({ err: error, appointmentId: locked.appointment_id }, 'Booking decline peer outcome notification failed'); }
  const roleLabel = controlledValidation ? ` (${controlledValidation.role})` : '';
  return { handled: true, status: 'declined', reply: `Declined by ${admin.display_name}${roleLabel}. Appointment request #${locked.appointment_id} was cancelled and the held time was released.` };
}

async function processClientBookingApprovalMessage(sender, text) {
  const decision = parseApprovalDecision(text);
  if (!decision) return { handled: false };
  await ensureBookingApprovalTable();
  const admin = await resolveAdminByWhatsApp(sender);
  if (!admin) return { handled: true, reply: 'This approval action is restricted to an authorized Shiloh practitioner or supervisor.' };
  const context = await approvalContext(decision.appointmentId);
  if (!context) return { handled: true, reply: 'That booking approval request no longer exists.' };
  if (context.approval_mode !== CONTROLLED_JUVAN_MODE && !isAuthorizedDecisionMaker(admin, context)) {
    return { handled: true, reply: 'You are not authorized to decide this booking request, so no decision was recorded.' };
  }
  return decision.decision === 'approved' ? approveBookingRequest(admin, context) : declineBookingRequest(admin, context);
}

module.exports = {
  APPROVE_PREFIX,
  DECLINE_PREFIX,
  CONTROLLED_JUVAN_MODE,
  approvalButtons,
  createPendingBookingApproval,
  ensureBookingApprovalTable,
  isAuthorizedDecisionMaker,
  parseApprovalDecision,
  processClientBookingApprovalMessage,
  requestPractitionerApproval,
  resolveClientApprovalPolicy,
  resolveDummyTestApprovalPolicy,
  resolveJuvanApprovalPolicy,
};
