// #765 retirement facade. Normal staff operations are available only in Workspace.
function getMenuOptions() { return []; }
function menu() { return 'WhatsApp Admin has retired. Use Shiloh Workspace for staff operations.'; }
async function processAdminMobileMenuMessage() { return { handled: false }; }

module.exports = { getMenuOptions, menu, processAdminMobileMenuMessage };
