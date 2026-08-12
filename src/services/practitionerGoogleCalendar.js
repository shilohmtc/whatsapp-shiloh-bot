const {
  calendarEnabled,
  checkCalendarAvailabilityOnCalendar,
  createBookingEventOnCalendar,
  updateBookingEventOnCalendar,
  cancelBookingEventOnCalendar,
  deterministicEventId,
} = require('./googleBookingCalendar');

const ENV_BY_STAFF = Object.freeze({
  christel: 'GOOGLE_CHRISTEL_CALENDAR_ID',
  abigail: 'GOOGLE_ABIGAIL_CALENDAR_ID',
  marietjie: 'GOOGLE_MARIETJIE_CALENDAR_ID',
});

function normalizeStaffName(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function practitionerCalendarId(staffName) {
  const envName = ENV_BY_STAFF[normalizeStaffName(staffName)];
  if (!envName) return null;
  return String(process.env[envName] || '').trim() || null;
}

function requirePractitionerCalendarId(staffName) {
  const normalized = normalizeStaffName(staffName);
  const envName = ENV_BY_STAFF[normalized];
  if (!envName) return null;
  const calendarId = practitionerCalendarId(staffName);
  if (!calendarId && calendarEnabled()) {
    throw new Error(`${envName} is required for ${staffName} practitioner calendar synchronization.`);
  }
  return calendarId;
}

async function checkPractitionerCalendarAvailability({ staffName, startsAt, endsAt, ignoreEventId = null }) {
  if (!calendarEnabled()) return { enabled: false, configured: false, available: true, conflicts: [] };
  const calendarId = requirePractitionerCalendarId(staffName);
  if (!calendarId) return { enabled: true, configured: false, available: true, conflicts: [] };
  const result = await checkCalendarAvailabilityOnCalendar(calendarId, {
    startsAt,
    endsAt,
    staffName: null,
    ignoreEventId,
  });
  return { ...result, configured: true, calendarId };
}

async function createPractitionerBookingEvent(data) {
  if (!calendarEnabled()) return { enabled: false, configured: false, event: null };
  const calendarId = requirePractitionerCalendarId(data.staffName);
  if (!calendarId) return { enabled: true, configured: false, event: null };
  const result = await createBookingEventOnCalendar(calendarId, data);
  return { ...result, configured: true, calendarId };
}

async function updatePractitionerBookingEvent(data) {
  if (!calendarEnabled()) return { enabled: false, configured: false, event: null };
  const calendarId = requirePractitionerCalendarId(data.staffName);
  if (!calendarId) return { enabled: true, configured: false, event: null };
  const eventId = data.eventId || deterministicEventId(`shiloh-appointment:${data.appointmentId}`);
  const result = await updateBookingEventOnCalendar(calendarId, { ...data, eventId });
  return { ...result, configured: true, calendarId };
}

async function cancelPractitionerBookingEvent({ appointmentId, staffName }) {
  if (!calendarEnabled()) return { enabled: false, configured: false, cancelled: false };
  const calendarId = requirePractitionerCalendarId(staffName);
  if (!calendarId) return { enabled: true, configured: false, cancelled: false };
  const eventId = deterministicEventId(`shiloh-appointment:${appointmentId}`);
  const result = await cancelBookingEventOnCalendar(eventId, calendarId);
  return { ...result, configured: true, calendarId, eventId };
}

module.exports = {
  ENV_BY_STAFF,
  normalizeStaffName,
  practitionerCalendarId,
  requirePractitionerCalendarId,
  checkPractitionerCalendarAvailability,
  createPractitionerBookingEvent,
  updatePractitionerBookingEvent,
  cancelPractitionerBookingEvent,
};
