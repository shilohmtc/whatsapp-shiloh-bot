const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const {
  buildMetaTemplateRegistrationPayload,
} = require('../src/services/metaTemplateAdapter');
const {
  assertMessageContractSendAllowed,
  resetTemplateInventoryCache,
} = require('../src/services/metaTemplateContracts');

function withEnvironment(overrides, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value == null) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

test('runtime resolves an exact approved provider asset through the Shiloh contract ID', async () => {
  const originalGet = axios.get;
  const provider = {
    id: 'provider-template-id',
    status: 'APPROVED',
    ...buildMetaTemplateRegistrationPayload('booking_approval_request'),
  };

  axios.get = async () => ({ data: { data: [provider], paging: {} } });
  resetTemplateInventoryCache();

  try {
    await withEnvironment({
      WHATSAPP_TOKEN: 'test-token',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'test-waba',
      WHATSAPP_BOOKING_APPROVAL_REQUEST_TEMPLATE: 'shiloh_booking_approval_request_v1',
    }, async () => {
      const state = await assertMessageContractSendAllowed('booking_approval_request');
      assert.equal(state.key, 'booking_approval_request');
      assert.equal(state.ready, true);
      assert.equal(state.binding.bound, true);
      assert.equal(state.binding.state, 'approved_exact');
      assert.equal(Object.hasOwn(state.binding, 'providerTemplateId'), false);
    });
  } finally {
    axios.get = originalGet;
    resetTemplateInventoryCache();
  }
});

test('runtime fails closed when provider approval exists but semantic content drifted', async () => {
  const originalGet = axios.get;
  const provider = {
    id: 'provider-template-id',
    status: 'APPROVED',
    ...buildMetaTemplateRegistrationPayload('booking_approval_request'),
  };
  provider.components = JSON.parse(JSON.stringify(provider.components));
  provider.components[0].text = `${provider.components[0].text} drift`;

  axios.get = async () => ({ data: { data: [provider], paging: {} } });
  resetTemplateInventoryCache();

  try {
    await withEnvironment({
      WHATSAPP_TOKEN: 'test-token',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'test-waba',
      WHATSAPP_BOOKING_APPROVAL_REQUEST_TEMPLATE: 'shiloh_booking_approval_request_v1',
    }, async () => {
      await assert.rejects(
        assertMessageContractSendAllowed('booking_approval_request'),
        /not exact, approved and configured/,
      );
    });
  } finally {
    axios.get = originalGet;
    resetTemplateInventoryCache();
  }
});
