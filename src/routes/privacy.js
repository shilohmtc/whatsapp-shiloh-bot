const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const { getClientPrivacyInventory } = require('../services/privacyClientInventory');

const router = express.Router();
router.use(adminAuth);

router.get('/clients/:id/preview', async (req, res, next) => {
  try {
    const inventory = await getClientPrivacyInventory(req.params.id);
    if (inventory.status === 'invalid_client') {
      return res.status(400).json({ error: 'Invalid CRM client ID', requestId: req.id });
    }
    if (inventory.status === 'not_found') {
      return res.status(404).json({ error: 'CRM client not found', requestId: req.id });
    }
    return res.status(200).json({
      mode: 'preview_only',
      inventory,
      requestId: req.id,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
