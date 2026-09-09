const express = require('express');
const { pool } = require('../db/pool');
const { createStaffBrowserSessionService } = require('../services/staffBrowserSession');
const { createStaffPasskeyAuthService } = require('../services/staffPasskeyAuth');
const { managePage, manageScript } = require('../presentation/staffPasskeyUx');
const {
  sameOriginGuard,
  requestFingerprintHash,
  requireStaffSession,
  csrfGuard,
  serializeSessionCookie,
} = require('../middleware/staffBrowserSession');

function createStaffPasskeyAuthRouter({
  env = process.env,
  sessionService = createStaffBrowserSessionService({ db: pool }),
  passkeyService = createStaffPasskeyAuthService({ db: pool, env }),
} = {}) {
  const router = express.Router();
  const sameOrigin = sameOriginGuard({ env });
  const requireSession = requireStaffSession({ service: sessionService, env, allowRecoveryRequired: true });
  const requireCsrf = csrfGuard({ service: sessionService });
  function noStore(res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Referrer-Policy', 'no-referrer');
  }
  function secure(res) {
    noStore(res);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  }
  function error(res, result, fallback = 'Passkey request could not be verified') {
    noStore(res);
    if (result.code === 'STAFF_PASSKEY_DISABLED') return res.status(404).json({ error: 'Not Found', requestId: res.req?.id });
    if (result.code === 'STAFF_PASSKEY_UNAVAILABLE') return res.status(503).json({ error: 'Passkey authentication is temporarily unavailable', requestId: res.req?.id });
    if (result.code === 'STAFF_RECENT_STRONG_AUTH_REQUIRED') return res.status(428).json({ error: 'Recent strong authentication required', requestId: res.req?.id });
    if (result.code === 'STAFF_AUTH_FORBIDDEN') return res.status(403).json({ error: 'Forbidden', requestId: res.req?.id });
    if (result.code === 'STAFF_PASSKEY_NOT_FOUND') return res.status(404).json({ error: 'Not Found', requestId: res.req?.id });
    return res.status(401).json({ error: fallback, requestId: res.req?.id });
  }
  function sendSession(res, result) {
    noStore(res);
    res.setHeader('Set-Cookie', serializeSessionCookie(result.sessionToken, {
      env, maxAgeSeconds: Math.max(1, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)),
    }));
    return res.status(200).json({ authenticated: true, csrfToken: result.csrfToken, viewer: result.viewer || null, recoveryRequired: false });
  }

  router.post('/authentication/options', sameOrigin, async (req, res, next) => {
    try {
      const result = await passkeyService.beginAuthentication({
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok) return error(res, result);
      noStore(res);
      return res.status(200).json({ options: result.options, expiresAt: result.expiresAt });
    } catch (e) { return next(e); }
  });
  router.post('/authentication/finish', sameOrigin, async (req, res, next) => {
    try {
      const result = await passkeyService.finishAuthentication({
        response: req.body?.response,
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok) return error(res, result);
      return sendSession(res, result);
    } catch (e) { return next(e); }
  });
  router.get('/manage', requireSession, async (req, res, next) => {
    try {
      const result = await passkeyService.listCredentials({ session: req.staffBrowserSession });
      if (!result.ok) return error(res, result);
      secure(res);
      return res.status(200).type('html').send(managePage());
    } catch (e) { return next(e); }
  });
  router.get('/manage.js', requireSession, async (req, res, next) => {
    try {
      const result = await passkeyService.listCredentials({ session: req.staffBrowserSession });
      if (!result.ok) return error(res, result);
      secure(res);
      return res.status(200).type('application/javascript').send(manageScript());
    } catch (e) { return next(e); }
  });
  router.get('/', requireSession, async (req, res, next) => {
    try {
      const result = await passkeyService.listCredentials({ session: req.staffBrowserSession });
      if (!result.ok) return error(res, result);
      noStore(res);
      return res.status(200).json({ credentials: result.credentials });
    } catch (e) { return next(e); }
  });
  router.post('/registration/options', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await passkeyService.beginRegistration({
        session: req.staffBrowserSession,
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok) return error(res, result);
      noStore(res);
      return res.status(200).json({ options: result.options, expiresAt: result.expiresAt });
    } catch (e) { return next(e); }
  });
  router.post('/registration/finish', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await passkeyService.finishRegistration({
        session: req.staffBrowserSession,
        response: req.body?.response,
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok) return error(res, result);
      noStore(res);
      return res.status(201).json({ ok: true, credentialId: result.credentialId });
    } catch (e) { return next(e); }
  });
  router.post('/:credentialId/revoke', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await passkeyService.revokeCredential({
        session: req.staffBrowserSession,
        credentialId: req.params.credentialId,
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok) return error(res, result);
      noStore(res);
      return res.status(204).send();
    } catch (e) { return next(e); }
  });
  return router;
}
module.exports = { createStaffPasskeyAuthRouter };
