const interactiveMenu = require('../services/adminInteractiveMenu');
const manageClients = require('../services/adminManageClients');

if (!interactiveMenu.__adminManageClientsPatched) {
  const original = interactiveMenu.processAdminInteractiveMenuMessage;
  interactiveMenu.processAdminInteractiveMenuMessage = async function processAdminInteractiveMenuWithManageClients(sender, text) {
    const raw = String(text || '').trim();

    // Preserve already-delivered legacy client buttons while promoting the new action.
    if (/^admin_action_(?:client|manage_clients)$/i.test(raw)) {
      return manageClients.processAdminManageClientsMessage(sender, 'Manage clients');
    }

    const managed = await manageClients.processAdminManageClientsMessage(sender, text);
    if (managed?.handled) return managed;

    return manageClients.decorateAdminMenuResult(await original(sender, text));
  };
  Object.defineProperty(interactiveMenu, '__adminManageClientsPatched', { value: true, enumerable: false });
}

module.exports = {};
