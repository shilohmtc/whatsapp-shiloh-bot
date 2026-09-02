const { pool } = require('../db/pool');

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function boundedLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeWaId(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  return /^27\d{9}$/.test(digits) ? digits : null;
}

function humanize(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'Shiloh notification';
  return text.replace(/\b\w/g, character => character.toUpperCase());
}

const INTENT_LABELS = Object.freeze({
  booking_confirmation: 'Booking confirmation',
  initial_booking_confirmation: 'Booking confirmation',
  booking_confirmation_v2: 'Booking confirmation',
  booking_update: 'Booking update',
  cancellation_confirmation: 'Cancellation confirmation',
  appointment_reminder: 'Appointment reminder',
  appointment_reminder_actions: 'Appointment reminder',
  appointment_followup: 'Appointment follow-up',
  appointment_followup_v2: 'Appointment follow-up',
  birthday: 'Birthday message',
  birthday_v2: 'Birthday message',
  reschedule_confirmation: 'Reschedule confirmation',
});

function intentLabel(value) {
  const key = String(value || '').trim().toLowerCase();
  return INTENT_LABELS[key] || humanize(key);
}

function messageDeliveryEntry(row) {
  const status = String(row?.status || '').toLowerCase() === 'sent' ? 'sent' : 'pending';
  const occurredAt = status === 'sent' ? row?.sent_at : row?.claimed_at;
  if (!occurredAt) return null;
  return {
    intent: String(row?.message_kind || 'notification'),
    label: intentLabel(row?.message_kind),
    status,
    statusLabel: status === 'sent' ? 'Sent by Shiloh' : 'Pending',
    occurredAt,
    appointmentId: positiveId(row?.appointment_id),
  };
}

function careDeliveryEntry(row) {
  if (!row?.sent_at) return null;
  return {
    intent: String(row?.event_type || 'customer_care'),
    label: intentLabel(row?.event_type),
    status: 'sent',
    statusLabel: 'Sent by Shiloh',
    occurredAt: row.sent_at,
    appointmentId: null,
  };
}

function rescheduleEntry(row) {
  let status = null;
  let statusLabel = null;
  let occurredAt = null;
  if (row?.client_notified_at) {
    status = 'sent'; statusLabel = 'Sent by Shiloh'; occurredAt = row.client_notified_at;
  } else if (row?.client_notification_suppressed_at) {
    status = 'suppressed'; statusLabel = 'Suppressed'; occurredAt = row.client_notification_suppressed_at;
  } else if (row?.client_notification_last_error) {
    status = 'failed'; statusLabel = 'Send attempt failed'; occurredAt = row.client_notification_claimed_at || row.updated_at;
  } else if (row?.client_notification_claimed_at) {
    status = 'pending'; statusLabel = 'Pending'; occurredAt = row.client_notification_claimed_at;
  }
  if (!occurredAt) return null;
  return {
    intent: 'reschedule_confirmation',
    label: 'Reschedule confirmation',
    status,
    statusLabel,
    occurredAt,
    appointmentId: positiveId(row?.appointment_id),
  };
}

function timestamp(value) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeEvidence(groups, limit) {
  const seen = new Set();
  return groups.flat().filter(Boolean).sort((a, b) => timestamp(b.occurredAt) - timestamp(a.occurredAt)).filter(entry => {
    const key = `${entry.intent}|${entry.appointmentId || ''}|${entry.status}|${new Date(entry.occurredAt).toISOString()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

function createWorkspaceCommunicationEvidenceService({ db = pool } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Workspace communication evidence database is required');

  async function listForClient({ clientId, waId, limit } = {}) {
    const id = positiveId(clientId);
    if (!id) return [];
    const safeLimit = boundedLimit(limit);
    const normalizedWaId = normalizeWaId(waId);

    const deliveries = await db.query(
      `/* workspaceCommunicationEvidence:messageDeliveries */
       SELECT appointment_id, message_kind, status, claimed_at, sent_at
         FROM customer_message_deliveries
        WHERE crm_v2_client_id=$1
        ORDER BY COALESCE(sent_at, claimed_at) DESC
        LIMIT $2`,
      [id, safeLimit]
    );

    const reschedules = await db.query(
      `/* workspaceCommunicationEvidence:reschedules */
       SELECT appointment_id, client_notified_at, client_notification_last_error,
              client_notification_claimed_at, client_notification_suppressed_at, updated_at
         FROM appointment_reschedule_requests
        WHERE crm_v2_client_id=$1
          AND (client_notified_at IS NOT NULL
            OR client_notification_last_error IS NOT NULL
            OR client_notification_claimed_at IS NOT NULL
            OR client_notification_suppressed_at IS NOT NULL)
        ORDER BY COALESCE(client_notified_at, client_notification_suppressed_at,
                          client_notification_claimed_at, updated_at) DESC
        LIMIT $2`,
      [id, safeLimit]
    );

    let careRows = [];
    if (normalizedWaId) {
      const care = await db.query(
        `/* workspaceCommunicationEvidence:customerCare */
         SELECT event_type, sent_at
           FROM customer_care_delivery_log
          WHERE client_wa_id=$1
          ORDER BY sent_at DESC
          LIMIT $2`,
        [normalizedWaId, safeLimit]
      );
      careRows = care.rows || [];
    }

    return mergeEvidence([
      (deliveries.rows || []).map(messageDeliveryEntry),
      (reschedules.rows || []).map(rescheduleEntry),
      careRows.map(careDeliveryEntry),
    ], safeLimit);
  }

  return { listForClient };
}

const service = createWorkspaceCommunicationEvidenceService();

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  boundedLimit,
  normalizeWaId,
  humanize,
  intentLabel,
  messageDeliveryEntry,
  careDeliveryEntry,
  rescheduleEntry,
  mergeEvidence,
  createWorkspaceCommunicationEvidenceService,
  ...service,
};
