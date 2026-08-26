const express = require('express');
const { pool } = require('../db/pool');
const { createCalendarCreateBookingService } = require('../services/calendarCreateBooking');
const { isEmergencyCalendarBookingEnabled } = require('../services/emergencyCalendarBootstrap');
const {
  requireStaffSession,
  sameOriginGuard,
  csrfGuard,
} = require('../middleware/staffBrowserSession');
const {
  renderCalendarCreateBookingPage,
  calendarCreateBookingClientScript,
} = require('../presentation/calendarCreateBookingUx');

function setBookingSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function statusForError(error) {
  if (error?.code === 'CALENDAR_BOOKING_DISABLED') return 404;
  if (error?.code === 'CALENDAR_BOOKING_FORBIDDEN') return 403;
  if (error?.code === 'CALENDAR_BOOKING_NEW_CLIENT_AMBIGUOUS') return 409;
  if (String(error?.code || '').startsWith('CALENDAR_BOOKING_NEW_CLIENT_INVALID_')) return 400;
  if (String(error?.code || '').startsWith('CALENDAR_BOOKING_INVALID_') || error?.code === 'CALENDAR_BOOKING_CLIENT_REQUIRED') return 400;
  if (error?.code === 'CALENDAR_BOOKING_INELIGIBLE_SELECTION') return 409;
  return 503;
}

function customerConfirmationState(result) {
  const delivery = result?.customerConfirmation || {};
  if (delivery.sent === true || delivery.deliveryStatus === 'sent') {
    return { status: 'sent', sent: true, retryable: false, reason: null };
  }
  const reason = String(delivery.reason || result?.customerConfirmationObligation?.reason || 'confirmation_not_sent');
  if (delivery.deliveryStatus === 'uncertain' || reason === 'delivery_state_uncertain') {
    return { status: 'delivery_status_uncertain', sent: false, retryable: false, reason: 'delivery_state_uncertain' };
  }
  const manualAction = ['client_contact_not_found', 'client_name_authority_not_found', 'canonical_client_inactive'].includes(reason);
  return {
    status: manualAction ? 'manual_action_required' : 'retry_pending',
    sent: false,
    retryable: manualAction ? true : delivery.retryable !== false,
    reason,
  };
}

function createCalendarCreateBookingRouter({
  env = process.env,
  sessionService,
  bookingService = createCalendarCreateBookingService({ db: pool, env }),
  renderPage = renderCalendarCreateBookingPage,
  renderClient = calendarCreateBookingClientScript,
} = {}) {
  if (!sessionService) throw new Error('Calendar Create Booking staff session service is required');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });

  router.use((req, res, next) => {
    setBookingSecurityHeaders(res);
    if (!isEmergencyCalendarBookingEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    return next();
  });

  router.get('/', requireSession, async (req, res, next) => {
    try {
      const options = await bookingService.listBookableOptions(req.staffBrowserSession.adminId);
      const rawDate = String(req.query?.date || '').trim();
      const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
      return res.status(200).type('html').send(renderPage({
        options,
        date,
        clientScriptPath: `${req.baseUrl || '/calendar/book'}/client.js`,
      }));
    } catch (error) {
      if (statusForError(error) !== 503) return res.status(statusForError(error)).type('text/plain').send('Calendar booking unavailable');
      return next(error);
    }
  });

  router.get('/client.js', requireSession, async (req, res, next) => {
    try {
      await bookingService.resolveOperator(req.staffBrowserSession.adminId);
      return res.status(200).type('application/javascript').send(renderClient());
    } catch (error) {
      if (statusForError(error) !== 503) return res.status(statusForError(error)).type('text/plain').send('Not Found');
      return next(error);
    }
  });

  router.post('/client-search', sameOrigin, requireSession, async (req, res, next) => {
    try {
      const result = await bookingService.searchClients(req.staffBrowserSession.adminId, req.body?.query);
      return res.status(200).json(result);
    } catch (error) {
      const status = statusForError(error);
      if (status !== 503) return res.status(status).json({ error: 'Client search is not authorized', requestId: req.id });
      return next(error);
    }
  });

  router.post('/prepare', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await bookingService.prepare({
        adminId: req.staffBrowserSession.adminId,
        clientId: req.body?.clientId,
        newClient: req.body?.newClient,
        staffId: req.body?.staffId,
        serviceId: req.body?.serviceId,
        date: req.body?.date,
        time: req.body?.time,
      });
      if (result.status !== 'pending_confirmation') {
        return res.status(409).json({ status: result.status, reply: result.reply || 'Booking cannot be prepared.' });
      }
      return res.status(200).json(result);
    } catch (error) {
      const status = statusForError(error);
      if (status !== 503) return res.status(status).json({ error: error.message, code: error.code, requestId: req.id });
      return next(error);
    }
  });

  router.post('/discard', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await bookingService.discard({ adminId: req.staffBrowserSession.adminId });
      return res.status(200).json(result);
    } catch (error) {
      const status = statusForError(error);
      if (status !== 503) return res.status(status).json({ error: error.message, code: error.code, requestId: req.id });
      return next(error);
    }
  });

  router.post('/confirm', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await bookingService.confirm({ adminId: req.staffBrowserSession.adminId });
      if (result.status !== 'created') {
        return res.status(409).json({ status: result.status, reply: result.reply || 'Booking was not created.' });
      }
      return res.status(201).json({
        status: 'created',
        appointmentId: result.appointmentId,
        customerConfirmation: customerConfirmationState(result),
      });
    } catch (error) {
      const status = statusForError(error);
      if (status !== 503) return res.status(status).json({ error: error.message, code: error.code, requestId: req.id });
      return next(error);
    }
  });

  return router;
}

module.exports = {
  createCalendarCreateBookingRouter,
  setBookingSecurityHeaders,
  statusForError,
  customerConfirmationState,
};
