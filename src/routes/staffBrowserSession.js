const express = require('express');
const { pool } = require('../db/pool');
const { createStaffBrowserSessionService } = require('../services/staffBrowserSession');
const {
  sameOriginGuard,
  requestFingerprintHash,
  requireStaffSession,
  csrfGuard,
  serializeSessionCookie,
  serializeExpiredSessionCookie,
} = require('../middleware/staffBrowserSession');

function createStaffBrowserSessionRouter({
  env = process.env,
  service = createStaffBrowserSessionService({ db: pool, challengeDispatcher: null }),
} = {}) {
  const router = express.Router();
  const sameOrigin = sameOriginGuard({ env });
  const requireSession = requireStaffSession({ service, env });
  const requireCsrf = csrfGuard({ service });

  router.post('/challenge', sameOrigin, async (req, res, next) => {
    try {
      const result = await service.beginChallenge({
        whatsapp: req.body?.whatsapp,
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok && result.code === 'STAFF_AUTH_DELIVERY_DISABLED') {
        return res.status(503).json({ error: 'Staff sign-in delivery is not enabled', requestId: req.id });
      }
      if (!result.ok) {
        return res.status(503).json({ error: 'Staff sign-in is temporarily unavailable', requestId: req.id });
      }
      return res.status(202).json({
        accepted: true,
        message: 'If this staff account is eligible, a one-time sign-in challenge will be delivered.',
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/verify', sameOrigin, async (req, res, next) => {
    try {
      const result = await service.verifyChallenge({
        whatsapp: req.body?.whatsapp,
        code: req.body?.code,
        requestFingerprintHash: requestFingerprintHash(req),
      });
      if (!result.ok) return res.status(401).json({ error: 'Invalid or expired sign-in challenge', requestId: req.id });
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Set-Cookie', serializeSessionCookie(result.sessionToken, {
        env,
        maxAgeSeconds: Math.max(1, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)),
      }));
      return res.status(200).json({
        authenticated: true,
        csrfToken: result.csrfToken,
        viewer: result.viewer || null,
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/session', requireSession, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      authenticated: true,
      viewer: req.staffBrowserSession.viewer || null,
    });
  });

  router.post('/csrf', sameOrigin, requireSession, async (req, res, next) => {
    try {
      const rotated = await service.rotateCsrfToken(req.staffBrowserSession.sessionId);
      if (!rotated.ok) return res.status(401).json({ error: 'Unauthorized', requestId: req.id });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ csrfToken: rotated.csrfToken });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/logout', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      await service.revokeSession(req.staffBrowserSession.sessionId, 'logout');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Set-Cookie', serializeExpiredSessionCookie({ env }));
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createStaffBrowserSessionRouter };
