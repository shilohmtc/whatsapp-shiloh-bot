const logger = require('../lib/logger');
const customerChangeNotification = require('../services/customerChangeNotification');
const {
  latestApprovedRescheduleAudit,
  queueApprovedRescheduleConfirmation,
  startApprovedRescheduleConfirmationScheduler,
} = require('../services/clientRescheduleApprovedNotification');

startApprovedRescheduleConfirmationScheduler();

const originalQueueCustomerChangeNotification = customerChangeNotification.queueCustomerChangeNotification;
customerChangeNotification.queueCustomerChangeNotification = async function routeApprovedClientReschedule(appointmentId, changeKind, ...rest) {
  if (changeKind === 'time') {
    const audit = await latestApprovedRescheduleAudit(appointmentId);
    if (audit?.requestId) {
      logger.info({
        appointmentId: Number(appointmentId),
        requestId: Number(audit.requestId),
        auditEventId: Number(audit.auditEventId),
      }, 'Routing practitioner-approved reschedule to exact reschedule confirmation');
      return queueApprovedRescheduleConfirmation(appointmentId, audit);
    }
  }
  return originalQueueCustomerChangeNotification(appointmentId, changeKind, ...rest);
};
