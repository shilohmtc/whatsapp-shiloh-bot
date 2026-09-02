const { pool } = require('../db/pool');
const { sendCustomerBookingConfirmationForAppointment } = require('./customerBookingConfirmation');
const { assertTemplateSendAllowed } = require('./metaTemplateContracts');

const CLIENT_LOOKUP_CAPABILITY = 'client:lookup';
const CLIENT_NOTIFY_CAPABILITY = 'client:notify';
const WORKSPACE_CLIENT_NOTIFY_PROVIDER_GATE = 'SHILOH_WORKSPACE_CLIENT_NOTIFY_PROVIDER_READY';

class WorkspaceClientNotificationError extends Error {
  constructor(code, message, httpStatus) {
    super(message);
    this.name = 'WorkspaceClientNotificationError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function permissionSet(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function evaluateClientNotificationAuthority(rows = []) {
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const principal = rows[0];
  const adminId = positiveId(principal.id);
  if (!adminId || principal.admin_active !== true) return null;
  if (principal.staff_id != null && principal.staff_status !== 'active') return null;
  const permissions = permissionSet(principal.permissions);
  if (permissions[CLIENT_LOOKUP_CAPABILITY] !== true || permissions[CLIENT_NOTIFY_CAPABILITY] !== true) return null;
  return {
    key: 'workspace_client_notify_v1',
    operatorAdminId: adminId,
    displayName: String(principal.display_name || 'Staff').trim() || 'Staff',
    capability: CLIENT_NOTIFY_CAPABILITY,
    requiredVisibilityCapability: CLIENT_LOOKUP_CAPABILITY,
  };
}

function channelReady(env = process.env) {
  return String(env[WORKSPACE_CLIENT_NOTIFY_PROVIDER_GATE] || '').trim().toLowerCase() === 'true'
    && Boolean(String(env.PHONE_NUMBER_ID || '').trim())
    && Boolean(String(env.WHATSAPP_TOKEN || '').trim())
    && Boolean(String(env.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE || '').trim());
}

async function defaultProviderGuard(env = process.env) {
  const template = String(env.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE || '').trim();
  if (!template) throw new Error('Booking confirmation template is not configured');
  return assertTemplateSendAllowed(template, String(env.WHATSAPP_TEMPLATE_LANGUAGE || 'en').trim() || 'en');
}

function validCrmV2Mobile(value) {
  return /^27[678][0-9]{8}$/.test(String(value || '').trim());
}

function previewState(row, env = process.env) {
  if (!row) return { canSend: false, reason: 'client_not_found' };
  if (row.client_status !== 'active') return { canSend: false, reason: 'client_inactive' };
  if (!validCrmV2Mobile(row.normalized_mobile)) return { canSend: false, reason: 'recipient_missing' };
  if (!row.appointment_id) return { canSend: false, reason: 'no_upcoming_appointment' };
  if (row.already_sent === true) return { canSend: false, reason: 'already_sent' };
  if (!channelReady(env)) return { canSend: false, reason: 'channel_unavailable' };
  return { canSend: true, reason: null };
}

function publicReason(reason) {
  switch (reason) {
    case 'recipient_missing': return 'This client does not have a valid canonical WhatsApp/mobile recipient.';
    case 'no_upcoming_appointment': return 'There is no upcoming Shiloh-owned appointment available for a booking confirmation.';
    case 'already_sent': return 'A booking confirmation is already recorded as sent for this appointment.';
    case 'channel_unavailable': return 'The Workspace WhatsApp delivery gate is disabled or the booking-confirmation channel is not configured.';
    case 'provider_unavailable': return 'The approved Shiloh booking-confirmation provider contract is not currently ready. Nothing can be sent.';
    case 'client_inactive': return 'This canonical client is not active.';
    case 'practitioner_approval_required': return 'The appointment still requires practitioner approval before a confirmation can be sent.';
    case 'appointment_not_found': return 'The appointment is no longer available.';
    default: return 'The booking confirmation was not sent.';
  }
}

function createWorkspaceClientNotificationService({
  db = pool,
  env = process.env,
  sender = sendCustomerBookingConfirmationForAppointment,
  providerGuard = defaultProviderGuard,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Workspace client notification database is required');
  if (typeof sender !== 'function') throw new Error('Workspace client notification sender is required');
  if (typeof providerGuard !== 'function') throw new Error('Workspace client notification provider guard is required');

  async function resolveAccess(adminId) {
    const id = positiveId(adminId);
    if (!id) return null;
    const result = await db.query(
      `/* workspaceClientNotifications:principal */
       SELECT a.id, a.staff_id, a.display_name, a.permissions,
              a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id=a.staff_id
        WHERE a.id=$1
          AND a.active=TRUE
        LIMIT 2`,
      [id]
    );
    return evaluateClientNotificationAuthority(result.rows);
  }

  async function requireAccess(adminId) {
    const authority = await resolveAccess(adminId);
    if (!authority) {
      throw new WorkspaceClientNotificationError(
        'WORKSPACE_CLIENT_NOTIFY_FORBIDDEN',
        'Current staff authority does not permit client notifications.',
        403
      );
    }
    return authority;
  }

  async function loadPreviewRow(clientId) {
    const result = await db.query(
      `/* workspaceClientNotifications:preview */
       SELECT c.id AS client_id, c.name AS client_name, c.normalized_mobile,
              c.mobile_verified_at, c.status AS client_status,
              a.id AS appointment_id, a.starts_at, a.ends_at,
              a.status AS appointment_status, a.source, l.name AS location_name,
              COALESCE((SELECT string_agg(aps.service_name_snapshot, ' + ' ORDER BY aps.position)
                          FROM appointment_services aps WHERE aps.appointment_id=a.id), a.title, 'Shiloh appointment') AS service_name,
              COALESCE((SELECT string_agg(ast.staff_name_snapshot, ' + ' ORDER BY ast.position)
                          FROM appointment_staff ast WHERE ast.appointment_id=a.id), 'Shiloh practitioner') AS staff_name,
              CASE WHEN a.id IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM crm_audit_events e
                 WHERE e.action='customer.booking_confirmation_sent'
                   AND e.entity_type='appointment'
                   AND e.entity_id=a.id::text
              ) END AS already_sent
         FROM crm_v2_clients c
         LEFT JOIN LATERAL (
           SELECT candidate.*
             FROM appointments candidate
            WHERE candidate.crm_v2_client_id=c.id
              AND candidate.client_id IS NULL
              AND candidate.status <> 'cancelled'
              AND candidate.starts_at >= NOW()
            ORDER BY candidate.starts_at ASC, candidate.id ASC
            LIMIT 1
         ) a ON TRUE
         LEFT JOIN locations l ON l.id=a.location_id
        WHERE c.id=$1
        LIMIT 1`,
      [clientId]
    );
    return result.rows[0] || null;
  }

  async function getPreview({ adminId, clientId } = {}) {
    const authority = await requireAccess(adminId);
    const id = positiveId(clientId);
    if (!id) {
      throw new WorkspaceClientNotificationError(
        'WORKSPACE_CLIENT_NOTIFY_INVALID_CLIENT',
        'Client reference is invalid.',
        400
      );
    }
    const row = await loadPreviewRow(id);
    if (!row) {
      throw new WorkspaceClientNotificationError(
        'WORKSPACE_CLIENT_NOTIFY_CLIENT_NOT_FOUND',
        'Canonical client was not found.',
        404
      );
    }
    let state = previewState(row, env);
    let providerReady = false;
    if (state.canSend) {
      try {
        await providerGuard(env);
        providerReady = true;
      } catch (_error) {
        state = { canSend: false, reason: 'provider_unavailable' };
      }
    }
    return {
      authority,
      client: {
        id: Number(row.client_id),
        name: String(row.client_name || 'Unnamed client'),
        normalizedMobile: String(row.normalized_mobile || ''),
        mobileVerifiedAt: row.mobile_verified_at || null,
        status: row.client_status,
      },
      appointment: row.appointment_id ? {
        id: Number(row.appointment_id),
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.appointment_status,
        source: row.source,
        locationName: row.location_name || 'Shiloh',
        serviceName: row.service_name || 'Shiloh appointment',
        staffName: row.staff_name || 'Shiloh practitioner',
      } : null,
      alreadySent: row.already_sent === true,
      channelReady: channelReady(env),
      providerReady,
      canSend: state.canSend,
      reason: state.reason,
      reasonMessage: state.reason ? publicReason(state.reason) : null,
    };
  }

  async function sendBookingConfirmation({ adminId, clientId } = {}) {
    const preview = await getPreview({ adminId, clientId });
    if (!preview.canSend || !preview.appointment?.id) {
      throw new WorkspaceClientNotificationError(
        'WORKSPACE_CLIENT_NOTIFY_NOT_SENDABLE',
        preview.reasonMessage || 'Booking confirmation cannot be sent from this state.',
        preview.reason === 'already_sent' ? 409 : 400
      );
    }

    let result;
    try {
      result = await sender(preview.appointment.id, { db, env });
    } catch (_error) {
      throw new WorkspaceClientNotificationError(
        'WORKSPACE_CLIENT_NOTIFY_SEND_FAILED',
        'The WhatsApp delivery attempt failed. No successful delivery claim is being made.',
        503
      );
    }

    if (result?.sent === true) {
      return {
        sent: true,
        clientId: preview.client.id,
        appointmentId: preview.appointment.id,
        message: 'Booking confirmation accepted by the existing Shiloh delivery path.',
      };
    }

    const reason = String(result?.reason || 'send_failed');
    throw new WorkspaceClientNotificationError(
      reason === 'already_sent' ? 'WORKSPACE_CLIENT_NOTIFY_ALREADY_SENT' : 'WORKSPACE_CLIENT_NOTIFY_NOT_SENT',
      publicReason(reason),
      reason === 'already_sent' ? 409 : 503
    );
  }

  return { resolveAccess, requireAccess, getPreview, sendBookingConfirmation };
}

const service = createWorkspaceClientNotificationService();

module.exports = {
  CLIENT_LOOKUP_CAPABILITY,
  CLIENT_NOTIFY_CAPABILITY,
  WORKSPACE_CLIENT_NOTIFY_PROVIDER_GATE,
  WorkspaceClientNotificationError,
  positiveId,
  evaluateClientNotificationAuthority,
  channelReady,
  defaultProviderGuard,
  validCrmV2Mobile,
  previewState,
  publicReason,
  createWorkspaceClientNotificationService,
  ...service,
};
