const express = require('express');
const {
  renderStaffCalendarAccessPage,
  staffCalendarAccessClientScript,
} = require('../presentation/staffCalendarAccessUx');

function isStaffCalendarAccessUxEnabled(env = process.env) {
  const calendarEnabled = String(env.SHILOH_CALENDAR_READONLY_UX_ENABLED || '').trim().toLowerCase() === 'true';
  const bridgeEnabled = String(env.SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED || '').trim().toLowerCase() === 'true';
  return calendarEnabled && bridgeEnabled;
}

function setAccessSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function normalizeReason(value) {
  const reason = String(value || '').trim().toLowerCase();
  return reason === 'logout' || reason === 'session' ? reason : null;
}

function createStaffCalendarAccessRouter({
  env = process.env,
  renderPage = renderStaffCalendarAccessPage,
  renderClient = staffCalendarAccessClientScript,
} = {}) {
  const router = express.Router();

  router.get('/', (req, res) => {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    return res.status(200).type('html').send(renderPage({
      reason: normalizeReason(req.query?.reason),
      clientScriptPath: `${req.baseUrl || '/calendar/staff'}/client.js`,
    }));
  });

  router.get('/client.js', (req, res) => {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    return res.status(200).type('application/javascript').send(renderClient());
  });

  return router;
}

module.exports = createStaffCalendarAccessRouter();
module.exports.createStaffCalendarAccessRouter = createStaffCalendarAccessRouter;
module.exports.isStaffCalendarAccessUxEnabled = isStaffCalendarAccessUxEnabled;
module.exports.setAccessSecurityHeaders = setAccessSecurityHeaders;
module.exports.normalizeReason = normalizeReason;
