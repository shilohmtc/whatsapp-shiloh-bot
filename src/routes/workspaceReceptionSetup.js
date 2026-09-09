const express = require('express');
const workspaceReceptionAccess = require('../services/workspaceReceptionAccess');
const {
  renderReceptionSetupPage,
  workspaceReceptionSetupClientScript,
} = require('../presentation/workspaceReceptionSetupUx');
const {
  requireStaffSession,
  sameOriginGuard,
  csrfGuard,
} = require('../middleware/staffBrowserSession');
const { isWorkspaceStaffEnabled, setWorkspaceStaffSecurityHeaders } = require('./workspaceStaff');
const { sendMutationError } = require('./workspaceStaffMutations');

function createWorkspaceReceptionSetupRouter({
  env = process.env,
  sessionService,
  service = workspaceReceptionAccess,
  renderPage = renderReceptionSetupPage,
} = {}) {
  if (!sessionService) throw new Error('Workspace Reception setup requires the existing staff browser session service');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });

  router.use((req, res, next) => {
    setWorkspaceStaffSecurityHeaders(res);
    if (!isWorkspaceStaffEnabled(env)) return res.sendStatus(404);
    return next();
  });

  router.get('/client.js', requireSession, async (req, res) => {
    try {
      const authority = await service.requireManageAccess(req.staffBrowserSession?.adminId);
      if (!authority) return res.sendStatus(403);
      return res.status(200).type('application/javascript').send(workspaceReceptionSetupClientScript());
    } catch (_error) {
      return res.sendStatus(403);
    }
  });

  router.get('/', requireSession, async (req, res) => {
    try {
      const model = await service.getState(req.staffBrowserSession?.adminId);
      model.authorityDisplayName = req.staffBrowserSession?.displayName || null;
      return res.status(200).type('html').send(renderPage(model));
    } catch (error) {
      const status = Number(error?.httpStatus) || 503;
      if ([403, 409].includes(status)) {
        return res.status(status).type('text/plain').send(error?.message || 'Reception access is unavailable.');
      }
      throw error;
    }
  });

  router.post('/', sameOrigin, requireSession, requireCsrf, async (req, res, next) => {
    try {
      const result = await service.createReceptionPrincipal({
        adminId: req.staffBrowserSession?.adminId,
        requestId: req.body?.requestId,
        whatsappNumber: req.body?.whatsappNumber,
        identityConfirmed: req.body?.identityConfirmed === true,
      });
      return res.status(result.status === 'created' ? 201 : 200).json(result);
    } catch (error) {
      return sendMutationError(error, req, res, next);
    }
  });

  return router;
}

module.exports = { createWorkspaceReceptionSetupRouter };
