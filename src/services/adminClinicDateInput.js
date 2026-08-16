const MONTHS = Object.freeze({
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
});

const WEEKDAYS = Object.freeze({
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
});

function clean(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function johannesburgToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function isoDate(year, month, day) {
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() + 1 !== month || probe.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseClinicDateInput(value, { now = new Date() } = {}) {
  const raw = clean(value);
  const today = johannesburgToday(now);
  if (!raw) return null;
  if (raw === 'today') return today;
  if (raw === 'tomorrow') return addDays(today, 1);

  let match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) return isoDate(Number(match[3]), Number(match[2]), Number(match[1]));

  match = raw.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
  if (match) {
    const day = Number(match[1]);
    const month = MONTHS[match[2]];
    if (!month) return null;
    const year = match[3] ? Number(match[3]) : Number(today.slice(0, 4));
    return isoDate(year, month, day);
  }

  match = raw.match(/^(next\s+)?([a-z]+)$/);
  if (match && WEEKDAYS[match[2]] !== undefined) {
    const target = WEEKDAYS[match[2]];
    const base = new Date(`${today}T12:00:00Z`);
    const current = base.getUTCDay();
    let delta = (target - current + 7) % 7;
    if (match[1]) delta = delta === 0 ? 7 : delta + 7;
    return addDays(today, delta);
  }

  return null;
}

function toDayFirst(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return null;
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

module.exports = { parseClinicDateInput, toDayFirst, johannesburgToday };
