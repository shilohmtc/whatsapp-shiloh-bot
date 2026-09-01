const express = require('express');
const {
  renderStaffCalendarAccessPage,
  staffCalendarAccessClientScript,
} = require('../presentation/staffCalendarAccessUx');
const {
  renderStaffCalendarHandoffPage,
  staffCalendarHandoffClientScript,
} = require('../presentation/staffCalendarHandoffUx');
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

function withAuthenticatorSetupGuidance(html) {
  const marker = '<section class="section" data-shiloh-whatsapp-handoff-guidance>';
  if (!String(html || '').includes(marker)) return html;
  const guidance = `<section class="section" data-shiloh-authenticator-setup-guidance><span class="eyebrow">First-time setup / new phone</span><h2>Need to enroll an authenticator?</h2><p class="lead">Ask an authorized Shiloh staff-auth administrator for a private one-time enrollment link. The link expires after five minutes, works once, and does not use WhatsApp or Meta.</p><div class="actions"><a class="button secondary" href="/calendar/staff-auth/admin-enrollment">Staff-auth administrators: create enrollment link</a></div></section>`;
  return String(html).replace(marker, `${guidance}${marker}`);
}

function createStaffCalendarAccessPageHandler({
  env = process.env,
  renderPage = renderStaffCalendarAccessPage,
} = {}) {
  return function staffCalendarAccessPage(req, res) {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    const basePath = req.baseUrl || '/calendar/staff';
    const providerIndependentAuthEnabled = providerIndependentAuthPolicy(env).operational;
    let html = renderPage({
      reason: normalizeReason(req.query?.reason),
      clientScriptPath: `${basePath}/client.js`,
      providerIndependentAuthEnabled,
    });
    if (providerIndependentAuthEnabled) html = withAuthenticatorSetupGuidance(html);
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

function createStaffCalendarHandoffPageHandler({
  env = process.env,
  renderPage = renderStaffCalendarHandoffPage,
} = {}) {
  return function staffCalendarHandoffPage(_req, res) {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    return res.status(200).type('html').send(renderPage());
  };
}

function createStaffCalendarHandoffClientHandler({
  env = process.env,
  renderClient = staffCalendarHandoffClientScript,
} = {}) {
  return function staffCalendarHandoffClient(_req, res) {
    setAccessSecurityHeaders(res);
    if (!isStaffCalendarAccessUxEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    return res.status(200).type('application/javascript').send(renderClient());
  };
}

function createStaffCalendarAccessRouter(options = {}) {
  const router = express.Router();
  router.get('/', createStaffCalendarAccessPageHandler(options));
  router.get('/client.js', createStaffCalendarAccessClientHandler(options));
  router.get('/handoff', createStaffCalendarHandoffPageHandler(options));
  router.get('/handoff.js', createStaffCalendarHandoffClientHandler(options));
  return router;
}

module.exports = createStaffCalendarAccessRouter();
module.exports.createStaffCalendarAccessRouter = createStaffCalendarAccessRouter;
module.exports.createStaffCalendarAccessPageHandler = createStaffCalendarAccessPageHandler;
module.exports.createStaffCalendarAccessClientHandler = createStaffCalendarAccessClientHandler;
module.exports.createStaffCalendarHandoffPageHandler = createStaffCalendarHandoffPageHandler;
module.exports.createStaffCalendarHandoffClientHandler = createStaffCalendarHandoffClientHandler;
module.exports.isStaffCalendarAccessUxEnabled = isStaffCalendarAccessUxEnabled;
module.exports.setAccessSecurityHeaders = setAccessSecurityHeaders;
module.exports.normalizeReason = normalizeReason;
module.exports.withAuthenticatorSetupGuidance = withAuthenticatorSetupGuidance;
