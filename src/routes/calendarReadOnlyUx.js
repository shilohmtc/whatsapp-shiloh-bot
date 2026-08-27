const express = require('express');
const { pool } = require('../db/pool');
const calendarReadOnlyUx = require('../services/calendarReadOnlyUx');
const { renderCalendarPage, renderUnavailablePage } = require('../presentation/calendarReadOnlyUx');
const { isCalendarBridgeEnabled } = require('../middleware/staffBrowserSession');
const { isEmergencyCalendarBookingEnabled } = require('../services/emergencyCalendarBootstrap');
const { createCalendarCreateBookingService } = require('../services/calendarCreateBooking');

const CALENDAR_VIEWER_CONTEXT = Symbol.for('shiloh.calendar.server.viewer');

function isFeatureEnabled(env = process.env) {
  return String(env.SHILOH_CALENDAR_READONLY_UX_ENABLED || '').trim().toLowerCase() === 'true';
}

function resolveServerViewer(req) {
  const context = req?.[CALENDAR_VIEWER_CONTEXT];
  if (!context || context.authenticated !== true || context.source !== 'server_staff_session') return null;
  if (!context.viewer || typeof context.viewer !== 'object') return null;
  return context.viewer;
}

function setCalendarSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function statusForError(error) {
  if (error?.code === 'CALENDAR_UX_AUTH_REQUIRED' || error?.code === 'SCHEDULING_TIMELINE_FORBIDDEN') return 403;
  if (error?.code === 'CALENDAR_UX_STAFF_FILTER_FORBIDDEN') return 403;
  if (String(error?.code || '').startsWith('CALENDAR_UX_INVALID_') || String(error?.code || '').startsWith('SCHEDULING_TIMELINE_INVALID_')) return 400;
  return 503;
}

function safeUnavailableMessage(error) {
  if (error?.code === 'SCHEDULING_GOOGLE_CALENDAR_REQUIRED') return 'Google Calendar provider state is unavailable, so Shiloh Calendar is failing closed.';
  if (error?.code === 'CALENDAR_UX_STAFF_FILTER_FORBIDDEN') return 'That practitioner is outside your authenticated Calendar scope.';
  if (statusForError(error) === 400) return 'The requested Calendar view or filter is invalid.';
  if (statusForError(error) === 403) return 'Your authenticated Shiloh access does not permit this Calendar view.';
  return 'SchedulingTimeline is unavailable, so Shiloh Calendar is failing closed.';
}

function decorateEmergencyBookingEntry(html, dateKey, bookingPath = '/calendar/book') {
  const href = `${bookingPath}?date=${encodeURIComponent(String(dateKey || ''))}`;
  return String(html)
    .replace('<div class="access-controls">', `<div class="access-controls"><a class="nav-button" href="${href}">Create booking</a><a class="nav-button" href="/calendar/client-authority">Confirm client contact</a>`)
    .replace('Africa/Johannesburg • Read-only • Google-only busy is non-canonical', 'Africa/Johannesburg • Read-only timeline • Google-only busy is non-canonical')
    .replace('Read-only operational view. Booking, reschedule, cancellation, block, leave and schedule mutations are not available here.', 'Timeline remains read-only. New booking creation uses the separately guarded canonical workflow. Reschedule, cancellation, drag/drop, reassignment, block, leave and schedule mutations are not available here.');
}

function createCalendarReadOnlyHandler({
  env = process.env,
  buildModel = calendarReadOnlyUx.buildModel,
  renderPage = renderCalendarPage,
  renderUnavailable = renderUnavailablePage,
  resolveViewer = resolveServerViewer,
  staffAccessPath = '/calendar/staff',
  bookingPath = '/calendar/book',
  bookingService = createCalendarCreateBookingService({ db: pool, env }),
} = {}) {
  return async function calendarReadOnlyHandler(req, res, next) {
    try {
      setCalendarSecurityHeaders(res);
      if (!isFeatureEnabled(env)) return res.status(404).type('text/plain').send('Not Found');

      const viewer = resolveViewer(req);
      if (!viewer) {
        if (isCalendarBridgeEnabled(env)) {
          res.setHeader('Location', `${staffAccessPath}?reason=session`);
          return res.status(302).type('text/plain').send('Staff sign-in required');
        }
        return res.status(503).type('html').send(renderUnavailable({
          code: 'CALENDAR_SECURE_ACCESS_NOT_CONFIGURED',
          message: 'Secure browser staff sign-in is not configured for this Calendar surface yet.',
        }));
      }

      const model = await buildModel({
        view: req.query?.view,
        date: req.query?.date,
        staff: req.query?.staff,
        viewer,
      });
      let html = renderPage(model, {
        basePath: req.baseUrl || '/calendar/read-only',
        staffAccessPath,
        staffAccessScriptPath: `${staffAccessPath}/client.js`,
      });

      if (isEmergencyCalendarBookingEnabled(env)) {
        try {
          await bookingService.resolveOperator(req.staffBrowserSession?.adminId);
          html = decorateEmergencyBookingEntry(html, model.dateKey, bookingPath);
        } catch (_bookingAuthorityError) {
          // The timeline is still safe to render, but booking entry must fail closed.
          // The /calendar/book surface independently revalidates the same authority.
        }
      }
      return res.status(200).type('html').send(html);
    } catch (error) {
      if (res.headersSent) return next(error);
      const status = statusForError(error);
      return res.status(status).type('html').send(renderUnavailable({
        code: error?.code || 'CALENDAR_UNAVAILABLE',
        message: safeUnavailableMessage(error),
      }));
    }
  };
}

function createCalendarReadOnlyRouter(options = {}) {
  const router = express.Router();
  router.get('/', createCalendarReadOnlyHandler(options));
  return router;
}

module.exports = createCalendarReadOnlyRouter();
module.exports.CALENDAR_VIEWER_CONTEXT = CALENDAR_VIEWER_CONTEXT;
module.exports.createCalendarReadOnlyHandler = createCalendarReadOnlyHandler;
module.exports.createCalendarReadOnlyRouter = createCalendarReadOnlyRouter;
module.exports.isFeatureEnabled = isFeatureEnabled;
module.exports.resolveServerViewer = resolveServerViewer;
module.exports.setCalendarSecurityHeaders = setCalendarSecurityHeaders;
module.exports.decorateEmergencyBookingEntry = decorateEmergencyBookingEntry;
