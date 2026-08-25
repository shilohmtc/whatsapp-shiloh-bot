const express = require('express');
const {
  renderStaffCalendarAccessPage,
  staffCalendarAccessClientScript,
} = require('../presentation/staffCalendarAccessUx');
const { emergencyCalendarBootstrapClientScript } = require('../presentation/emergencyCalendarBootstrapUx');
const { isEmergencyCalendarBookingEnabled } = require('../services/emergencyCalendarBootstrap');
const { providerIndependentAuthPolicy } = require('../services/providerIndependentStaffAuth');

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

function decorateEmergencyAccessPage(html, scriptPath) {
  return String(html)
    .replace('</head>', `<script src="${scriptPath}" defer></script></head>`)
    .replace('Read-only</span>', 'Secure</span>')
    .replace('continue to the read-only Shiloh Calendar.', 'continue to Shiloh Calendar.')
    .replace('This access journey can open only the existing read-only Calendar under server-derived staff/Admin scope. It cannot create, move, cancel, reassign, block, or otherwise mutate scheduling.', 'This secure journey uses server-derived staff/Admin authority. The separately authorized Christel emergency path may create new bookings only through Shiloh\'s guarded canonical booking owner; it cannot move, cancel, drag/drop, reassign, block, change leave, or change schedules.');
}

function createStaffCalendarAccessPageHandler({
  env = process.env,
  renderPage = renderStaffCalendarAccessPage,
} = {}) {
  return function staffCalendarAccessPage(req, res) {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    const basePath = req.baseUrl || '/calendar/staff';
    let html = renderPage({
      reason: normalizeReason(req.query?.reason),
      clientScriptPath: `${basePath}/client.js`,
      providerIndependentAuthEnabled: providerIndependentAuthPolicy(env).operational,
    });
    if (isEmergencyCalendarBookingEnabled(env)) {
      html = decorateEmergencyAccessPage(html, `${basePath}/emergency-bootstrap.js`);
    }
    return res.status(200).type('html').send(html);
  };
}

function createStaffCalendarAccessClientHandler({
  env = process.env,
  renderClient = staffCalendarAccessClientScript,
} = {}) {
  return function staffCalendarAccessClient(_req, res) {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    return res.status(200).type('application/javascript').send(renderClient());
  };
}

function createEmergencyBootstrapClientHandler({
  env = process.env,
  renderClient = emergencyCalendarBootstrapClientScript,
} = {}) {
  return function emergencyBootstrapClient(_req, res) {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env) || !isEmergencyCalendarBookingEnabled(env)) {
      return res.status(404).type('text/plain').send('Not Found');
    }
    return res.status(200).type('application/javascript').send(renderClient());
  };
}

function createStaffCalendarAccessRouter(options = {}) {
  const router = express.Router();
  router.get('/', createStaffCalendarAccessPageHandler(options));
  router.get('/client.js', createStaffCalendarAccessClientHandler(options));
  router.get('/emergency-bootstrap.js', createEmergencyBootstrapClientHandler(options));
  return router;
}

module.exports = createStaffCalendarAccessRouter();
module.exports.createStaffCalendarAccessRouter = createStaffCalendarAccessRouter;
module.exports.createStaffCalendarAccessPageHandler = createStaffCalendarAccessPageHandler;
module.exports.createStaffCalendarAccessClientHandler = createStaffCalendarAccessClientHandler;
module.exports.createEmergencyBootstrapClientHandler = createEmergencyBootstrapClientHandler;
module.exports.isStaffCalendarAccessUxEnabled = isStaffCalendarAccessUxEnabled;
module.exports.setAccessSecurityHeaders = setAccessSecurityHeaders;
module.exports.normalizeReason = normalizeReason;
module.exports.decorateEmergencyAccessPage = decorateEmergencyAccessPage;
