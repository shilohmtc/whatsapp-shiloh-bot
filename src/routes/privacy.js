const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const { getClientPrivacyInventory } = require('../services/privacyClientInventory');
const {
  ownerApprovalConfigured,
  ownerApprovalAuthorized,
  createPrivacyRequest,
  getPrivacyRequest,
  verifyPrivacyRequest,
  authorizePrivacyRequest,
} = require('../services/privacyRequestWorkflow');

const router = express.Router();
router.use(adminAuth);

function requireOwnerApproval(req, res, next) {
  if (!ownerApprovalConfigured()) {
    return res.status(503).json({ error: 'Privacy owner approval is not configured', requestId: req.id });
  }
  if (!ownerApprovalAuthorized(req.get('x-privacy-owner-key'))) {
    return res.status(403).json({ error: 'Owner authorization required', requestId: req.id });
  }
  return next();
}

router.get('/clients/:id/preview', async (req, res, next) => {
  try {
    const inventory = await getClientPrivacyInventory(req.params.id);
    if (inventory.status === 'invalid_client') {
      return res.status(400).json({ error: 'Invalid CRM client ID', requestId: req.id });
    }
    if (inventory.status === 'not_found') {
      return res.status(404).json({ error: 'CRM client not found', requestId: req.id });
    }
    return res.status(200).json({ mode: 'preview_only', inventory, requestId: req.id });
  } catch (error) {
    return next(error);
  }
});

router.post('/requests', async (req, res, next) => {
  try {
    const result = await createPrivacyRequest({
      clientId: req.body?.clientId,
      requestedAction: req.body?.requestedAction,
    });
    if (result.status === 'invalid_client' || result.status === 'invalid_action') {
      return res.status(400).json({ error: result.status, requestId: req.id });
    }
    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'CRM client not found', requestId: req.id });
    }
    return res.status(201).json({ mode: 'workflow_only', ...result, requestId: req.id });
  } catch (error) {
    return next(error);
  }
});

router.get('/requests/:id', async (req, res, next) => {
  try {
    const result = await getPrivacyRequest(req.params.id);
    if (result.status === 'invalid_request') return res.status(400).json({ error: result.status, requestId: req.id });
    if (result.status === 'not_found') return res.status(404).json({ error: result.status, requestId: req.id });
    return res.status(200).json({ mode: 'workflow_only', ...result, requestId: req.id });
  } catch (error) {
    return next(error);
  }
});

router.post('/requests/:id/verify', requireOwnerApproval, async (req, res, next) => {
  try {
    const result = await verifyPrivacyRequest({
      requestId: req.params.id,
      verificationMethod: req.body?.verificationMethod,
    });
    if (result.status === 'invalid_request' || result.status === 'invalid_verification_method') {
      return res.status(400).json({ error: result.status, requestId: req.id });
    }
    if (result.status === 'not_found') return res.status(404).json({ error: result.status, requestId: req.id });
    if (result.status === 'state_conflict') return res.status(409).json({ error: result.status, requestId: req.id });
    return res.status(200).json({ mode: 'workflow_only', ...result, requestId: req.id });
  } catch (error) {
    return next(error);
  }
});

router.post('/requests/:id/authorize', requireOwnerApproval, async (req, res, next) => {
  try {
    const result = await authorizePrivacyRequest({ requestId: req.params.id });
    if (result.status === 'invalid_request') return res.status(400).json({ error: result.status, requestId: req.id });
    if (result.status === 'not_found') return res.status(404).json({ error: result.status, requestId: req.id });
    if (['identity_not_verified', 'inventory_blocked', 'state_conflict'].includes(result.status)) {
      return res.status(409).json({ error: result.status, destructiveActionAllowed: false, requestId: req.id });
    }
    return res.status(200).json({ mode: 'workflow_only', ...result, requestId: req.id });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
