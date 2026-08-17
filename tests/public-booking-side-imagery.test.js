const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPage');

test('wide desktop booking page has restrained decorative Shiloh side imagery', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /class="ambient-photo ambient-left"/);
  assert.match(html, /class="ambient-photo ambient-right"/);
  assert.match(html, /\/assets\/booking\/reception\.svg/);
  assert.match(html, /@media\(max-width:1640px\)\{\.ambient-photo\{display:none\}\}/);
});

test('side imagery remains presentation-only and availability stays fail-closed', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed only after Shiloh completes the appointment flow/);
  assert.doesNotMatch(html, /available today|available now/i);
});
