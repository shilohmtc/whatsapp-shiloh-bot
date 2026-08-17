const test = require('node:test');
const assert = require('node:assert/strict');
const { renderBookingPage } = require('../src/services/publicBookingPageEditorial');

test('booking page adds one blurred Inside Shiloh break after the first Massage row', () => {
  const catalogue = Array.from({ length: 6 }, (_, index) => ({
    category: 'Massage',
    name: `Massage ${index + 1}`,
    duration: '60 min',
    price: 'R500',
  }));
  const html = renderBookingPage('+27823269871', catalogue);
  assert.match(html, /class="inside-shiloh-break"/);
  assert.match(html, /Inside Shiloh/);
  assert.match(html, /Clinical care\. Personal touch\. Beautifully you\./);
  assert.match(html, /clinic-collage-bg\.jpg/);
  assert.match(html, /filter:blur\(5px\)/);
  assert.match(html, /class="service-grid service-grid-after-break"/);
  assert.doesNotMatch(html, /class="collage-atmosphere"/);
  assert.doesNotMatch(html, /<section class="clinic-gallery"/);
  const firstThreeEnd = html.indexOf('Massage 3');
  const breakIndex = html.indexOf('class="inside-shiloh-break"');
  const fourthIndex = html.indexOf('Massage 4');
  assert.ok(firstThreeEnd < breakIndex && breakIndex < fourthIndex);
});

test('Inside Shiloh break is omitted when Massage is not present', () => {
  const catalogue = [{ category: 'Facials', name: 'Facial', duration: '60 min', price: 'R500' }];
  const html = renderBookingPage('+27823269871', catalogue);
  assert.doesNotMatch(html, /class="inside-shiloh-break"/);
});

test('visual break does not change booking availability semantics', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed when Shiloh completes your booking/);
  assert.doesNotMatch(html, /available today|available now/i);
});
