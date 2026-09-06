const express = require('express');
const workspaceStaff = require('../services/workspaceStaff');
const workspaceStaffAccess = require('../services/workspaceStaffAccess');
const workspaceClients = require('../services/workspaceClients');
const {
  renderStaffListPage,
  renderStaffDetailPage,
  workspaceStaffManageClientScript,
  renderStaffUnavailablePage,
} = require('../presentation/workspaceStaffUx');
const {
  decorateStaffDetailAccessHtml,
  workspaceStaffAccessClientScript,
} = require('../presentation/workspaceStaffAccessUx');
const { requireStaffSession } = require('../middleware/staffBrowserSession');

function isWorkspaceStaffEnabled(env = process.env) {
  return String(env.SHILOH_CALENDAR_READONLY_UX_ENABLED || '').trim().toLowerCase() === 'true'
    && String(env.SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED || '').trim().toLowerCase() === 'true';
}

function setWorkspaceStaffSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function safeError(error) {
  const status = Number(error?.httpStatus) || 503;
  if (status === 400) return { status, message: 'The requested Staff operation is invalid.' };
  if (status === 403) return { status, message: 'Your authenticated Shiloh access does not permit this Staff operation.' };
  if (status === 404) return { status, message: 'That canonical staff member was not found.' };
  if (status === 409) return { status, message: error?.message || 'Canonical Staff changed or is ambiguous. Reload and retry.' };
  return { status: 503, message: 'Canonical Staff is temporarily unavailable.' };
}

function navScript() {
  return `(()=>{const el=document.querySelector('[data-workspace-staff-link]');if(!el)return;fetch('/calendar/team/access',{cache:'no-store',headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)return;const a=document.createElement('a');a.className='workspace-link';a.href='/calendar/team';a.textContent='Staff';el.replaceWith(a);}).catch(()=>{});})();`;
}

async function pageOptions(req, clientAccessService, staffAccessPath) {
  let clientsNavigationAllowed = false;
  try {
    clientsNavigationAllowed = Boolean(await clientAccessService.resolveAccess(req.staffBrowserSession?.adminId));
  } catch (_error) {
    // Staff stays available under its own authority. Client navigation fails closed.
  }
  return {
    staffAccessScriptPath: `${staffAccessPath}/client.js`,
    calendarNavigationAllowed: Boolean(req.staffBrowserSession?.viewer),
    clientsNavigationAllowed,
  };
}

function createWorkspaceStaffListHandler({
  env = process.env,
  service = workspaceStaff,
  clientAccessService = workspaceClients,
  renderPage = renderStaffListPage,
  renderUnavailable = renderStaffUnavailablePage,
  staffAccessPath = '/calendar/staff',
} = {}) {
  return async function workspaceStaffListHandler(req, res) {
    setWorkspaceStaffSecurityHeaders(res);
    if (!isWorkspaceStaffEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    try {
      const model = await service.listStaff({
        adminId: req.staffBrowserSession?.adminId,
        q: req.query?.q,
        status: req.query?.status,
        offset: req.query?.offset,
      });
      return res.status(200).type('html').send(renderPage(model, await pageOptions(req, clientAccessService, staffAccessPath)));
    } catch (error) {
      const safe = safeError(error);
      return res.status(safe.status).type('html').send(renderUnavailable({ code: error?.code, message: safe.message }));
    }
  };
}

function createWorkspaceStaffDetailHandler({
  env = process.env,
  service = workspaceStaff,
  accessService = workspaceStaffAccess,
  clientAccessService = workspaceClients,
  renderPage = renderStaffDetailPage,
  renderUnavailable = renderStaffUnavailablePage,
  staffAccessPath = '/calendar/staff',
} = {}) {
  return async function workspaceStaffDetailHandler(req, res) {
    setWorkspaceStaffSecurityHeaders(res);
    if (!isWorkspaceStaffEnabled(env)) return res.status(404).type('text/plain').send('Not Found');
    try {
      const adminId = req.staffBrowserSession?.adminId;
      const model = await service.getStaffDetail({
        adminId,
        staffId: req.params?.id,
      });
      try {
        model.accessManageAllowed = Boolean(await accessService.resolveManageAccess(adminId));
      } catch (_error) {
        model.accessManageAllowed = false;
      }
      const html = renderPage(model, await pageOptions(req, clientAccessService, staffAccessPath));
      return res.status(200).type('html').send(decorateStaffDetailAccessHtml(html, model));
    } catch (error) {
      const safe = safeError(error);
      return res.status(safe.status).type('html').send(renderUnavailable({ code: error?.code, message: safe.message }));
    }
  };
}

function createWorkspaceStaffRouter({ sessionService, ...options } = {}) {
  if (!sessionService) throw new Error('Workspace Staff requires the existing staff browser session service');
  const service = options.service || workspaceStaff;
  const accessService = options.accessService || workspaceStaffAccess;
  const router = express.Router();
  router.get('/nav.js', (_req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).type('application/javascript').send(navScript());
  });
  router.use(requireStaffSession({ service: sessionService, env: options.env }));
  router.get('/access', async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    if (!isWorkspaceStaffEnabled(options.env || process.env)) return res.sendStatus(404);
    try {
      const authority = await service.resolveAccess(req.staffBrowserSession?.adminId);
      return authority ? res.sendStatus(204) : res.sendStatus(403);
    } catch (_error) {
      return res.sendStatus(403);
    }
  });
  router.get('/manage.js', async (req, res) => {
    setWorkspaceStaffSecurityHeaders(res);
    if (!isWorkspaceStaffEnabled(options.env || process.env)) return res.sendStatus(404);
    try {
      const authority = await service.resolveManageAccess(req.staffBrowserSession?.adminId);
      if (!authority) return res.sendStatus(403);
      return res.status(200).type('application/javascript').send(workspaceStaffManageClientScript());
    } catch (_error) {
      return res.sendStatus(403);
    }
  });
  router.get('/access-manage.js', async (req, res) => {
    setWorkspaceStaffSecurityHeaders(res);
    if (!isWorkspaceStaffEnabled(options.env || process.env)) return res.sendStatus(404);
    try {
      const authority = await accessService.resolveManageAccess(req.staffBrowserSession?.adminId);
      if (!authority) return res.sendStatus(403);
      return res.status(200).type('application/javascript').send(workspaceStaffAccessClientScript());
    } catch (_error) {
      return res.sendStatus(403);
    }
  });
  router.get('/', createWorkspaceStaffListHandler({ ...options, service }));
  router.get('/:id', createWorkspaceStaffDetailHandler({ ...options, service, accessService }));
  return router;
}

module.exports = {
  isWorkspaceStaffEnabled,
  setWorkspaceStaffSecurityHeaders,
  safeError,
  navScript,
  createWorkspaceStaffListHandler,
  createWorkspaceStaffDetailHandler,
  createWorkspaceStaffRouter,
};
