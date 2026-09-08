// #765 retirement facade. WhatsApp no longer exposes an operational staff menu.
const { processRetiredAdminAuthorityMessage } = require('./adminAuthorityRetirement');

async function processAdminInteractiveMenuMessage(sender, text) {
  return processRetiredAdminAuthorityMessage(sender, text);
}

module.exports = {
  processAdminInteractiveMenuMessage,
  processAdminRetiredAuthorityMessage: processRetiredAdminAuthorityMessage,
};
