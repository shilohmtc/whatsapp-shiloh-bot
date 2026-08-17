const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPageEditorial');

test('booking page uses the Shiloh collage only as a bounded middle-section atmosphere', () => {
  const catalogue = Array.from({ length: 6 }, (_, index) => ({
    category: `Category ${index + 1}`,
    name: `Service ${index + 1}`,
    duration: '60 min',
    price: 'R500',
  }));
  const html = renderBookingPage('+27823269871', catalogue);
  assert.match(html, /class="collage-atmosphere"/);
  assert.match(html, /class="collage-surface"/);
  assert.match(html, /\/assets\/booking\/clinic-collage-bg\.jpg/);
  assert.match(html, /linear-gradient\(rgba\(247,243,235,\.52\)/);
  assert.match(html, /opacity:\.78/);
  assert.match(html, /background:rgba\(247,243,235,\.9\)/);
  assert.match(html, /@media\(max-width:700px\).*\.collage-atmosphere::before\{display:none\}/);
  assert.doesNotMatch(html, /class="editorial-photo/);
  assert.doesNotMatch(html, /<section class="clinic-gallery"/);
});

test('collage atmosphere does not change booking availability semantics', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed when Shiloh completes your booking/);
  assert.doesNotMatch(html, /available today|available now/i);
});
