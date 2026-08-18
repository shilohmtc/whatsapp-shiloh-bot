const logger = require('../lib/logger');
const bookingUpdate = require('../services/adminBookingUpdate');
const statelessBookingUpdate = require('../services/adminBookingUpdateStateless');
const adminCancellation = require('../services/adminAppointmentCancellation');
const { queueCustomerChangeNotification, startCustomerChangeNotificationScheduler } = require('../services/customerChangeNotification');

function resultText(result) {
  return [result?.reply, result?.interactive?.body].filter(Boolean).join('\n');
}

function appointmentIdFromResult(result) {
  if (Number(result?.cancelledAppointmentId) > 0) return Number(result.cancelledAppointmentId);
  const match = resultText(result).match(/Manage booking #(\d+)/i) || resultText(result).match(/Appointment #(\d+)/i);
  return match ? Number(match[1]) : null;
}

function changeKindFromResult(result) {
  if (Number(result?.cancelledAppointmentId) > 0) return 'cancellation';
  const text = resultText(result);
  if (/✅\s*Service changed to/i.test(text)) return 'service';
  if (/✅\s*Practitioner changed to/i.test(text)) return 'practitioner';
  if (/✅\s*Date\/time updated/i.test(text)) return 'time';
  if (/✅\s*Booked price updated/i.test(text)) return 'price';
  return null;
}

function replaceManageMessage(text) {
  return String(text || '').replace(
    'Choose what you want to change. No customer message is sent until Shiloh customer-change notifications are enabled.',
    'Choose what you want to change. After a successful saved change, Shiloh queues the customer’s latest WhatsApp confirmation.'
  );
}

function decorateCustomerNotification(result) {
  if (!result?.handled) return result;
  const appointmentId = appointmentIdFromResult(result);
  const changeKind = changeKindFromResult(result);
  const decorated = { ...result };
  if (decorated.reply) decorated.reply = replaceManageMessage(decorated.reply);
  if (decorated.interactive?.body) decorated.interactive = { ...decorated.interactive, body: replaceManageMessage(decorated.interactive.body) };
  if (!appointmentId || !changeKind) return decorated;

  if (decorated.interactive?.body && !/Customer WhatsApp confirmation:/i.test(decorated.interactive.body)) {
    decorated.interactive = { ...decorated.interactive, body: decorated.interactive.body.replace(/\n\n\*Manage booking #/i, '\nCustomer WhatsApp confirmation: queued.\n\n*Manage booking #') };
  }
  if (decorated.reply && changeKind === 'cancellation' && !/Customer WhatsApp cancellation confirmation:/i.test(decorated.reply)) {
    decorated.reply += '\nCustomer WhatsApp cancellation confirmation: queued.';
  }

  const priorPostSend = decorated.postSend;
  decorated.postSend = async () => {
    if (typeof priorPostSend === 'function') await priorPostSend();
    const queued = await queueCustomerChangeNotification(appointmentId, changeKind);
    logger.info({ appointmentId, changeKind, queued: queued?.queued === true, reason: queued?.reason || queued?.attempted?.reason || null }, 'Customer booking-change notification queued');
  };
  return decorated;
}

function wrap(target, key) {
  const original = target[key];
  if (typeof original !== 'function') throw new Error(`Cannot install customer notification patch: ${key} is unavailable`);
  target[key] = async (...args) => decorateCustomerNotification(await original(...args));
}

wrap(bookingUpdate, 'processAdminBookingUpdateMessage');
wrap(statelessBookingUpdate, 'processStatelessAdminBookingUpdateMessage');
wrap(adminCancellation, 'processAdminAppointmentCancellationMessage');
startCustomerChangeNotificationScheduler();

module.exports = { resultText, appointmentIdFromResult, changeKindFromResult, replaceManageMessage, decorateCustomerNotification };
