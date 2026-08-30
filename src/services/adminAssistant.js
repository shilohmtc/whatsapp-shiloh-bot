// Compatibility export for startup patches and older internal callers.
// Ordinary staff WhatsApp routing is owned by adminInteractiveMenu. The legacy
// assistant must never advertise or execute Calendar/CRM mutation commands.
async function processAdminAssistantMessage() {
  return { handled: false, retired: true };
}

module.exports = { processAdminAssistantMessage };
