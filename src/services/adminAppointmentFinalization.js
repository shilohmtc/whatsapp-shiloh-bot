const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { canCertifyAppointment, certificationStaffIds, authorityDescription } = require('./attendanceFinalizationAuthority');
const { processAdminBookingUpdateMessage } = require('./adminBookingUpdate');

// Reserve two of WhatsApp's 10 list rows for pagination and Back controls.
const PAGE_SIZE = 8;
const FINAL_STATUSES = new Set(['completed', 'no_show']);

function key(sender) { return normalizePhone(sender); }
function has(admin, permission) { return admin?.permissions?.[permission] === true; }
function isBusinessWide(admin) {
  return ['owner', 'business_admin'].includes(admin?.business_role) || admin?.calendar_scope === 'all_business';
}
function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

async function getAdmin(sender) {
  const result = await pool.query(
    `SELECT id, staff_id, display_name, role, permissions, service_scope, business_role, calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [key(sender)]
  );
  return result.rows[0] || null;
}

function scopeSql(alias = 'a') {
  return `(
    $1::boolean = TRUE
    OR (
      $2::bigint IS NOT NULL
      AND EXISTS (SELECT 1 FROM appointment_staff ast_scope WHERE ast_scope.appointment_id=${alias}.id AND ast_scope.staff_id=$2)
      AND EXISTS (
        SELECT 1 FROM appointment_services aps_scope
        JOIN staff_services ss_scope ON ss_scope.service_id=aps_scope.service_id AND ss_scope.staff_id=$2
        WHERE aps_scope.appointment_id=${alias}.id
      )
    )
  )`;
}

async function pendingPastAppointments(admin, page = 1) {
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * PAGE_SIZE;
  const certifiableStaff = await certificationStaffIds(admin);
  const certifiableOnly = certifiableStaff.length > 0;
  const result = await pool.query(
    `SELECT a.id, a.starts_at, a.ends_at, a.status,
            COALESCE(c.display_name, a.source_client_name, 'Unknown client') AS client_name,
            COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ', ') FILTER (WHERE aps.service_name_snapshot IS NOT NULL), '') AS services,
            COALESCE(string_agg(DISTINCT ast.staff_name_snapshot, ', ') FILTER (WHERE ast.staff_name_snapshot IS NOT NULL), '') AS staff
       FROM appointments a
       LEFT JOIN clients c ON c.id=a.client_id
       LEFT JOIN appointment_services aps ON aps.appointment_id=a.id
       LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
      WHERE a.ends_at < NOW()
        AND a.status NOT IN ('completed','cancelled','no_show')
        AND ${scopeSql('a')}
        AND ($5::boolean = FALSE OR (
          EXISTS (SELECT 1 FROM appointment_staff ast_any WHERE ast_any.appointment_id=a.id AND ast_any.staff_id IS NOT NULL)
          AND NOT EXISTS (
            SELECT 1 FROM appointment_staff ast_forbidden
             WHERE ast_forbidden.appointment_id=a.id
               AND ast_forbidden.staff_id IS NOT NULL
               AND NOT (ast_forbidden.staff_id = ANY($6::bigint[]))
          )
        ))
      GROUP BY a.id,a.starts_at,a.ends_at,a.status,c.display_name,a.source_client_name
      ORDER BY a.starts_at DESC,a.id DESC
      LIMIT $3 OFFSET $4`,
    [isBusinessWide(admin), admin.staff_id, PAGE_SIZE + 1, offset, certifiableOnly, certifiableStaff]
  );
  return { rows: result.rows.slice(0, PAGE_SIZE), page: safePage, hasNext: result.rows.length > PAGE_SIZE };
}

function pendingListInteractive(data, admin = null) {
  const rows = data.rows.map((row) => ({
    id: `finalize_appt_${row.id}`,
    title: `#${row.id} ${String(row.client_name || 'Client').slice(0, 14)}`.slice(0, 24),
    description: `${formatDateTime(row.starts_at)} · ${String(row.services || row.staff || row.status).slice(0, 42)}`.slice(0, 72),
  }));
  if (data.hasNext) rows.push({ id: `finalize_appts_page_${data.page + 1}`, title: 'More appointments', description: 'Show older appointments awaiting final status' });
  rows.push({ id: 'appointments', title: '← Back', description: 'Return to Appointments' });
  const authority = admin ? authorityDescription(admin) : null;
  return {
    type: 'list',
    body: data.rows.length
      ? `*Visits awaiting finalization — ${data.rows.length}${data.hasNext ? '+' : ''}*\nChoose a visit and record what actually happened.${authority ? `\nYou can certify: ${authority}.` : ''}`
      : '*Visits awaiting finalization*\nThere are no past visits awaiting final status in your authorized certification scope.',
    buttonText: 'Review visits', rows, sectionTitle: 'Awaiting finalization',
  };
}

async function loadAuthorizedPendingAppointment(admin, appointmentId, db = pool, lock = false) {
  const result = await db.query(
    `SELECT a.id,a.client_id,a.starts_at,a.ends_at,a.status,
            COALESCE(c.display_name,a.source_client_name,'Unknown client') AS client_name,
            COALESCE((SELECT string_agg(DISTINCT aps.service_name_snapshot, ', ') FROM appointment_services aps WHERE aps.appointment_id=a.id AND aps.service_name_snapshot IS NOT NULL), '') AS services,
            COALESCE((SELECT string_agg(DISTINCT ast.staff_name_snapshot, ', ') FROM appointment_staff ast WHERE ast.appointment_id=a.id AND ast.staff_name_snapshot IS NOT NULL), '') AS staff
       FROM appointments a
       LEFT JOIN clients c ON c.id=a.client_id
      WHERE a.id=$3
        AND a.ends_at < NOW()
        AND a.status NOT IN ('completed','cancelled','no_show')
        AND ${scopeSql('a')}
      ${lock ? 'FOR UPDATE OF a' : ''}`,
    [isBusinessWide(admin), admin.staff_id, appointmentId]
  );
  return result.rows[0] || null;
}

function appointmentDetails(appointment) {
  return [
    `*Finalize appointment #${appointment.id}*`, `👤 ${appointment.client_name}`,
    `✨ ${appointment.services || 'Service not recorded'}`, `💆 ${appointment.staff || 'Practitioner not recorded'}`,
    `🕘 ${formatDateTime(appointment.starts_at)}`,
  ].join('\n');
}

function decisionInteractive(appointment) {
  return {
    type: 'list',
    body: `${appointmentDetails(appointment)}\n\nWhat actually happened? Attendance cannot be inferred from elapsed time.`,
    buttonText: 'Choose outcome',
    sectionTitle: 'Visit outcome',
    rows: [
      { id: `finalize_completed_${appointment.id}`, title: 'Completed', description: 'Client attended; finalize the visit' },
      { id: `finalize_no_show_${appointment.id}`, title: 'No-show', description: 'Client did not attend; finalize as missed' },
      { id: `finalize_reschedule_${appointment.id}`, title: 'Reschedule', description: 'Move this unresolved visit to a future time' },
      { id: 'finalize_back', title: 'Leave unresolved', description: 'Make no change and return to the list' },
    ],
  };
}

function reviewOnlyInteractive(appointment) {
  return {
    type: 'button',
    body: `${appointmentDetails(appointment)}\n\n🔒 Review only. Attendance must be certified by the responsible practitioner, or by Christel for Christel/Abigail appointments.`,
    buttons: [{ id: 'finalize_back', title: 'Back' }],
  };
}

async function finalizeAppointment(admin, appointmentId, targetStatus) {
  if (!FINAL_STATUSES.has(targetStatus)) return { status: 'invalid_status' };
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const appointment = await loadAuthorizedPendingAppointment(admin, appointmentId, db, true);
    if (!appointment) { await db.query('ROLLBACK'); return { status: 'stale_or_forbidden' }; }
    if (!(await canCertifyAppointment(admin, appointment.id, db))) { await db.query('ROLLBACK'); return { status: 'certification_forbidden' }; }

    await db.query(`UPDATE appointments SET status=$1,updated_at=NOW() WHERE id=$2`, [targetStatus, appointment.id]);
    await db.query(
      `INSERT INTO appointment_status_history (appointment_id,from_status,to_status,changed_by,reason) VALUES ($1,$2,$3,$4,$5)`,
      [appointment.id, appointment.status, targetStatus, `admin:${admin.id}:${admin.display_name}`, 'Explicit WhatsApp practitioner attendance certification']
    );
    await db.query(`UPDATE appointment_lifecycle SET status=$1,updated_at=NOW() WHERE appointment_id=$2`, [targetStatus, appointment.id]);
    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,'admin.appointment_finalized','appointment',$2,$3::jsonb)`,
      [admin.id, String(appointment.id), JSON.stringify({ fromStatus: appointment.status, toStatus: targetStatus, startsAt: appointment.starts_at, explicitAdminDecision: true, certificationAuthority: authorityDescription(admin) })]
    );
    await db.query('COMMIT');
    return { status: 'updated', appointment, targetStatus };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally { db.release(); }
}

async function startPastVisitReschedule(sender, appointmentId) {
  // Reuse the canonical guarded admin booking-update state machine rather than
  // creating a second mutation path. The existing appointment remains unchanged
  // until a valid future time passes clinic, practitioner, CRM and Calendar checks.
  await processAdminBookingUpdateMessage(sender, 'Manage booking');
  const selected = await processAdminBookingUpdateMessage(sender, String(appointmentId));
  if (!selected.handled) return selected;
  return processAdminBookingUpdateMessage(sender, '3');
}

async function processAdminAppointmentFinalizationMessage(sender, text) {
  const raw = String(text || '').trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, ' ');
  const isEntry = ['finalize past appointments', 'finalise past appointments', 'review final statuses'].includes(normalized);
  const pageMatch = raw.match(/^finalize_appts_page_(\d+)$/i);
  const selectionMatch = raw.match(/^finalize_appt_(\d+)$/i);
  const decisionMatch = raw.match(/^finalize_(completed|no_show)_(\d+)$/i);
  const rescheduleMatch = raw.match(/^finalize_reschedule_(\d+)$/i);
  const isBack = normalized === 'finalize_back';
  if (!isEntry && !pageMatch && !selectionMatch && !decisionMatch && !rescheduleMatch && !isBack) return { handled: false };

  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (!has(admin, 'appointment:view')) return { handled: true, admin, reply: 'Your admin account does not currently have permission to view appointment finalization.' };

  if (isEntry || pageMatch || isBack) {
    const page = pageMatch ? Number(pageMatch[1]) : 1;
    const data = await pendingPastAppointments(admin, page);
    return { handled: true, admin, interactive: pendingListInteractive(data, admin) };
  }

  if (selectionMatch) {
    const appointment = await loadAuthorizedPendingAppointment(admin, Number(selectionMatch[1]));
    if (!appointment) return { handled: true, admin, reply: 'That appointment is no longer awaiting final status in your authorized scope.' };
    const canCertify = has(admin, 'booking:update') && await canCertifyAppointment(admin, appointment.id);
    return { handled: true, admin, interactive: canCertify ? decisionInteractive(appointment) : reviewOnlyInteractive(appointment) };
  }

  if (rescheduleMatch) {
    if (!has(admin, 'booking:update')) return { handled: true, admin, reply: 'Your admin account can review this appointment but cannot reschedule it.' };
    const appointmentId = Number(rescheduleMatch[1]);
    const appointment = await loadAuthorizedPendingAppointment(admin, appointmentId);
    if (!appointment) return { handled: true, admin, reply: 'That appointment changed or is outside your authorized scope, so no reschedule was started.' };
    if (!(await canCertifyAppointment(admin, appointment.id))) return { handled: true, admin, reply: 'You can review this appointment, but its outcome must be handled by the responsible practitioner or authorized supervisor.' };
    return startPastVisitReschedule(sender, appointmentId);
  }

  if (!has(admin, 'booking:update')) return { handled: true, admin, reply: 'Your admin account can review this appointment but cannot certify attendance.' };
  const targetStatus = decisionMatch[1].toLowerCase();
  const appointmentId = Number(decisionMatch[2]);
  const result = await finalizeAppointment(admin, appointmentId, targetStatus);
  if (result.status === 'certification_forbidden') return { handled: true, admin, reply: 'You can review this appointment, but attendance must be certified by its responsible practitioner or authorized supervisor.' };
  if (result.status !== 'updated') return { handled: true, admin, reply: 'That appointment changed or is outside your authorized scope, so no status update was made.' };
  const label = targetStatus === 'completed' ? 'Completed' : 'No-show';
  return { handled: true, admin, reply: `✅ Appointment #${appointmentId} marked *${label}*. Reporting integrity will now use this explicit canonical status.` };
}

module.exports = {
  FINAL_STATUSES, PAGE_SIZE, pendingPastAppointments, pendingListInteractive, decisionInteractive, reviewOnlyInteractive,
  loadAuthorizedPendingAppointment, finalizeAppointment, startPastVisitReschedule, processAdminAppointmentFinalizationMessage,
};
