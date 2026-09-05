const BUSINESS_TIMEZONE = 'Africa/Johannesburg';
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function dateParts(dateKey) {
  if (!DATE_KEY.test(String(dateKey || ''))) return null;
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day, date };
}

function dayOfWeek(dateKey) {
  return dateParts(dateKey)?.date.getUTCDay() ?? null;
}

function isSundayDateKey(dateKey) {
  return dayOfWeek(dateKey) === 0;
}

function isOperationalDateKey(dateKey) {
  const day = dayOfWeek(dateKey);
  return day != null && day !== 0;
}

function dateKeyInBusinessTimezone(value) {
  if (DATE_KEY.test(String(value || ''))) return String(value);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

module.exports = {
  BUSINESS_TIMEZONE,
  dateKeyInBusinessTimezone,
  dayOfWeek,
  isOperationalDateKey,
  isSundayDateKey,
};
