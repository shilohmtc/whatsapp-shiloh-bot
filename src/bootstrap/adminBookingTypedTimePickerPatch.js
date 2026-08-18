const Module = require('node:module');
const { normalizePhone } = require('../services/clientIdentityOnboarding');
const { loadAdminMobileBookingSession } = require('../services/adminMobileBookingSession');

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function parseTypedStartTime(value = '') {
  const raw = clean(value).toLowerCase();
  let match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour <= 23 && minute <= 59) return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return null;
  }

  match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  if (match[3] === 'am') hour = hour === 12 ? 0 : hour;
  else hour = hour === 12 ? 12 : hour + 12;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatSlotTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function slotRows(interactive) {
  if (!interactive || interactive.type !== 'list' || !Array.isArray(interactive.rows)) return [];
  return interactive.rows.filter((row) => /^admin_booking_slot:\d+$/i.test(String(row?.id || '')));
}

function nearestStarts(slots, requested) {
  if (!Array.isArray(slots) || !slots.length) return [];
  const [rh, rm] = requested.split(':').map(Number);
  const target = rh * 60 + rm;
  return slots
    .map((slot) => {
      const time = formatSlotTime(slot.starts_at);
      const [h, m] = time.split(':').map(Number);
      return { time, distance: Math.abs(h * 60 + m - target) };
    })
    .sort((a, b) => a.distance - b.distance || a.time.localeCompare(b.time))
    .slice(0, 3)
    .map((item) => item.time);
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  const exported = originalLoad.apply(this, arguments);
  if (typeof request === 'string' && /(?:^|\/)adminMobileBookingFlow(?:\.js)?$/.test(request) && exported && typeof exported.processAdminMobileBookingFlowMessage === 'function' && !exported.__typedTimePickerPatched) {
    const original = exported.processAdminMobileBookingFlowMessage;
    exported.processAdminMobileBookingFlowMessage = async function adminBookingTypedTimePicker(sender, text, ...rest) {
      const phone = normalizePhone(sender);
      const session = await loadAdminMobileBookingSession(phone);
      const requested = session?.step === 'slot' ? parseTypedStartTime(text) : null;

      if (requested && Array.isArray(session.slots)) {
        const index = session.slots.findIndex((slot) => formatSlotTime(slot.starts_at) === requested);
        if (index >= 0) {
          return original(sender, `admin_booking_slot:${index}`, ...rest);
        }
        const base = await original(sender, text, ...rest);
        const nearest = nearestStarts(session.slots, requested);
        return {
          ...base,
          reply: [
            `*${requested} is not currently an authoritative bookable start time.*`,
            nearest.length ? `Nearest available starts: ${nearest.join(', ')}.` : 'No authoritative start times are currently available on this date.',
            '',
            'Nothing has been booked. Choose one of the available starts or choose another date.',
          ].join('\n'),
          interactive: undefined,
        };
      }

      let result = await original(sender, text, ...rest);
      if (session?.step === 'slot' && Array.isArray(session.slots) && session.slots.length > 0 && result?.interactive?.type === 'list' && slotRows(result.interactive).length === 0) {
        result = await original(sender, 'admin_booking_page:0', ...rest);
      }
      return result;
    };
    Object.defineProperty(exported, '__typedTimePickerPatched', { value: true });
  }
  return exported;
};

module.exports = { parseTypedStartTime, nearestStarts, slotRows };
