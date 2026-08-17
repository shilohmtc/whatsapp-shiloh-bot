const TIME_ZONE = 'Africa/Johannesburg';

const time24Formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatTime24(value) {
  return time24Formatter.format(new Date(value));
}

function formatTimeRange24(startsAt, endsAt) {
  return `${formatTime24(startsAt)}–${formatTime24(endsAt)}`;
}

module.exports = {
  TIME_ZONE,
  formatTime24,
  formatTimeRange24,
};
