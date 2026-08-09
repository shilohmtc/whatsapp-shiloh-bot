const express = require("express");
const auditReadAuth = require("../middleware/auditReadAuth");
const { getPostCanonicalizationAudit } = require("../services/canonicalizationAudit");

const router = express.Router();

// Public, sanitized operational status. This intentionally exposes only booleans
// needed to verify migration health and contains no client names, contact data,
// external IDs, canonical IDs, or detailed reconciliation records.
router.get("/canonicalization/status", async (req, res) => {
  try {
    const report = await getPostCanonicalizationAudit(req.query.batchId || null);
    return res.status(200).json({
      status: {
        safety: report.safety,
        batchId: report.batchId,
        overallPass: report.overallPass,
        checks: report.checks,
      },
      requestId: req.id,
    });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build sanitized canonicalization audit status");
    if (/batchId is required/.test(error.message || "")) {
      return res.status(400).json({ error: error.message, requestId: req.id });
    }
    return res.status(500).json({ error: "Could not build canonicalization audit status", requestId: req.id });
  }
});

// Detailed audit remains separately protected and is not required for routine
// automated verification from ChatGPT/Render.
router.get("/canonicalization", auditReadAuth, async (req, res) => {
  try {
    const report = await getPostCanonicalizationAudit(req.query.batchId || null);
    return res.status(200).json({ report, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build canonicalization audit");
    if (/batchId is required/.test(error.message || "")) {
      return res.status(400).json({ error: error.message, requestId: req.id });
    }
    return res.status(500).json({ error: "Could not build canonicalization audit", requestId: req.id });
  }
});

module.exports = router;
