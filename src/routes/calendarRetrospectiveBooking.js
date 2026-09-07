const express = require('express');
const { pool } = require('../db/pool');
const { createCalendarCreateBookingService } = require('../services/calendarCreateBooking');
const { createCalendarRetrospectiveBookingService } = require('../services/calendarRetrospectiveBooking');
const { requireStaffSession, sameOriginGuard, csrfGuard } = require('../middleware/staffBrowserSession');
const {
  renderCalendarRetrospectiveBookingPage,
  calendarRetrospectiveBookingClientScript,
} = require('../presentation/calendarRetrospectiveBookingUx');

function statusForPastError(error) {
  if (Number.isInteger(error?.httpStatus)) return error.httpStatus;
  const code = String(error?.code || '');
  if (code.includes('FORBIDDEN') || code.includes('SCOPE_DENIED')) return 403;
  if (code.includes('UNAVAILABLE') || code.includes('NOT_ENDED') || code.includes('IDEMPOTENCY')) return 409;
  if (code.startsWith('CALENDAR_PAST_')) return 400;
  return 503;
}

function createCalendarRetrospectiveBookingRouter({
  env = process.env,
  sessionService,
  service = createCalendarRetrospectiveBookingService({ db: pool }),
  bookingService = createCalendarCreateBookingService({ db: pool, env }),
  renderPage = renderCalendarRetrospectiveBookingPage,
  renderClient = calendarRetrospectiveBookingClientScript,
} = {}) {
  if (!sessionService) throw new Error('Retrospective booking staff session service is required.');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    return next();
  });
  router.get('/', requireSession, async (req, res, next) => {
    try {
      await service.resolveOperator(req.staffBrowserSession.adminId);
      const options = await bookingService.listBookableOptions(req.staffBrowserSession.adminId);
      return res.status(200).type('html').send(renderPage({ options, clientScriptPath: `${req.baseUrl || '/calendar/book/past'}/client.js` }));
    } catch (error) {
      const status = statusForPastError(error);
      if (status !== 503) return res.status(status).type('text/plain').send('Past appointment recording unavailable');
      return next(error);
    }
  });
  router.get('/client.js', requireSession, async (req, res, next) => {
    try {
      await service.resolveOperator(req.staffBrowserSession.adminId);
      return res.status(200).type('application/javascript').send(renderClient());
    } catch (error) {
      const status = statusForPastError(error);
      if (status !== 503) return res.status(status).type('text/plain').send('Not Found');
      return next(error);
    }
  });
  router.post('/review', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      return res.status(200).json(await service.review({ adminId: req.staffBrowserSession.adminId, ...req.body }));
    } catch (error) {
      const status = statusForPastError(error);
      if (status !== 503) return res.status(status).json({ error: error.message, code: error.code, details: error.details, requestId: req.id });
      return next(error);
    }
  });
  router.post('/record', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await service.record({ adminId: req.staffBrowserSession.adminId, ...req.body });
      return res.status(result.status === 'created' ? 201 : 200).json(result);
    } catch (error) {
      const status = statusForPastError(error);
      if (status !== 503) return res.status(status).json({ error: error.message, code: error.code, details: error.details, requestId: req.id });
      return next(error);
    }
  });
  return router;
}
module.exports={createCalendarRetrospectiveBookingRouter,statusForPastError};
