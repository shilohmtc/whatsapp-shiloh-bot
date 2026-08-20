const interactiveMenu = require('../services/adminInteractiveMenu');
const { processAdminBlockTimeMessage } = require('../services/adminBlockTime');

if (!interactiveMenu.__adminBlockTimePatched) {
  const original = interactiveMenu.processAdminInteractiveMenuMessage;
  interactiveMenu.processAdminInteractiveMenuMessage = async function processAdminInteractiveMenuWithBlockTime(sender, text) {
    const blockTime = await processAdminBlockTimeMessage(sender, text);
    if (blockTime?.handled) return blockTime;
    return original(sender, text);
  };
  Object.defineProperty(interactiveMenu, '__adminBlockTimePatched', { value: true, enumerable: false });
}
