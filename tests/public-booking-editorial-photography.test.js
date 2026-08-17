const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPageEditorial');

test('booking page uses full-width editorial clinic photography instead of shallow gallery strips', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /class="editorial-photo editorial-photo-primary"/);
  assert.match(html, /class="editorial-photo editorial-photo-secondary"/);
  assert.match(html, /<img src="\/assets\/booking\/treatment-room-side\.webp"/);
  assert.match(html, /<img src="\/assets\/booking\/pedicure-side\.webp"/);
  assert.match(html, /\.editorial-photo img\{display:block;width:100%;height:auto/);
  assert.doesNotMatch(html, /<section class="clinic-gallery"/);
});

test('editorial photography does not change booking availability semantics', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed when Shiloh completes your booking/);
  assert.doesNotMatch(html, /available today|available now/i);
});
