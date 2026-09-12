'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CANONICAL_ORIGIN,
  canonicalHostRedirect,
  requestHostname,
} = require('../src/middleware/canonicalHostRedirect');

function run({ host, forwardedHost = '', path = '/book', originalUrl = path } = {}) {
  let nextCalled = false;
  let redirect = null;
  const req = {
    headers: { host, ...(forwardedHost ? { 'x-forwarded-host': forwardedHost } : {}) },
    path,
    originalUrl,
  };
  const res = {
    redirect(status, location) {
      redirect = { status, location };
      return redirect;
    },
  };
  const result = canonicalHostRedirect(req, res, () => { nextCalled = true; });
  return { nextCalled, redirect, result };
}

test('redirects legacy Render booking links to the canonical Shiloh origin', () => {
  const result = run({
    host: 'shiloh-whatsapp-bot.onrender.com',
    path: '/book',
    originalUrl: '/book?service=massage',
  });

  assert.equal(result.nextCalled, false);
  assert.deepEqual(result.redirect, {
    status: 308,
    location: `${CANONICAL_ORIGIN}/book?service=massage`,
  });
});

test('does not redirect the canonical domain or unrelated hosts', () => {
  assert.equal(run({ host: 'app.shilohmtc.co.za' }).nextCalled, true);
  assert.equal(run({ host: 'internal-service:10000' }).nextCalled, true);
});

test('keeps health and webhook paths available on the legacy hostname for rollback safety', () => {
  assert.equal(run({ host: 'shiloh-whatsapp-bot.onrender.com', path: '/health' }).nextCalled, true);
  assert.equal(run({ host: 'shiloh-whatsapp-bot.onrender.com', path: '/webhook' }).nextCalled, true);
});

test('uses the first forwarded hostname and strips a port', () => {
  assert.equal(
    requestHostname({ headers: { host: 'internal:10000', 'x-forwarded-host': 'shiloh-whatsapp-bot.onrender.com:443, proxy.local' } }),
    'shiloh-whatsapp-bot.onrender.com'
  );
});
