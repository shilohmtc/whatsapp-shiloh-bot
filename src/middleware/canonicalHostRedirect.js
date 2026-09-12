'use strict';

const LEGACY_RENDER_HOST = 'shiloh-whatsapp-bot.onrender.com';
const CANONICAL_ORIGIN = 'https://app.shilohmtc.co.za';
const LEGACY_PASSTHROUGH_PATHS = new Set(['/health', '/webhook']);

function requestHostname(req) {
  const forwarded = String(req.headers?.['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwarded || String(req.headers?.host || '');
  return host.toLowerCase().replace(/:\d+$/, '');
}

function canonicalHostRedirect(req, res, next) {
  if (requestHostname(req) !== LEGACY_RENDER_HOST) return next();
  if (LEGACY_PASSTHROUGH_PATHS.has(req.path)) return next();

  return res.redirect(308, `${CANONICAL_ORIGIN}${req.originalUrl || req.url || '/'}`);
}

module.exports = {
  CANONICAL_ORIGIN,
  LEGACY_RENDER_HOST,
  canonicalHostRedirect,
  requestHostname,
};
