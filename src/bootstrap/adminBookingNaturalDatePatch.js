const Module = require('node:module');

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
  return !Number.isNaN(probe.getTime()) &&
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() + 1 === month &&
    probe.getUTCDate() === day;
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
  return exported;
};

module.exports = { expandAdminBookingDateInput };
