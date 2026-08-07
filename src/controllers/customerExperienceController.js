const {
  listFeedback,
  listReviewRequests,
  getSatisfactionAnalytics,
  resolveFeedback,
} = require("../services/customerExperience");

exports.getFeedback = async (req, res) => {
  try {
    const feedback = await listFeedback(
      req.query.limit,
      String(req.query.unresolved || "").toLowerCase() === "true"
    );
    return res.status(200).json({ feedback, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to list customer feedback");
    return res.status(500).json({ error: "Could not list customer feedback", requestId: req.id });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await listReviewRequests(req.query.limit);
    return res.status(200).json({ reviews, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to list review requests");
    return res.status(500).json({ error: "Could not list review requests", requestId: req.id });
  }
};

exports.getCustomerSatisfaction = async (req, res) => {
  try {
    const analytics = await getSatisfactionAnalytics();
    return res.status(200).json({ analytics, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to read customer satisfaction analytics");
    return res.status(500).json({ error: "Could not read customer satisfaction analytics", requestId: req.id });
  }
};

exports.resolveCustomerFeedback = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid feedback id", requestId: req.id });
    }

    const feedback = await resolveFeedback(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found", requestId: req.id });
    }

    return res.status(200).json({ feedback, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to resolve customer feedback");
    return res.status(500).json({ error: "Could not resolve customer feedback", requestId: req.id });
  }
};
