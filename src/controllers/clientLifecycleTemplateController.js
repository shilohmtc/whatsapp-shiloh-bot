const { DEFINITIONS, getClientLifecycleTemplateStatus, submitClientLifecycleTemplate } = require('../services/clientLifecycleTemplateProvisioning');
exports.getStatus = async (req, res) => { try { const result = await getClientLifecycleTemplateStatus(); return res.status(result.ok ? 200 : 503).json({ ...result, requestId: req.id }); } catch (error) { (req.log || console).error?.({ err: error }, 'Lifecycle template status check failed'); return res.status(error.response?.status || 500).json({ error: 'Lifecycle template status check failed', metaError: error.response?.data?.error || null, requestId: req.id }); } };
exports.submitMissing = async (req, res) => {
  const keys = Object.keys(DEFINITIONS);
  try {
    const before = await getClientLifecycleTemplateStatus(); if (!before.ok) return res.status(503).json({ ...before, requestId: req.id });
    const missing = before.templates.filter((item) => !item.provider).map((item) => item.key); const results = [];
    for (const key of keys) { if (missing.includes(key)) results.push(await submitClientLifecycleTemplate(key)); }
    const after = await getClientLifecycleTemplateStatus();
    return res.status(200).json({ submittedKeys: results.filter((item) => item.submitted).map((item) => item.key), skippedExistingKeys: keys.filter((key) => !missing.includes(key)), results, status: after, requestId: req.id });
  } catch (error) { (req.log || console).error?.({ err: error }, 'Lifecycle template submission failed'); return res.status(error.response?.status || 500).json({ error: 'Lifecycle template submission failed', metaError: error.response?.data?.error || null, requestId: req.id }); }
};
