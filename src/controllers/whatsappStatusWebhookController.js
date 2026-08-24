const logger = require('../lib/logger');
const { processWhatsAppStatuses } = require('../services/whatsappStatusCallback');

function logSanitizedStatus(log, status) {
  const fields = {
    metaMessageId: status.metaMessageId,
    providerStatus: status.providerStatus,
    providerTimestamp: status.providerTimestamp,
  };
  if (status.providerError) fields.providerError = status.providerError;
  const method = status.providerStatus === 'failed' ? 'warn' : 'info';
  log[method](fields, 'Processed WhatsApp delivery status');
}

function processWhatsAppStatusWebhook(req, res, next) {
  const log = req.log || logger;
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (value?.statuses === undefined) return next();

    const { records, invalidCount } = processWhatsAppStatuses(value.statuses);
    for (const status of records) logSanitizedStatus(log, status);
    if (invalidCount > 0) {
      log.warn({ invalidStatusCount: invalidCount }, 'Ignored malformed WhatsApp delivery status callback');
    }

    if (Array.isArray(value.messages) && value.messages.length > 0) return next();
    return res.sendStatus(200);
  } catch (error) {
    log.warn({ errorType: String(error?.name || 'Error').slice(0, 60) }, 'Ignored malformed WhatsApp delivery status callback');
    return res.sendStatus(200);
  }
}

module.exports = {
  logSanitizedStatus,
  processWhatsAppStatusWebhook,
};
