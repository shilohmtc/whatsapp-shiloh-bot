const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPageEditorial');

test('booking page keeps the approved hero and clean catalogue without experimental photography layers', () => {
  const catalogue = Array.from({ length: 6 }, (_, index) => ({
    category: `Category ${index + 1}`,
    name: `Service ${index + 1}`,
    duration: '60 min',
    price: 'R500',
  }));
  const html = renderBookingPage('+27823269871', catalogue);
  assert.doesNotMatch(html, /class="collage-atmosphere"/);
  assert.doesNotMatch(html, /class="collage-surface"/);
  assert.doesNotMatch(html, /clinic-collage-bg\.jpg/);
  assert.doesNotMatch(html, /class="editorial-photo/);
  assert.doesNotMatch(html, /<section class="clinic-gallery"/);
  assert.match(html, /Your appointment starts with Shiloh/);
  assert.match(html, /Choose a treatment, or let Shiloh/);
});

test('clean booking presentation does not change booking availability semantics', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed when Shiloh completes your booking/);
  assert.doesNotMatch(html, /available today|available now/i);
});
