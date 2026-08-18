const logger = require('../lib/logger');
const adminBookingUpdate = require('../services/adminBookingUpdate');
const statelessAdminBookingUpdate = require('../services/adminBookingUpdateStateless');
const { checkCalendarAvailability, calendarEnabled } = require('../services/googleBookingCalendar');

const PROVIDER_MESSAGE = 'Google Calendar is temporarily unavailable, so Shiloh cannot safely change this booking. No change was saved. Please reconnect Google Calendar, then try again.';

function isGoogleCalendarProviderFailure(error) {
  const message = String(error?.message || '');
  const body = typeof error?.body === 'string' ? error.body : JSON.stringify(error?.body || '');
  return /Google (?:OAuth|Calendar|service-account)/i.test(message)
    || /invalid_grant|expired or revoked|refresh-token request failed/i.test(`${message} ${body}`);
}

function wrapProcessor(target, key) {
  const original = target?.[key];
  if (typeof original !== 'function') return;
  target[key] = async (...args) => {
    try {
      return await original(...args);
    } catch (error) {
      if (!isGoogleCalendarProviderFailure(error)) throw error;
      logger.error({ err: error, provider: 'google_calendar', guardedFlow: key }, 'Google Calendar provider unavailable; booking mutation failed closed');
      return { handled: true, reply: PROVIDER_MESSAGE, providerBlocked: 'google_calendar' };
    }
  };
}

wrapProcessor(adminBookingUpdate, 'processAdminBookingUpdateMessage');
wrapProcessor(statelessAdminBookingUpdate, 'processStatelessAdminBookingUpdateMessage');

async function probeGoogleCalendarProvider() {
  if (!calendarEnabled()) return;
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 60 * 1000);
  try {
    await checkCalendarAvailability({ startsAt, endsAt, staffName: null, ignoreEventId: null });
    logger.info({ provider: 'google_calendar' }, 'Google Calendar provider health check passed');
  } catch (error) {
    if (isGoogleCalendarProviderFailure(error)) {
      logger.error({ err: error, provider: 'google_calendar' }, 'Google Calendar provider health check failed; booking mutations remain fail-closed');
      return;
    }
    logger.warn({ err: error, provider: 'google_calendar' }, 'Google Calendar provider health check could not complete');
  }
}

setImmediate(() => {
  probeGoogleCalendarProvider();
  const timer = setInterval(probeGoogleCalendarProvider, 30 * 60 * 1000);
  timer.unref?.();
});

module.exports = { isGoogleCalendarProviderFailure, PROVIDER_MESSAGE, probeGoogleCalendarProvider };
