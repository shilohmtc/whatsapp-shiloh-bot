const mobileMenu = require('../services/adminMobileMenu');
const manageClients = require('../services/adminManageClients');

const originalProcessAdminMobileMenuMessage = mobileMenu.processAdminMobileMenuMessage;

mobileMenu.processAdminMobileMenuMessage = async function processAdminMobileMenuMessageWithManageClients(sender, text) {
  const managed = await manageClients.processAdminManageClientsMessage(sender, text);
  if (managed?.handled) return managed;
  const result = await originalProcessAdminMobileMenuMessage(sender, text);
  return manageClients.decorateAdminMenuResult(result);
};

// Load the polished interactive menu only after the mobile export above is patched,
// so its captured mobile dispatcher includes Manage clients from first require.
const interactiveMenu = require('../services/adminInteractiveMenu');
const clientAction = interactiveMenu.ACTIONS.find((action) => action.key === 'client');
if (clientAction && !interactiveMenu.ACTIONS.some((action) => action.key === 'manage_clients')) {
  clientAction.key = 'manage_clients';
  clientAction.labels = ['Manage clients', 'Manage client', 'Find a client', 'Find my client', 'Client details', 'My client details'];
  clientAction.command = 'Manage clients';
  clientAction.description = 'Select an authorized CRM client and manage bookings';

  // Keep already-delivered admin_action_client buttons safe during the transition.
  interactiveMenu.ACTIONS.push({
    key: 'client',
    labels: ['Legacy client action compatibility'],
    command: 'Manage clients',
    description: 'Open Manage clients',
  });
}

module.exports = {
  originalProcessAdminMobileMenuMessage,
};
