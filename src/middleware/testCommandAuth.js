const crypto = require("crypto");

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function testCommandAuth(req, res, next) {
  if (String(process.env.SHILOH_TEST_SENDER_ENABLED || "").toLowerCase() !== "true") {
    return res.status(404).json({ error: "Not found", requestId: req.id });
  }

  const configuredKey = process.env.SHILOH_TEST_API_KEY;
  if (!configuredKey) {
    return res.status(503).json({ error: "Test command API is not configured", requestId: req.id });
  }

  const suppliedKey = req.get("x-shiloh-test-key");
  if (!safeEqual(suppliedKey, configuredKey)) {
    return res.status(401).json({ error: "Unauthorized", requestId: req.id });
  }

  return next();
}

module.exports = testCommandAuth;
