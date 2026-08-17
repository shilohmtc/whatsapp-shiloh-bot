const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPage');

test('public booking page uses an integrated Shiloh clinic gallery instead of floating side frames', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /class="clinic-gallery"/);
  assert.match(html, /class="gallery-photo gallery-pedicure"/);
  assert.match(html, /class="gallery-photo gallery-treatment"/);
  assert.match(html, /\/assets\/booking\/pedicure-side\.webp/);
  assert.match(html, /\/assets\/booking\/treatment-room-side\.webp/);
  assert.doesNotMatch(html, /ambient-photo|ambient-left|ambient-right/);
});

test('integrated clinic imagery remains presentation-only and availability stays fail-closed', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed when Shiloh completes your booking/);
  assert.doesNotMatch(html, /available today|available now/i);
});
