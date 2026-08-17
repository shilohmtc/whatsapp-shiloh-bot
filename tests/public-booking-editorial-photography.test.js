const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPageEditorial');

test('booking page uses restrained editorial clinic photography instead of shallow gallery strips', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /class="editorial-photo editorial-photo-primary"/);
  assert.match(html, /class="editorial-photo editorial-photo-secondary"/);
  assert.match(html, /<img src="\/assets\/booking\/treatment-room-side\.webp"/);
  assert.match(html, /<img src="\/assets\/booking\/pedicure-side\.webp"/);
  assert.match(html, /\.editorial-photo\{width:min\(940px/);
  assert.match(html, /\.editorial-photo img\{display:block;width:100%;height:320px;object-fit:cover/);
  assert.match(html, /@media\(max-width:700px\).*height:210px/);
  assert.doesNotMatch(html, /<section class="clinic-gallery"/);
});

test('editorial photography does not change booking availability semantics', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed when Shiloh completes your booking/);
  assert.doesNotMatch(html, /available today|available now/i);
});
