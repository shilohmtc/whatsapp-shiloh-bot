const Module = require('node:module');
const nextAvailable = require('../services/adminBookingNextAvailable');
const { pool } = require('../db/pool');

const activeTimeBookingBySender = new Map();

const MONTHS = new Map([
  ['jan',1],['january',1],['feb',2],['february',2],['mar',3],['march',3],['apr',4],['april',4],
  ['may',5],['jun',6],['june',6],['jul',7],['july',7],['aug',8],['august',8],['sep',9],['sept',9],['september',9],
  ['oct',10],['october',10],['nov',11],['november',11],['dec',12],['december',12],
]);

function johannesburgToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function validDate(year, month, day) {
  const probe = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T12:00:00+02:00`);
  return !Number.isNaN(probe.getTime()) && probe.getUTCFullYear() === year && probe.getUTCMonth() + 1 === month && probe.getUTCDate() === day;
}

function resolveYear(month, day, explicitYear = null) {
  if (explicitYear) return explicitYear;
  const today = johannesburgToday();
  const candidate = month > today.month || (month === today.month && day >= today.day);
  return candidate ? today.year : today.year + 1;
}

function expandAdminBookingDateInput(value) {
  const raw = String(value || '').trim();
  let day, month, year;
  let m = raw.match(/^(\d{1,2})[\/-](\d{1,2})$/);
  if (m) {
    day = Number(m[1]); month = Number(m[2]); year = resolveYear(month, day);
  } else {
    m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?$/);
    if (!m) return raw;
    day = Number(m[1]); month = MONTHS.get(m[2].toLowerCase()); year = resolveYear(month, day, m[3] ? Number(m[3]) : null);
  }
  if (!month || !validDate(year, month, day)) return raw;
  return `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
}

function senderKey(sender) { return String(sender || '').replace(/\D/g, ''); }

function parseDirectDateTime(text) {
  const raw = String(text || '').trim();
  let m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s+(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)$/i);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!validDate(year, month, day)) return null;
  return { year, month, day, hour: Number(m[4]), minute: Number(m[5]) };
}

async function bookingTimestamp(appointmentId, text) {
  const raw = String(text || '').trim();
  const direct = parseDirectDateTime(raw);
  let year, month, day, hour, minute;

  if (direct) {
    ({ year, month, day, hour, minute } = direct);
  } else {
    const m = raw.match(/^(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)$/i);
    if (!m) return null;
    const r = await pool.query('SELECT starts_at FROM appointments WHERE id=$1 AND status<>\'cancelled\' LIMIT 1', [appointmentId]);
    if (!r.rowCount) return null;
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(r.rows[0].starts_at));
    const get = (type) => Number(parts.find((p) => p.type === type)?.value);
    year = get('year'); month = get('month'); day = get('day'); hour = Number(m[1]); minute = Number(m[2]);
  }

  const iso = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+02:00`;
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt.getTime();
}

const originalImmediate = nextAvailable.processImmediateTimeAction;
nextAvailable.processImmediateTimeAction = async function directBookingTimeShortcut(sender, text, processAdminBookingUpdateMessage) {
  const raw = String(text || '').trim();
  const key = senderKey(sender);
  let match = raw.match(/^manage_change_time_(\d+)$/i);
  if (match) activeTimeBookingBySender.set(key, Number(match[1]));
  if (/^manage_quick_reschedule_other_/i.test(raw)) activeTimeBookingBySender.delete(key);

  const appointmentId = activeTimeBookingBySender.get(key);
  const isTimeOnly = /^(?:at\s+)?(?:[01]?\d|2[0-3]):[0-5]\d$/i.test(raw);
  const isDateTime = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\s+(?:at\s+)?(?:[01]?\d|2[0-3]):[0-5]\d$/i.test(raw);
  if (appointmentId && (isTimeOnly || isDateTime)) {
    const timestamp = await bookingTimestamp(appointmentId, raw);
    if (timestamp) {
      const result = await originalImmediate(sender, `manage_quick_reschedule_slot_${appointmentId}_${timestamp}`, processAdminBookingUpdateMessage);
      if (result?.handled) activeTimeBookingBySender.delete(key);
      return result;
    }
  }
  return originalImmediate(sender, text, processAdminBookingUpdateMessage);
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  const exported = originalLoad.apply(this, arguments);
  if (typeof request === 'string' && /(?:^|\/)adminBookingUpdate(?:\.js)?$/.test(request) && exported && typeof exported.processAdminBookingUpdateMessage === 'function' && !exported.__naturalDatePatched) {
    const original = exported.processAdminBookingUpdateMessage;
    exported.processAdminBookingUpdateMessage = async function naturalDateBookingUpdate(sender, text, ...rest) {
      return original(sender, expandAdminBookingDateInput(text), ...rest);
    };
    Object.defineProperty(exported, '__naturalDatePatched', { value: true });
  }
  if (typeof request === 'string' && /(?:^|\/)adminBookingUpdateStateless(?:\.js)?$/.test(request) && exported && !exported.__nextAvailablePatched) {
    if (typeof exported.scopeAdminBookingInteractive === 'function') {
      const originalScope = exported.scopeAdminBookingInteractive;
      exported.scopeAdminBookingInteractive = function nextAvailableScopedResult(result) {
        return nextAvailable.scopeImmediateTimeActions(originalScope(result));
      };
    }
    if (typeof exported.processStatelessAdminBookingUpdateMessage === 'function') {
      const originalStateless = exported.processStatelessAdminBookingUpdateMessage;
      exported.processStatelessAdminBookingUpdateMessage = async function nextAvailableStateless(sender, text, ...rest) {
        const bookingUpdate = require('../services/adminBookingUpdate');
        const immediate = await nextAvailable.processImmediateTimeAction(sender, text, bookingUpdate.processAdminBookingUpdateMessage);
        if (immediate?.handled) return immediate;
        return originalStateless(sender, text, ...rest);
      };
    }
    Object.defineProperty(exported, '__nextAvailablePatched', { value: true });
  }
  return exported;
};

module.exports = { expandAdminBookingDateInput, parseDirectDateTime };
