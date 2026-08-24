const ALLOWED_PROVIDER_STATUSES = new Set(['sent', 'delivered', 'read', 'failed']);

function sanitizeProviderText(value, maxLength = 180) {
  if (value == null) return null;
  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\bBearer\s+[^\s"',}\]]+/gi, 'Bearer [REDACTED]')
    .replace(/\bEAA[A-Za-z0-9_-]{20,}\b/g, '[REDACTED]')
    .replace(/\b\+?\d{10,15}\b/g, '[REDACTED_PHONE]')
    .replace(/\b[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}\b/g, '[REDACTED_CHALLENGE]')
    .slice(0, maxLength);
}

function sanitizeMetaMessageId(value) {
  const normalized = sanitizeProviderText(value, 250);
  if (!normalized || /[<>]/.test(normalized)) return null;
  return normalized;
}

function sanitizeProviderError(error) {
  if (!error || typeof error !== 'object') return null;
  const code = sanitizeProviderText(error.code, 60);
  const title = sanitizeProviderText(error.title, 120);
  const message = sanitizeProviderText(error.message, 180);
  if (!code && !title && !message) return null;
  return { code, title, message };
}

function sanitizeStatus(status) {
  if (!status || typeof status !== 'object' || Array.isArray(status)) return null;
  const metaMessageId = sanitizeMetaMessageId(status.id);
  const providerStatus = String(status.status || '').trim().toLowerCase();
  if (!metaMessageId || !ALLOWED_PROVIDER_STATUSES.has(providerStatus)) return null;

  const timestamp = String(status.timestamp || '').trim();
  const providerTimestamp = /^\d{1,20}$/.test(timestamp) ? timestamp : null;
  const providerError = Array.isArray(status.errors) && status.errors.length
    ? sanitizeProviderError(status.errors[0])
    : null;

  return {
    metaMessageId,
    providerStatus,
    providerTimestamp,
    providerError,
  };
}

function processWhatsAppStatuses(statuses) {
  if (!Array.isArray(statuses)) return { records: [], invalidCount: statuses == null ? 0 : 1 };
  const records = [];
  let invalidCount = 0;
  for (const status of statuses) {
    const sanitized = sanitizeStatus(status);
    if (sanitized) records.push(sanitized);
    else invalidCount += 1;
  }
  return { records, invalidCount };
}

module.exports = {
  ALLOWED_PROVIDER_STATUSES,
  sanitizeProviderText,
  sanitizeProviderError,
  sanitizeStatus,
  processWhatsAppStatuses,
};
