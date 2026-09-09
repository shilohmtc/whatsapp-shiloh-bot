const express = require('express');
const { pool } = require('../db/pool');
const {
  requireStaffSession,
  sameOriginGuard,
  csrfGuard,
} = require('../middleware/staffBrowserSession');
const { createCalendarAppointmentEndTimeService } = require('../services/calendarAppointmentEndTime');
const { calendarOperationalMutationsClientScript } = require('../presentation/calendarOperationalMutationsUx');
const { calendarManageAppointmentNotesClientScript } = require('../presentation/calendarAppointmentNotesUx');
const { calendarAppointmentEndTimeClientScript } = require('../presentation/calendarAppointmentEndTimeUx');

function statusForEndTimeError(error) {
  if (Number.isInteger(error?.httpStatus)) return error.httpStatus;
  const code = String(error?.code || '');
  if (code.includes('FORBIDDEN')) return 403;
  if (code.includes('NOT_FOUND')) return 404;
  if (code.includes('STALE') || code.includes('CONFLICT') || code.includes('AMBIGUOUS') || code.includes('FINAL')) return 409;
  if (code.startsWith('CALENDAR_END_TIME_')) return 400;
  return 503;
}

function setHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function sendError(error, req, res, next) {
  const status = statusForEndTimeError(error);
  if (status === 503) return next(error);
  return res.status(status).json({
    error: error.message,
    code: error.code,
    details: error.details || undefined,
    requestId: req.id,
  });
}

function createCalendarAppointmentEndTimeRouter({
  env = process.env,
  sessionService,
  service = createCalendarAppointmentEndTimeService({ db: pool }),
  renderOperationalClient = calendarOperationalMutationsClientScript,
  renderNotesClient = calendarManageAppointmentNotesClientScript,
  renderEndTimeClient = calendarAppointmentEndTimeClientScript,
} = {}) {
  if (!sessionService) throw new Error('Appointment end-time routes require the staff session service.');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });

  router.use((_req, res, next) => {
    setHeaders(res);
    return next();
  });

  // This route is intentionally mounted before the broader operational router.
  // Operators with appointment:adjust_end receive the existing operational client
  // plus the bounded end-time enhancer. Operators without it fall through to the
  // existing /operations/client.js authority unchanged.
  router.get('/client.js', requireSession, async (req, res, next) => {
    try {
      await service.resolveOperator(req.staffBrowserSession.adminId);
      return res.status(200).type('application/javascript').send(
        `${renderOperationalClient()}\n${renderNotesClient()}\n${renderEndTimeClient()}`
      );
    } catch (error) {
      if (String(error?.code || '') === 'CALENDAR_END_TIME_FORBIDDEN') return next();
      return sendError(error, req, res, next);
    }
  });

  router.get('/appointments/:appointmentId/end-time', requireSession, async (req, res, next) => {
    try {
      return res.status(200).json(await service.get({
        adminId: req.staffBrowserSession.adminId,
        appointmentId: req.params.appointmentId,
      }));
    } catch (error) {
      return sendError(error, req, res, next);
    }
  });

  router.post('/appointments/:appointmentId/end-time', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      return res.status(200).json(await service.adjust({
        adminId: req.staffBrowserSession.adminId,
        appointmentId: req.params.appointmentId,
        expectedRevision: req.body?.expectedRevision,
        endsAt: req.body?.endsAt,
        requestId: req.body?.requestId,
      }));
    } catch (error) {
      return sendError(error, req, res, next);
    }
  });

  return router;
}

module.exports = {
  createCalendarAppointmentEndTimeRouter,
  statusForEndTimeError,
};
