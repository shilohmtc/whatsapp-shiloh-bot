const {
  getReconciliationSummary,
  listReconciliationCases,
  getReconciliationCase,
} = require("../services/reconciliationReport");
const { getRecommendationReport } = require("../services/reconciliationRecommendations");
const { canonicalizeClients } = require("../services/clientCanonicalization");

exports.getSummary = async (req, res) => {
  try {
    const report = await getReconciliationSummary(req.query.batchId || null);
    return res.status(200).json({ report, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build reconciliation summary");
    return res.status(500).json({ error: "Could not build reconciliation summary", requestId: req.id });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const report = await getRecommendationReport(req.query.batchId || null);
    return res.status(200).json({ report, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to build reconciliation recommendations");
    return res.status(500).json({ error: "Could not build reconciliation recommendations", requestId: req.id });
  }
};

exports.canonicalizeClients = async (req, res) => {
  try {
    const result = await canonicalizeClients({
      batchId: req.body?.batchId,
      mode: req.body?.mode || "dry_run",
      confirmation: req.body?.confirmation,
    });
    return res.status(200).json({ result, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Client canonicalization failed");
    if (error.code === "CONFIRMATION_REQUIRED") {
      return res.status(409).json({ error: error.message, requestId: req.id });
    }
    if (error.code === "PLAN_BLOCKED") {
      return res.status(409).json({ error: error.message, plan: error.plan, requestId: req.id });
    }
    if (/batchId is required|mode must be/.test(error.message || "")) {
      return res.status(400).json({ error: error.message, requestId: req.id });
    }
    return res.status(500).json({ error: "Could not canonicalize clients", requestId: req.id });
  }
};

exports.getCases = async (req, res) => {
  try {
    const cases = await listReconciliationCases({
      batchId: req.query.batchId || null,
      status: req.query.status || null,
      reason: req.query.reason || null,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(200).json({ cases, count: cases.length, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to list reconciliation cases");
    return res.status(500).json({ error: "Could not list reconciliation cases", requestId: req.id });
  }
};

exports.getCase = async (req, res) => {
  try {
    const record = await getReconciliationCase(req.params.id);
    if (!record) return res.status(404).json({ error: "Reconciliation case not found", requestId: req.id });
    return res.status(200).json({ case: record, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to get reconciliation case");
    return res.status(500).json({ error: "Could not get reconciliation case", requestId: req.id });
  }
};
