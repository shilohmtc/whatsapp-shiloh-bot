const express = require('express');
const workspaceDashboard = require('../services/workspaceDashboard');
const workspaceNavigation = require('../services/workspaceNavigation');
const {
  renderDashboardPage,
  renderDashboardUnavailablePage,
  dashboardClientScript,
} = require('../presentation/workspaceDashboardUx');
const { workspaceNavigationClientScript } = require('../presentation/workspaceShell');
const {
  requireStaffSession,
  sameOriginGuard,
  csrfGuard,
} = require('../middleware/staffBrowserSession');

function isWorkspaceOperationalEnabled(env = process.env) {
  return String(env.SHILOH_CALENDAR_READONLY_UX_ENABLED || '').trim().toLowerCase() === 'true'
    && String(env.SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED || '').trim().toLowerCase() === 'true';
}

function setWorkspaceOperationalSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function dashboardSafeError(error) {
  if (Number(error?.httpStatus) === 403) return { status: 403, message: 'Your authenticated Shiloh access does not permit the operational Dashboard.' };
  return { status: 503, message: 'Canonical operational Dashboard data is temporarily unavailable.' };
}

function dashboardMutationError(error) {
  const status = [400, 403, 409].includes(Number(error?.httpStatus)) ? Number(error.httpStatus) : 503;
  return {
    status,
    code: String(error?.code || 'WORKSPACE_DASHBOARD_UNAVAILABLE'),
    message: status === 503 ? 'Canonical appointment finalization is temporarily unavailable.' : error.message,
  };
}

function createWorkspaceOperationalRouter({
  env = process.env,
  sessionService,
  dashboardService = workspaceDashboard,
  navigationService = workspaceNavigation,
  renderDashboard = renderDashboardPage,
  renderUnavailable = renderDashboardUnavailablePage,
  staffAccessPath = '/calendar/staff',
} = {}) {
  if (!sessionService) throw new Error('Workspace operational routes require the existing staff browser session service');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });

  router.get('/nav.js', (_req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).type('application/javascript').send(workspaceNavigationClientScript());
  });

  router.use((req, res, next) => {
    setWorkspaceOperationalSecurityHeaders(res);
    if (!isWorkspaceOperationalEnabled(env)) return res.sendStatus(404);
    return next();
  });
  router.use(requireSession);

  router.get('/client.js', (_req, res) => {
    return res.status(200).type('application/javascript').send(dashboardClientScript());
  });

  router.get('/navigation', async (req, res) => {
    try {
      return res.status(200).json(await navigationService.resolve({ session: req.staffBrowserSession }));
    } catch (_error) {
      return res.status(403).json({ error: 'Workspace navigation is unavailable.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const model = await dashboardService.buildModel({
        adminId: req.staffBrowserSession?.adminId,
        viewer: req.staffBrowserSession?.viewer,
      });
      return res.status(200).type('html').send(renderDashboard(model, {
        staffAccessScriptPath: `${staffAccessPath}/client.js`,
      }));
    } catch (error) {
      const safe = dashboardSafeError(error);
      return res.status(safe.status).type('html').send(renderUnavailable({ message: safe.message }));
    }
  });

  router.post('/appointments/:appointmentId/finalize', sameOrigin, requireCsrf, async (req, res) => {
    try {
      const result = await dashboardService.finalizeVisit({
        adminId: req.staffBrowserSession?.adminId,
        viewer: req.staffBrowserSession?.viewer,
        appointmentId: req.params.appointmentId,
        expectedRevision: req.body?.expectedRevision,
        outcome: req.body?.outcome,
      });
      return res.status(200).json(result);
    } catch (error) {
      const safe = dashboardMutationError(error);
      return res.status(safe.status).json({ error: safe.message, code: safe.code, requestId: req.id });
    }
  });

  return router;
}

module.exports = {
  isWorkspaceOperationalEnabled,
  setWorkspaceOperationalSecurityHeaders,
  dashboardSafeError,
  dashboardMutationError,
  createWorkspaceOperationalRouter,
};
