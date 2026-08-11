const crypto = require('crypto');

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function catalogueMigrationAuth(req, res, next) {
  const configured = process.env.CATALOGUE_MIGRATION_KEY;
  if (!configured) {
    return res.status(503).json({ error: 'Catalogue migration endpoint is disabled', requestId: req.id });
  }
  if (!safeEqual(req.get('x-catalogue-migration-key'), configured)) {
    return res.status(401).json({ error: 'Unauthorized', requestId: req.id });
  }
  return next();
}

module.exports = catalogueMigrationAuth;
