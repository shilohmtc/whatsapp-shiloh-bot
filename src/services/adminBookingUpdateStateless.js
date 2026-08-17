const { processAdminBookingUpdateMessage } = require('./adminBookingUpdate');

function appointmentIdFromBody(body = '') {
  const match = String(body || '').match(/Manage booking #(\d+)/i);
  return match ? Number(match[1]) : null;
}

function scopeId(id, appointmentId) {
  const raw = String(id || '');
  if (!appointmentId) return raw;
  if (raw === 'manage_change_service') return `manage_change_service_${appointmentId}`;
  if (raw === 'manage_booking_menu') return `manage_booking_menu_${appointmentId}`;
  if (raw === 'manage_booking_back') return `manage_booking_back_${appointmentId}`;
  const servicePick = raw.match(/^manage_service_pick_(\d+)$/i);
  if (servicePick) return `manage_service_pick_${appointmentId}_${servicePick[1]}`;
  const servicePage = raw.match(/^manage_service_page_(\d+)$/i);
  if (servicePage) return `manage_service_page_${appointmentId}_${servicePage[1]}`;
  return raw;
}

function scopeRows(rows, appointmentId) {
  return Array.isArray(rows)
    ? rows.map((row) => ({ ...row, id: scopeId(row.id, appointmentId) }))
    : rows;
}

function scopeAdminBookingInteractive(result) {
  if (!result?.interactive) return result;
  const appointmentId = appointmentIdFromBody(result.interactive.body);
  if (!appointmentId) return result;
  const interactive = { ...result.interactive };
  if (Array.isArray(interactive.rows)) interactive.rows = scopeRows(interactive.rows, appointmentId);
  if (Array.isArray(interactive.buttons)) interactive.buttons = scopeRows(interactive.buttons, appointmentId);
  if (Array.isArray(interactive.sections)) {
    interactive.sections = interactive.sections.map((section) => ({
      ...section,
      rows: scopeRows(section.rows, appointmentId),
    }));
  }
  return { ...result, interactive };
}

async function primeAppointment(sender, appointmentId) {
  const opened = await processAdminBookingUpdateMessage(sender, 'Manage a booking');
  if (!opened?.handled) return opened;
  return processAdminBookingUpdateMessage(sender, `manage_booking_select_${appointmentId}`);
}

async function processStatelessAdminBookingUpdateMessage(sender, text) {
  const raw = String(text || '').trim();

  let match = raw.match(/^manage_change_service_(\d+)$/i);
  if (match) {
    const primed = await primeAppointment(sender, Number(match[1]));
    if (!primed?.handled) return primed || { handled: false };
    return processAdminBookingUpdateMessage(sender, 'manage_change_service');
  }

  match = raw.match(/^manage_service_pick_(\d+)_(\d+)$/i);
  if (match) {
    const appointmentId = Number(match[1]);
    const serviceId = Number(match[2]);
    const primed = await primeAppointment(sender, appointmentId);
    if (!primed?.handled) return primed || { handled: false };
    const picker = await processAdminBookingUpdateMessage(sender, 'manage_change_service');
    if (!picker?.handled) return picker || { handled: false };
    return processAdminBookingUpdateMessage(sender, `manage_service_pick_${serviceId}`);
  }

  match = raw.match(/^manage_service_page_(\d+)_(\d+)$/i);
  if (match) {
    const appointmentId = Number(match[1]);
    const page = Number(match[2]);
    const primed = await primeAppointment(sender, appointmentId);
    if (!primed?.handled) return primed || { handled: false };
    const picker = await processAdminBookingUpdateMessage(sender, 'manage_change_service');
    if (!picker?.handled) return picker || { handled: false };
    return processAdminBookingUpdateMessage(sender, `manage_service_page_${page}`);
  }

  match = raw.match(/^manage_booking_menu_(\d+)$/i);
  if (match) return primeAppointment(sender, Number(match[1]));

  match = raw.match(/^manage_booking_back_(\d+)$/i);
  if (match) {
    const primed = await primeAppointment(sender, Number(match[1]));
    if (!primed?.handled) return primed || { handled: false };
    return processAdminBookingUpdateMessage(sender, 'manage_booking_back');
  }

  return { handled: false };
}

module.exports = {
  appointmentIdFromBody,
  scopeAdminBookingInteractive,
  processStatelessAdminBookingUpdateMessage,
};
