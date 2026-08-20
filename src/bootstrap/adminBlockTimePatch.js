const interactiveMenu = require('../services/adminInteractiveMenu');
const { processAdminBlockTimeMessage, canPresentBlockTime } = require('../services/adminBlockTime');

function enrichAppointments(result) {
  if (!result?.handled || !result?.interactive || result.interactive.type !== 'list') return result;
  if (!/^\*Appointments\*/.test(String(result.interactive.body || ''))) return result;
  if (!canPresentBlockTime(result.admin)) return result;
  const rows = Array.isArray(result.interactive.rows) ? [...result.interactive.rows] : [];
  if (rows.some((row) => row.id === 'admin_appointment_block_time')) return result;
  const insertAt = Math.max(0, rows.findIndex((row) => ['admin_action_manage_booking', 'admin_appointment_manage'].includes(row.id)));
  const additions = [
    { id: 'admin_appointment_block_time', title: 'Block time', description: 'Make practitioner time unavailable for booking' },
    { id: 'admin_block_manage', title: 'Blocked time', description: 'View, edit or remove upcoming Shiloh blocks' },
  ];
  if (insertAt > 0) rows.splice(insertAt, 0, ...additions);
  else {
    const backAt = rows.findIndex((row) => row.id === 'menu');
    if (backAt >= 0) rows.splice(backAt, 0, ...additions);
    else rows.push(...additions);
  }
  return { ...result, interactive: { ...result.interactive, rows } };
}

if (!interactiveMenu.__adminBlockTimePatched) {
  const original = interactiveMenu.processAdminInteractiveMenuMessage;
  interactiveMenu.processAdminInteractiveMenuMessage = async function processAdminInteractiveMenuWithBlockTime(sender, text) {
    const blockTime = await processAdminBlockTimeMessage(sender, text);
    if (blockTime?.handled) return blockTime;
    return enrichAppointments(await original(sender, text));
  };
  Object.defineProperty(interactiveMenu, '__adminBlockTimePatched', { value: true, enumerable: false });
}

module.exports = { enrichAppointments };
