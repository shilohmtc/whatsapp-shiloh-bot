const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWhatsAppBookingUrl, renderBookingPage, renderCatalogue } = require('../src/services/publicBookingPage');

test('service booking handoff preselects the canonical service name', () => {
  const url = buildWhatsAppBookingUrl('+27 82 326 9871', 'Full Body Swedish');
  assert.match(url, /^https:\/\/wa\.me\/27823269871\?text=/);
  assert.match(decodeURIComponent(url), /I'd like to book Full Body Swedish\./);
});

test('catalogue renders canonical service metadata grouped by category', () => {
  const html = renderCatalogue('+27823269871', [{
    id: 1,
    name: 'Full Body Swedish',
    category: 'Massage',
    duration: '90 min',
    price: 'R590',
    description: 'A relaxing full body massage.',
    bookingNote: '',
  }]);
  assert.match(html, /Massage/);
  assert.match(html, /Full Body Swedish/);
  assert.match(html, /90 min/);
  assert.match(html, /R590/);
  assert.match(html, /Book this treatment/);
});

test('public page does not claim availability before the WhatsApp booking flow', () => {
  const html = renderBookingPage('+27823269871', []);
  assert.match(html, /Availability is confirmed only after Shiloh completes the appointment flow/);
  assert.doesNotMatch(html, /available today|available now/i);
});
