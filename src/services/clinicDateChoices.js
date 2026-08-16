const { getClinicWindowForDate } = require('./clinicHours');

const TZ = 'Africa/Johannesburg';

function localIsoDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function addIsoDays(isoDate, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ''))) return null;
  const [year, month, day] = String(isoDate).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + Number(days || 0), 12, 0, 0));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function shortDateTitle(isoDate) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

async function getClinicDateStatus({ locationId = null, date }) {
  return getClinicWindowForDate({ locationId, date });
}

async function getNextOpenClinicDates({ locationId = null, fromDate = localIsoDate(), count = 2, maxDays = 21 } = {}) {
  const results = [];
  for (let offset = 0; offset <= maxDays && results.length < count; offset += 1) {
    const date = addIsoDays(fromDate, offset);
    if (!date) break;
    const window = await getClinicWindowForDate({ locationId, date });
    if (!window.covered) continue;
    results.push({
      date,
      offset,
      title: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : shortDateTitle(date),
      window,
    });
  }
  return results;
}

module.exports = {
  TZ,
  addIsoDays,
  getClinicDateStatus,
  getNextOpenClinicDates,
  localIsoDate,
  shortDateTitle,
};
