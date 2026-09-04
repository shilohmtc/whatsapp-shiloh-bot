const { pool } = require('../db/pool');

const PROVIDER_TIMESTAMP_COLUMNS = Object.freeze({
  sent: 'provider_sent_at',
  delivered: 'provider_delivered_at',
  read: 'provider_read_at',
  failed: 'provider_failed_at',
});

function providerEventTime(providerTimestamp, fallback = new Date()) {
  const raw = String(providerTimestamp || '').trim();
  if (/^\d{1,12}$/.test(raw)) {
    const milliseconds = Number(raw) * 1000;
    const parsed = new Date(milliseconds);
    if (Number.isFinite(milliseconds) && !Number.isNaN(parsed.getTime())) return parsed;
  }
  const safeFallback = fallback instanceof Date ? fallback : new Date(fallback);
  return Number.isNaN(safeFallback.getTime()) ? new Date() : safeFallback;
}

function createWhatsAppStatusEvidenceService({ db = pool, now = () => new Date() } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('WhatsApp status evidence database is required');

  async function persistStatus(status = {}) {
    const metaMessageId = String(status.metaMessageId || '').trim();
    const providerStatus = String(status.providerStatus || '').trim().toLowerCase();
    const column = PROVIDER_TIMESTAMP_COLUMNS[providerStatus];
    if (!metaMessageId || !column) return { matched: 0, providerStatus: providerStatus || null };

    const occurredAt = providerEventTime(status.providerTimestamp, now());
    const providerError = providerStatus === 'failed' && status.providerError
      ? JSON.stringify(status.providerError)
      : null;
    const asyncFailure = providerStatus === 'failed';
    const result = await db.query(
      `/* whatsappStatusEvidence:persist */
       UPDATE customer_message_deliveries
          SET ${column}=COALESCE(${column}, $2::timestamptz),
              provider_error=CASE
                WHEN $3::jsonb IS NOT NULL THEN COALESCE(provider_error, $3::jsonb)
                ELSE provider_error
              END,
              status=CASE
                WHEN $4::boolean
                 AND message_kind='booking_confirmation'
                 AND status='sent'
                 AND provider_delivered_at IS NULL
                 AND provider_read_at IS NULL
                 AND (provider_sent_at IS NULL OR $2::timestamptz > provider_sent_at)
                THEN 'failed'
                ELSE status
              END,
              next_attempt_at=CASE
                WHEN $4::boolean
                 AND message_kind='booking_confirmation'
                 AND status='sent'
                 AND provider_delivered_at IS NULL
                 AND provider_read_at IS NULL
                 AND (provider_sent_at IS NULL OR $2::timestamptz > provider_sent_at)
                THEN NOW()+INTERVAL '5 minutes'
                ELSE next_attempt_at
              END,
              last_error=CASE
                WHEN $4::boolean
                 AND message_kind='booking_confirmation'
                 AND status='sent'
                 AND provider_delivered_at IS NULL
                 AND provider_read_at IS NULL
                 AND (provider_sent_at IS NULL OR $2::timestamptz > provider_sent_at)
                THEN 'provider_async_failed'
                ELSE last_error
              END,
              updated_at=NOW()
        WHERE provider_message_id=$1
      RETURNING appointment_id, message_kind, status, last_error`,
      [metaMessageId, occurredAt.toISOString(), providerError, asyncFailure]
    );
    const rows = Array.isArray(result.rows) ? result.rows : [];
    return {
      matched: rows.length || Number(result.rowCount || 0),
      providerStatus,
      occurredAt: occurredAt.toISOString(),
      retryReopened: rows.some(row => row.message_kind === 'booking_confirmation'
        && row.status === 'failed' && row.last_error === 'provider_async_failed'),
    };
  }

  async function persistStatuses(records = []) {
    const results = [];
    for (const record of Array.isArray(records) ? records : []) {
      results.push(await persistStatus(record));
    }
    return results;
  }

  return { persistStatus, persistStatuses };
}

const service = createWhatsAppStatusEvidenceService();

module.exports = {
  PROVIDER_TIMESTAMP_COLUMNS,
  providerEventTime,
  createWhatsAppStatusEvidenceService,
  ...service,
};
