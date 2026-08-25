const express = require('express');
const { pool } = require('../db/pool');
const { createCalendarOperationalService } = require('../services/calendarOperationalMutations');
const { requireCalendarCapability } = require('../services/calendarAccess');
const { requireStaffSession, sameOriginGuard, csrfGuard } = require('../middleware/staffBrowserSession');
const { renderNewBookingPage, renderAppointmentPage, clientScript } = require('../presentation/calendarOperationalUx');

function setHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function statusForError(error) {
  if (error?.code === 'CALENDAR_ACCESS_FORBIDDEN') return 403;
  if (error?.code === 'CALENDAR_APPOINTMENT_NOT_FOUND') return 404;
  if (error?.code === 'CALENDAR_CONFLICT' || error?.code === 'CALENDAR_IDEMPOTENCY_KEY_REUSED' || error?.code === 'CALENDAR_MUTATION_IN_PROGRESS') return 409;
  if (String(error?.code || '').startsWith('CALENDAR_')) return 400;
  return 503;
}

function idempotencyKey(req) {
  return String(req.get('x-shiloh-idempotency-key') || '');
}

function createCalendarOperationalRouter({
  env = process.env,
  sessionService,
  service = createCalendarOperationalService({ db: pool, env }),
} = {}) {
  if (!sessionService) throw new Error('Calendar operational staff session service is required');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });
  const canRead = requireCalendarCapability('calendar:read', { db: pool });
  const canCreate = requireCalendarCapability('calendar:create', { db: pool });
  const canEdit = requireCalendarCapability('calendar:edit', { db: pool });
  const canReschedule = requireCalendarCapability('calendar:reschedule', { db: pool });
  const canCancel = requireCalendarCapability('calendar:cancel', { db: pool });
  const canRetry = requireCalendarCapability('calendar:sync_retry', { db: pool });

  router.use((req, res, next) => { setHeaders(res); next(); });

  router.get('/client.js', requireSession, canRead, (req, res) => res.status(200).type('application/javascript').send(clientScript()));
  router.get('/', requireSession, canRead, (req, res) => res.redirect(302, '/calendar/operations/new'));
  router.get('/new', requireSession, canCreate, (req, res) => {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query?.date || '')) ? String(req.query.date) : '';
    return res.status(200).type('html').send(renderNewBookingPage({ operator: req.calendarOperator, date }));
  });
  router.get('/options', requireSession, canCreate, async (req, res, next) => {
    try { return res.status(200).json(await service.listBookableOptions(req.staffBrowserSession.adminId)); } catch (error) { return next(error); }
  });
  router.get('/appointments/:appointmentId', requireSession, canEdit, async (req, res, next) => {
    try {
      const result = await service.getAppointment(req.staffBrowserSession.adminId, req.params.appointmentId);
      return res.status(200).type('html').send(renderAppointmentPage(result));
    } catch (error) { return next(error); }
  });

  router.post('/client-search', sameOrigin, requireSession, canCreate, async (req, res, next) => {
    try { return res.status(200).json(await service.searchClients(req.staffBrowserSession.adminId, req.body?.query)); } catch (error) { return next(error); }
  });
  router.post('/preview', sameOrigin, requireSession, canCreate, async (req, res, next) => {
    try { return res.status(200).json(await service.previewCreate({ adminId: req.staffBrowserSession.adminId, ...req.body })); } catch (error) { return next(error); }
  });
  router.post('/appointments', sameOrigin, requireSession, requireCsrf, canCreate, async (req, res, next) => {
    try {
      const result = await service.createAppointment({ adminId: req.staffBrowserSession.adminId, ...req.body, idempotencyKey: idempotencyKey(req) });
      return res.status(result.idempotentReplay ? 200 : 201).json(result);
    } catch (error) { return next(error); }
  });
  router.post('/appointments/:appointmentId/edit', sameOrigin, requireSession, requireCsrf, canEdit, async (req, res, next) => {
    try { return res.status(200).json(await service.editAppointment({ adminId: req.staffBrowserSession.adminId, appointmentId: req.params.appointmentId, ...req.body, idempotencyKey: idempotencyKey(req) })); } catch (error) { return next(error); }
  });
  router.post('/appointments/:appointmentId/reschedule', sameOrigin, requireSession, requireCsrf, canReschedule, async (req, res, next) => {
    try { return res.status(200).json(await service.rescheduleAppointment({ adminId: req.staffBrowserSession.adminId, appointmentId: req.params.appointmentId, ...req.body, idempotencyKey: idempotencyKey(req) })); } catch (error) { return next(error); }
  });
  router.post('/appointments/:appointmentId/cancel', sameOrigin, requireSession, requireCsrf, canCancel, async (req, res, next) => {
    try { return res.status(200).json(await service.cancelAppointment({ adminId: req.staffBrowserSession.adminId, appointmentId: req.params.appointmentId, ...req.body, idempotencyKey: idempotencyKey(req) })); } catch (error) { return next(error); }
  });
  router.post('/sync/retry', sameOrigin, requireSession, requireCsrf, canRetry, async (req, res, next) => {
    try { return res.status(200).json(await service.retryProviderSync({ adminId: req.staffBrowserSession.adminId, appointmentId: req.body?.appointmentId, idempotencyKey: idempotencyKey(req) })); } catch (error) { return next(error); }
  });

  router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = statusForError(error);
    if (status === 503) return next(error);
    return res.status(status).json({ error: error.message, code: error.code, requestId: req.id });
  });
  return router;
}

module.exports = { createCalendarOperationalRouter, setHeaders, statusForError, idempotencyKey };
