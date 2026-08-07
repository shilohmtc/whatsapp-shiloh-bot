const crypto = require("crypto");

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function adminAuth(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY;

  if (!configuredKey) {
    return res.status(503).json({
      error: "Admin API is not configured",
      requestId: req.id,
    });
  }

  const suppliedKey = req.get("x-admin-key");

  if (!safeEqual(suppliedKey, configuredKey)) {
    return res.status(401).json({
      error: "Unauthorized",
      requestId: req.id,
    });
  }

  return next();
}

module.exports = adminAuth;
