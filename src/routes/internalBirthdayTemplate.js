const express = require('express');
const {
  getBirthdayTemplateStatus,
  submitBirthdayTemplate,
} = require('../services/birthdayTemplateProvisioning');

const router = express.Router();

function authorized(req) {
  const expected = process.env.BIRTHDAY_TEMPLATE_ADMIN_TOKEN;
  const supplied = req.get('x-shiloh-internal-token');
  return Boolean(expected && supplied && supplied === expected);
}

router.use((req, res, next) => {
  if (!process.env.BIRTHDAY_TEMPLATE_ADMIN_TOKEN) return res.sendStatus(404);
  if (!authorized(req)) return res.sendStatus(403);
  return next();
});

router.get('/birthday-template', async (req, res) => {
  try {
    const result = await getBirthdayTemplateStatus();
    return res.status(result.ok ? 200 : 409).json(result);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'birthday_template_status_failed',
      providerStatus: error.response?.status || null,
      providerError: error.response?.data?.error?.message || error.message,
    });
  }
});

router.post('/birthday-template', async (req, res) => {
  if (req.body?.confirm !== 'SUBMIT_SHILOH_BIRTHDAY_TEMPLATE') {
    return res.status(400).json({ ok: false, error: 'explicit_confirmation_required' });
  }
  try {
    const result = await submitBirthdayTemplate();
    return res.status(result.ok ? 200 : 409).json(result);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'birthday_template_submission_failed',
      providerStatus: error.response?.status || null,
      providerError: error.response?.data?.error?.message || error.message,
      providerCode: error.response?.data?.error?.code || null,
      providerSubcode: error.response?.data?.error?.error_subcode || null,
    });
  }
});

module.exports = router;
