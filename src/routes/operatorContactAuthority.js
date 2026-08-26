const express = require('express');
const { pool } = require('../db/pool');
const {
  requireStaffSession,
  sameOriginGuard,
  csrfGuard,
} = require('../middleware/staffBrowserSession');
const { createOperatorContactAuthorityService } = require('../services/operatorContactAuthority');
const {
  renderOperatorContactAuthorityPage,
  operatorContactAuthorityClientScript,
} = require('../presentation/operatorContactAuthorityUx');

function setAuthoritySecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function statusForAuthorityError(error) {
  const code = String(error?.code || '');
  if (code === 'OPERATOR_AUTHORITY_UNAUTHORIZED') return 401;
  if (code === 'OPERATOR_AUTHORITY_FORBIDDEN') return 403;
  if (code.endsWith('_NOT_FOUND')) return 404;
  if (
    code.endsWith('_MISMATCH')
    || code.endsWith('_AMBIGUOUS')
    || code.endsWith('_INACTIVE')
    || code.endsWith('_NOT_VERIFIED')
    || code === '40001'
  ) return 409;
  if (code.startsWith('OPERATOR_AUTHORITY_') || code.startsWith('CLIENT_FACING_NAME_')) return 400;
  return 503;
}

function createOperatorContactAuthorityRouter({
  env = process.env,
  sessionService,
  authorityService = createOperatorContactAuthorityService({ db: pool }),
  renderPage = renderOperatorContactAuthorityPage,
  renderClient = operatorContactAuthorityClientScript,
} = {}) {
  if (!sessionService) throw new Error('Operator contact authority staff session service is required');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });

  router.use((req, res, next) => {
    setAuthoritySecurityHeaders(res);
    return next();
  });

  function controlledFailure(error, req, res, next) {
    const status = statusForAuthorityError(error);
    if (status === 503) return next(error);
    return res.status(status).json({
      error: error.message,
      code: error.code,
      requestId: req.id,
    });
  }

  router.get('/', requireSession, async (req, res, next) => {
    try {
      await authorityService.resolveAuthorizedOperator(req.staffBrowserSession.adminId);
      return res.status(200).type('html').send(renderPage({
        clientScriptPath: `${req.baseUrl || '/calendar/client-authority'}/client.js`,
      }));
    } catch (error) {
      const status = statusForAuthorityError(error);
      if (status === 503) return next(error);
      return res.status(status).type('text/plain').send('Client authority is not available for this staff account.');
    }
  });

  router.get('/client.js', requireSession, async (req, res, next) => {
    try {
      await authorityService.resolveAuthorizedOperator(req.staffBrowserSession.adminId);
      return res.status(200).type('application/javascript').send(renderClient());
    } catch (error) {
      const status = statusForAuthorityError(error);
      if (status === 503) return next(error);
      return res.status(status).type('text/plain').send('Not Found');
    }
  });

  router.post('/search', sameOrigin, requireSession, async (req, res, next) => {
    try {
      const result = await authorityService.searchClients({
        actorAdminId: req.staffBrowserSession.adminId,
        query: req.body?.query,
      });
      return res.status(200).json(result);
    } catch (error) {
      return controlledFailure(error, req, res, next);
    }
  });

  router.post('/state', sameOrigin, requireSession, async (req, res, next) => {
    try {
      const result = await authorityService.loadClientAuthorityState({
        actorAdminId: req.staffBrowserSession.adminId,
        clientId: req.body?.clientId,
      });
      return res.status(200).json(result);
    } catch (error) {
      return controlledFailure(error, req, res, next);
    }
  });

  router.post('/contact-confirm', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await authorityService.confirmContact({
        actorAdminId: req.staffBrowserSession.adminId,
        clientId: req.body?.clientId,
        contactId: req.body?.contactId,
        confirmedValue: req.body?.confirmedValue,
      });
      return res.status(200).json(result);
    } catch (error) {
      return controlledFailure(error, req, res, next);
    }
  });

  router.post('/name-confirm', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await authorityService.confirmName({
        actorAdminId: req.staffBrowserSession.adminId,
        clientId: req.body?.clientId,
        contactId: req.body?.contactId,
        expectedContactValue: req.body?.expectedContactValue,
        confirmedName: req.body?.confirmedName,
        explicitlyConfirmed: req.body?.explicitlyConfirmed === true,
      });
      return res.status(200).json(result);
    } catch (error) {
      return controlledFailure(error, req, res, next);
    }
  });

  return router;
}

module.exports = {
  setAuthoritySecurityHeaders,
  statusForAuthorityError,
  createOperatorContactAuthorityRouter,
};
