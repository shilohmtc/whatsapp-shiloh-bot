const logger = require('../lib/logger');
const { processWhatsAppStatuses } = require('../services/whatsappStatusCallback');
const { persistStatuses: persistWhatsAppStatuses } = require('../services/whatsappStatusEvidence');

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

function createWhatsAppStatusWebhookController({ persistStatuses = persistWhatsAppStatuses } = {}) {
  return function processWhatsAppStatusWebhook(req, res, next) {
    const log = req.log || logger;
    try {
      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      if (value?.statuses === undefined) return next();

      const { records, invalidCount } = processWhatsAppStatuses(value.statuses);
      for (const status of records) logSanitizedStatus(log, status);
      if (invalidCount > 0) {
        log.warn({ invalidStatusCount: invalidCount }, 'Ignored malformed WhatsApp delivery status callback');
      }

      const hasInboundMessages = Array.isArray(value.messages) && value.messages.length > 0;
      if (hasInboundMessages) next();
      else if (res && typeof res.statusCode === 'number') res.statusCode = 200;

      const persistence = records.length > 0
        ? Promise.resolve()
          .then(() => persistStatuses(records))
          .then((persisted = []) => {
            const unmatchedStatusCount = persisted.filter(item => Number(item?.matched || 0) === 0).length;
            if (unmatchedStatusCount > 0) {
              log.info({ unmatchedStatusCount }, 'WhatsApp delivery status had no Shiloh delivery match');
            }
          })
          .catch((error) => {
            log.warn(
              { errorType: String(error?.name || 'Error').slice(0, 60) },
              'WhatsApp delivery status evidence persistence failed safely'
            );
          })
        : Promise.resolve();

      if (hasInboundMessages) return persistence;
      return persistence.then(() => res.sendStatus(200));
    } catch (error) {
      log.warn({ errorType: String(error?.name || 'Error').slice(0, 60) }, 'Ignored malformed WhatsApp delivery status callback');
      return res.sendStatus(200);
    }
  };
}

const processWhatsAppStatusWebhook = createWhatsAppStatusWebhookController();

module.exports = {
  logSanitizedStatus,
  createWhatsAppStatusWebhookController,
  processWhatsAppStatusWebhook,
};
