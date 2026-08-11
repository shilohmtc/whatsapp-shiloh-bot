const express = require("express");
const auditReadAuth = require("../middleware/auditReadAuth");
const { getPostCanonicalizationAudit } = require("../services/canonicalizationAudit");
const { getCatalogueParityAudit } = require("../services/catalogueParityAudit");
const { getGoldieExitAudit } = require("../services/goldieExitAudit");

const router = express.Router();

router.get("/canonicalization/status", async (req, res) => {
  try {
    const report = await getPostCanonicalizationAudit(req.query.batchId || null);
    return res.status(200).json({ status: { safety: report.safety, batchId: report.batchId, overallPass: report.overallPass, checks: report.checks }, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build sanitized canonicalization audit status");
    if (/batchId is required/.test(error.message || "")) return res.status(400).json({ error: error.message, requestId: req.id });
    return res.status(500).json({ error: "Could not build canonicalization audit status", requestId: req.id });
  }
});

router.get("/catalogue/status", async (req, res) => {
  try {
    const report = await getCatalogueParityAudit();
    return res.status(200).json({ report, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build catalogue parity audit");
    return res.status(500).json({ error: "Could not build catalogue parity audit", requestId: req.id });
  }
});

// Sanitized, read-only Goldie cutover gate. No client identity/contact data or external keys are returned.
router.get("/goldie-exit/status", async (req, res) => {
  try {
    const report = await getGoldieExitAudit();
    return res.status(200).json({ report, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build Goldie exit audit");
    return res.status(500).json({ error: "Could not build Goldie exit audit", requestId: req.id });
  }
});

router.get("/canonicalization", auditReadAuth, async (req, res) => {
  try {
    const report = await getPostCanonicalizationAudit(req.query.batchId || null);
    return res.status(200).json({ report, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build canonicalization audit");
    if (/batchId is required/.test(error.message || "")) return res.status(400).json({ error: error.message, requestId: req.id });
    return res.status(500).json({ error: "Could not build canonicalization audit", requestId: req.id });
  }
});

module.exports = router;
