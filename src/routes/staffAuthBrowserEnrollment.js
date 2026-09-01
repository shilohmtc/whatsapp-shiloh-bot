const express = require('express');
const { pool } = require('../db/pool');
const { createStaffBrowserSessionService } = require('../services/staffBrowserSession');
const { createProviderIndependentStaffAuthService } = require('../services/providerIndependentStaffAuth');
const { createStaffAuthBrowserEnrollmentService } = require('../services/staffAuthBrowserEnrollment');
const {
  sameOriginGuard,
  requestFingerprintHash,
  requireStaffSession,
  csrfGuard,
} = require('../middleware/staffBrowserSession');
const {
  renderStaffAuthBrowserEnrollmentPage,
  staffAuthBrowserEnrollmentClientScript,
} = require('../presentation/staffAuthBrowserEnrollmentUx');

function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function resultError(res, result, requestId) {
  setSecurityHeaders(res);
  if (result.code === 'STAFF_TOTP_DISABLED') return res.status(404).json({ error: 'Not Found', requestId });
  if (result.code === 'STAFF_TOTP_UNAVAILABLE') return res.status(503).json({ error: 'Staff authentication is temporarily unavailable', requestId });
  if (result.code === 'STAFF_RECENT_AUTH_REQUIRED') return res.status(428).json({ error: 'Sign in again before creating an enrollment link.', requestId });
  if (result.code === 'STAFF_RESET_FORBIDDEN') return res.status(403).json({ error: 'Your authenticated Shiloh access does not permit staff authenticator enrollment.', requestId });
  return res.status(404).json({ error: 'That active staff-auth account is not available for enrollment.', requestId });
}

function createStaffAuthBrowserEnrollmentRouter({
  env = process.env,
  sessionService = createStaffBrowserSessionService({ db: pool }),
  providerAuthService = createProviderIndependentStaffAuthService({ db: pool, env }),
  enrollmentService = createStaffAuthBrowserEnrollmentService({ db: pool, env }),
  renderPage = renderStaffAuthBrowserEnrollmentPage,
  renderClient = staffAuthBrowserEnrollmentClientScript,
} = {}) {
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });

  async function requireResetCapability(req, res, next) {
    try {
      const status = await providerAuthService.credentialStatus(req.staffBrowserSession.adminId);
      if (!status.available || status.canResetOther !== true) {
        setSecurityHeaders(res);
        return res.status(403).type('text/plain').send('Forbidden');
      }
      return next();
    } catch (error) {
      return next(error);
    }
  }

  router.get('/', requireSession, requireResetCapability, (req, res) => {
    setSecurityHeaders(res);
    const basePath = req.baseUrl || '/calendar/staff-auth/admin-enrollment';
    return res.status(200).type('html').send(renderPage({ clientScriptPath: `${basePath}/client.js` }));
  });

  router.get('/client.js', requireSession, requireResetCapability, (_req, res) => {
    setSecurityHeaders(res);
    return res.status(200).type('application/javascript').send(renderClient());
  });

  router.post('/issue', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await enrollmentService.issue({
        session: req.staffBrowserSession,
        staffNumber: req.body?.staffNumber,
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok) return resultError(res, result, req.id);
      setSecurityHeaders(res);
      return res.status(201).json({
        ok: true,
        url: result.url,
        expiresAt: result.expiresAt,
        subject: result.subject,
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = {
  createStaffAuthBrowserEnrollmentRouter,
  setSecurityHeaders,
  resultError,
};
