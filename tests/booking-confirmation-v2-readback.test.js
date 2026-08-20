const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const provisioning = require('../src/services/bookingConfirmationV2TemplateProvisioning');

const originalGet = axios.get;
const originalPost = axios.post;
const originalEnv = { ...process.env };

test.afterEach(() => {
  axios.get = originalGet;
  axios.post = originalPost;
  process.env = { ...originalEnv };
});

test('new v2 submission immediately performs a sanitized read-only provider contract readback', async () => {
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'waba-test';
  const exact = provisioning.buildBookingConfirmationV2TemplateDefinition();
  let gets = 0;
  let posts = 0;
  axios.get = async () => {
    gets += 1;
    return gets === 1
      ? { data: { data: [] } }
      : { data: { data: [{ id: 'provider-created', status: 'PENDING', ...exact }] } };
  };
  axios.post = async () => {
    posts += 1;
    return { data: { id: 'provider-created', status: 'PENDING', category: 'UTILITY' } };
  };

  const result = await provisioning.submitBookingConfirmationV2Template();
  assert.equal(posts, 1);
  assert.equal(gets, 2);
  assert.equal(result.submitted, true);
  assert.equal(result.verification.name, 'shiloh_booking_confirmation_v2');
  assert.equal(result.verification.language, 'en');
  assert.equal(result.verification.category, 'UTILITY');
  assert.equal(result.verification.status, 'PENDING');
  assert.equal(result.verification.exact, true);
  assert.equal(result.duplicateCount, 0);
  assert.deepEqual(result.verification.components, [
    { type: 'HEADER', format: 'TEXT', text: 'Appointment confirmed' },
    { type: 'BODY', text: exact.components[1].text },
    { type: 'FOOTER', text: 'Shiloh Massage Therapy & Aesthetic Clinic' },
    { type: 'BUTTONS', buttons: [
      { type: 'QUICK_REPLY', text: 'Add to calendar' },
      { type: 'QUICK_REPLY', text: 'Manage booking' },
      { type: 'QUICK_REPLY', text: 'My appointments' },
    ] },
  ]);
});
