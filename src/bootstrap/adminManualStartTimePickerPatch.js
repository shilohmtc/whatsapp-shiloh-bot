const Module = require('node:module');

function polishManualStartTimeInteractive(result) {
  const interactive = result?.interactive;
  if (!interactive || interactive.type !== 'list' || !Array.isArray(interactive.rows)) return result;

  const slotRows = interactive.rows.filter((row) => /^admin_booking_slot:\d+$/i.test(String(row?.id || '')));
  if (!slotRows.length) return result;

  const rows = interactive.rows.map((row) => {
    if (!/^admin_booking_slot:\d+$/i.test(String(row?.id || ''))) return row;
    const match = String(row.title || '').match(/^([0-2]\d:[0-5]\d)\s*[–-]\s*([0-2]\d:[0-5]\d)$/);
    if (!match) return row;
    return {
      ...row,
      title: match[1],
      description: `Ends ${match[2]} · available start`,
    };
  });

  const body = String(interactive.body || '');
  const guidance = 'Choose any available 15-minute start time. The full treatment must fit the practitioner diary and clinic schedule.';
  return {
    ...result,
    interactive: {
      ...interactive,
      body: body.includes('15-minute start time') ? body : `${body}\n\n${guidance}`,
      rows,
    },
  };
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  const exported = originalLoad.apply(this, arguments);
  if (typeof request === 'string' && /(?:^|\/)adminMobileBookingFlow(?:\.js)?$/.test(request) && exported && typeof exported.processAdminMobileBookingFlowMessage === 'function' && !exported.__manualStartTimePickerPatched) {
    const original = exported.processAdminMobileBookingFlowMessage;
    exported.processAdminMobileBookingFlowMessage = async function adminManualStartTimePicker(sender, text, ...rest) {
      return polishManualStartTimeInteractive(await original(sender, text, ...rest));
    };
    Object.defineProperty(exported, '__manualStartTimePickerPatched', { value: true });
  }
  return exported;
};

module.exports = { polishManualStartTimeInteractive };
