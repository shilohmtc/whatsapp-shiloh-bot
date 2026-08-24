const DELIVERY_FLAG = 'SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED';

function isStaffBrowserWhatsAppDeliveryEnabled(env = process.env) {
  return String(env[DELIVERY_FLAG] || '').trim().toLowerCase() === 'true';
}

function createStaffBrowserChallengeDispatcher({ env = process.env, sendMessage = null } = {}) {
  if (!isStaffBrowserWhatsAppDeliveryEnabled(env)) return null;
  const providerSend = sendMessage || require('./whatsapp').sendWhatsAppMessage;
  if (typeof providerSend !== 'function') throw new Error('staff browser WhatsApp provider is unavailable');

  return async function dispatchStaffBrowserChallenge({ destination, code, expiresAt } = {}) {
    const to = String(destination || '').trim();
    const challenge = String(code || '').trim().toUpperCase();
    if (!/^\+?\d{10,15}$/.test(to) || !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/.test(challenge)) {
      throw new Error('invalid staff browser authentication delivery payload');
    }
    const expiryMinutes = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000));
    const message = `Your Shiloh staff sign-in code is ${challenge}. It expires in about ${expiryMinutes} minutes. If you did not request this, ignore this message.`;
    return providerSend(to, message);
  };
}

module.exports = {
  DELIVERY_FLAG,
  isStaffBrowserWhatsAppDeliveryEnabled,
  createStaffBrowserChallengeDispatcher,
};
