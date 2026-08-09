const express = require("express");
const auditReadAuth = require("../middleware/auditReadAuth");
const { getPostCanonicalizationAudit } = require("../services/canonicalizationAudit");

const router = express.Router();

router.use(auditReadAuth);

router.get("/canonicalization", async (req, res) => {
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
