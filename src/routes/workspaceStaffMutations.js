const express = require('express');
const workspaceStaff = require('../services/workspaceStaff');
const workspaceStaffAccess = require('../services/workspaceStaffAccess');
const workspaceStaffAccessCompletion = require('../services/workspaceStaffAccessCompletion');
const {
  requireStaffSession,
  sameOriginGuard,
  csrfGuard,
} = require('../middleware/staffBrowserSession');

function isWorkspaceStaffEnabled(env = process.env) {
  return String(env.SHILOH_CALENDAR_READONLY_UX_ENABLED || '').trim().toLowerCase() === 'true'
    && String(env.SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED || '').trim().toLowerCase() === 'true';
}

function mutationStatus(error) {
  const status = Number(error?.httpStatus) || 503;
  return [400, 403, 404, 409].includes(status) ? status : 503;
}

function sendMutationError(error, req, res, next) {
  const status = mutationStatus(error);
  if (status === 503) return next(error);
  return res.status(status).json({
    error: error?.message || 'The canonical Staff operation failed closed.',
    code: error?.code || 'WORKSPACE_STAFF_OPERATION_FAILED',
    requestId: req.id,
  });
}

function createWorkspaceStaffMutationRouter({
  env = process.env,
  sessionService,
  service = workspaceStaff,
  accessService = workspaceStaffAccess,
  accessCompletionService = workspaceStaffAccessCompletion,
} = {}) {
  if (!sessionService) throw new Error('Workspace Staff mutations require the existing staff browser session service');
  const router = express.Router();
  const requireSession = requireStaffSession({ service: sessionService, env });
  const sameOrigin = sameOriginGuard({ env });
  const requireCsrf = csrfGuard({ service: sessionService });
  const mutationChain = [sameOrigin, requireSession, requireCsrf];

  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!isWorkspaceStaffEnabled(env)) return res.sendStatus(404);
    return next();
  });

  router.post('/create', ...mutationChain, async (req, res, next) => {
    try {
      const result = await service.createStaff({
        adminId: req.staffBrowserSession?.adminId,
        requestId: req.body?.requestId,
        displayName: req.body?.displayName,
        resourceType: req.body?.resourceType,
        schedulingType: req.body?.schedulingType,
        clientBookable: req.body?.clientBookable,
      });
      return res.status(201).json(result);
    } catch (error) {
      return sendMutationError(error, req, res, next);
    }
  });

  router.post('/:id/update', ...mutationChain, async (req, res, next) => {
    try {
      const result = await service.updateStaff({
        adminId: req.staffBrowserSession?.adminId,
        staffId: req.params?.id,
        expectedRevision: req.body?.expectedRevision,
        requestId: req.body?.requestId,
        displayName: req.body?.displayName,
        schedulingType: req.body?.schedulingType,
        clientBookable: req.body?.clientBookable,
      });
      return res.status(200).json(result);
    } catch (error) {
      return sendMutationError(error, req, res, next);
    }
  });

  router.post('/:id/status', ...mutationChain, async (req, res, next) => {
    try {
      const result = await service.setStaffStatus({
        adminId: req.staffBrowserSession?.adminId,
        staffId: req.params?.id,
        expectedRevision: req.body?.expectedRevision,
        requestId: req.body?.requestId,
        status: req.body?.status,
      });
      return res.status(200).json(result);
    } catch (error) {
      return sendMutationError(error, req, res, next);
    }
  });

  router.post('/:id/access/enable', ...mutationChain, async (req, res, next) => {
    try {
      const result = await accessService.enableWorkspaceAccess({
        adminId: req.staffBrowserSession?.adminId,
        staffId: req.params?.id,
        expectedRevision: req.body?.expectedRevision,
        requestId: req.body?.requestId,
        whatsappNumber: req.body?.whatsappNumber,
        identityConfirmed: req.body?.identityConfirmed === true,
      });
      return res.status(200).json(result);
    } catch (error) {
      return sendMutationError(error, req, res, next);
    }
  });

  router.post('/:id/access/complete', ...mutationChain, async (req, res, next) => {
    try {
      const result = await accessCompletionService.completeWorkspaceAccess({
        adminId: req.staffBrowserSession?.adminId,
        staffId: req.params?.id,
        expectedRevision: req.body?.expectedRevision,
        requestId: req.body?.requestId,
        whatsappNumber: req.body?.whatsappNumber,
        identityConfirmed: req.body?.identityConfirmed === true,
      });
      return res.status(200).json(result);
    } catch (error) {
      return sendMutationError(error, req, res, next);
    }
  });

  return router;
}

module.exports = {
  isWorkspaceStaffEnabled,
  mutationStatus,
  sendMutationError,
  createWorkspaceStaffMutationRouter,
};
