const adminInteractiveMenu = require('../services/adminInteractiveMenu');
const { pool } = require('../db/pool');
const {
  createEmergencyCalendarBootstrapService,
  buildEmergencyCalendarUrl,
} = require('../services/emergencyCalendarBootstrap');

const originalProcessAdminInteractiveMenuMessage = adminInteractiveMenu.processAdminInteractiveMenuMessage;
const bootstrapService = createEmergencyCalendarBootstrapService({ db: pool });

function isEmergencyCalendarCommand(text = '') {
  return /^(?:open\s+)?(?:shiloh\s+)?calendar(?:\s+booking)?$/i.test(String(text || '').trim());
}

adminInteractiveMenu.processAdminInteractiveMenuMessage = async function patchedAdminInteractiveMenuMessage(sender, text, ...rest) {
  if (!isEmergencyCalendarCommand(text)) {
    return originalProcessAdminInteractiveMenuMessage(sender, text, ...rest);
  }

  const issued = await bootstrapService.issueForWhatsapp({ whatsapp: sender });
  if (!issued.ok) {
    if (issued.code === 'EMERGENCY_CALENDAR_DISABLED') {
      return { handled: true, reply: 'Secure Calendar booking access is not active yet.' };
    }
    return { handled: true, reply: 'Secure Calendar access is not available for this Admin account.' };
  }

  const url = buildEmergencyCalendarUrl(issued.token);
  if (!url) {
    return { handled: true, reply: 'Secure Calendar access is temporarily unavailable because the browser origin is not configured.' };
  }

  return {
    handled: true,
    reply: [
      'Open your secure Shiloh Calendar:',
      url,
      '',
      'This handoff is short-lived and single-use. If it expires, send Open Calendar again.',
      'The link only exchanges into your existing secure Shiloh staff browser session; it does not make Calendar public.',
    ].join('\n'),
  };
};

module.exports = {
  isEmergencyCalendarCommand,
};
