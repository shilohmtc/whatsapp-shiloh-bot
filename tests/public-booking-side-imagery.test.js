const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPage');

test('wide desktop booking page has restrained real Shiloh side imagery', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /class="ambient-photo ambient-left"/);
  assert.match(html, /class="ambient-photo ambient-right"/);
  assert.match(html, /\/assets\/booking\/pedicure-side\.webp/);
  assert.match(html, /\/assets\/booking\/treatment-room-side\.webp/);
  assert.match(html, /@media\(max-width:1340px\)\{\.ambient-photo\{display:none\}\}/);
});

test('side imagery remains presentation-only and availability stays fail-closed', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed when Shiloh completes your booking/);
  assert.doesNotMatch(html, /available today|available now/i);
});
