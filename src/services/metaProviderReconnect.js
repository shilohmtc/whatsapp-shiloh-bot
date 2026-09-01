const axios = require('axios');
const { getShilohMessageContract } = require('./shilohMessageContracts');
const {
  META_TEMPLATE_BINDINGS,
  buildMetaTemplateRegistrationPayload,
} = require('./metaTemplateAdapter');
const { fetchAllTemplates } = require('./metaTemplateContracts');

const GRAPH_VERSION = 'v23.0';
const DEFAULT_APP_NAME = 'Shiloh_MTC';

function graphUrl(path) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${String(path).replace(/^\//, '')}`;
}

function requestConfig(env = process.env, params = undefined) {
  return {
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
    ...(params ? { params } : {}),
  };
}

function sanitizeProviderError(error) {
  const provider = error?.response?.data?.error || {};
  return {
    status: error?.response?.status == null ? null : Number(error.response.status),
    code: provider.code == null ? null : Number(provider.code),
    subcode: provider.error_subcode == null ? null : Number(provider.error_subcode),
    type: provider.type == null ? null : String(provider.type).slice(0, 80),
  };
}

function sanitizeApp(app) {
  if (!app) return null;
  return {
    id: app.id == null ? null : String(app.id),
    name: app.name == null ? null : String(app.name).slice(0, 120),
  };
}

function sanitizeTemplate(template) {
  if (!template) return null;
  return {
    id: template.id == null ? null : String(template.id),
    name: template.name == null ? null : String(template.name),
    language: template.language == null ? null : String(template.language),
    status: template.status == null ? null : String(template.status),
    category: template.category == null ? null : String(template.category),
  };
}

function currentSendableBindings({ bindings = META_TEMPLATE_BINDINGS, getContract = getShilohMessageContract } = {}) {
  return bindings.filter((binding) => {
    const contract = getContract(binding.contractId);
    return contract?.lifecycle === 'current' && contract?.sendable === true;
  });
}

async function listSubscribedApps({ wabaId, env = process.env, http = axios }) {
  const response = await http.get(
    graphUrl(`${wabaId}/subscribed_apps`),
    requestConfig(env, { fields: 'id,name' }),
  );
  return (response.data?.data || []).map(sanitizeApp).filter(Boolean);
}

async function ensureAppSubscription({ wabaId, env = process.env, http = axios } = {}) {
  const expectedName = String(env.META_PROVIDER_APP_NAME || DEFAULT_APP_NAME).trim();
  let before;
  try {
    before = await listSubscribedApps({ wabaId, env, http });
  } catch (error) {
    before = [];
  }

  const existing = before.find((app) => app.name === expectedName);
  if (existing) {
    return {
      ok: true,
      action: 'skipped_existing',
      expectedAppName: expectedName,
      app: existing,
      subscribedApps: before,
    };
  }

  try {
    await http.post(
      graphUrl(`${wabaId}/subscribed_apps`),
      {},
      requestConfig(env),
    );
    const after = await listSubscribedApps({ wabaId, env, http });
    const matched = after.find((app) => app.name === expectedName) || null;
    return {
      ok: Boolean(matched),
      action: 'subscribed',
      expectedAppName: expectedName,
      app: matched,
      subscribedApps: after,
      reason: matched ? null : 'subscription_readback_missing_expected_app',
    };
  } catch (error) {
    return {
      ok: false,
      action: 'subscription_failed',
      expectedAppName: expectedName,
      reason: 'provider_subscription_failed',
      providerError: sanitizeProviderError(error),
    };
  }
}

async function submitMissingCurrentTemplates({
  wabaId,
  env = process.env,
  http = axios,
  fetchTemplates = fetchAllTemplates,
  bindings = META_TEMPLATE_BINDINGS,
  getContract = getShilohMessageContract,
  buildPayload = buildMetaTemplateRegistrationPayload,
} = {}) {
  let providers;
  try {
    providers = await fetchTemplates(wabaId);
  } catch (error) {
    return {
      ok: false,
      reason: 'provider_template_inventory_failed',
      providerError: sanitizeProviderError(error),
      templates: [],
    };
  }

  const mutableProviders = Array.isArray(providers) ? [...providers] : [];
  const results = [];
  for (const binding of currentSendableBindings({ bindings, getContract })) {
    const contractId = binding.contractId;
    let payload;
    try {
      payload = buildPayload(contractId);
    } catch (error) {
      results.push({
        contractId,
        action: 'skipped_unregistrable',
        ok: false,
        reason: 'canonical_registration_payload_unavailable',
      });
      continue;
    }

    const existing = mutableProviders.find((provider) => (
      provider?.name === payload.name && provider?.language === payload.language
    ));
    if (existing) {
      results.push({
        contractId,
        action: 'skipped_existing',
        ok: true,
        provider: sanitizeTemplate(existing),
      });
      continue;
    }

    try {
      const response = await http.post(
        graphUrl(`${wabaId}/message_templates`),
        payload,
        requestConfig(env),
      );
      const provider = {
        id: response.data?.id || null,
        name: payload.name,
        language: payload.language,
        status: response.data?.status || null,
        category: response.data?.category || payload.category || null,
      };
      mutableProviders.push(provider);
      results.push({
        contractId,
        action: 'submitted',
        ok: true,
        provider: sanitizeTemplate(provider),
      });
    } catch (error) {
      results.push({
        contractId,
        action: 'submit_failed',
        ok: false,
        providerError: sanitizeProviderError(error),
      });
    }
  }

  return {
    ok: results.every((result) => result.ok === true),
    reason: results.every((result) => result.ok === true) ? null : 'one_or_more_template_actions_failed',
    templates: results,
  };
}

async function runMetaProviderReconnect({
  env = process.env,
  http = axios,
  fetchTemplates = fetchAllTemplates,
  bindings = META_TEMPLATE_BINDINGS,
  getContract = getShilohMessageContract,
  buildPayload = buildMetaTemplateRegistrationPayload,
} = {}) {
  const wabaId = String(env.WHATSAPP_BUSINESS_ACCOUNT_ID || '').trim();
  if (!wabaId || !String(env.WHATSAPP_TOKEN || '').trim()) {
    return {
      ok: false,
      reason: 'provider_config_missing',
      subscription: null,
      templateProvisioning: null,
    };
  }

  const subscription = await ensureAppSubscription({ wabaId, env, http });
  const templateProvisioning = await submitMissingCurrentTemplates({
    wabaId,
    env,
    http,
    fetchTemplates,
    bindings,
    getContract,
    buildPayload,
  });

  return {
    ok: subscription.ok === true && templateProvisioning.ok === true,
    reason: subscription.ok === true && templateProvisioning.ok === true
      ? null
      : 'provider_reconnect_incomplete',
    wabaId,
    subscription,
    templateProvisioning,
  };
}

module.exports = {
  GRAPH_VERSION,
  DEFAULT_APP_NAME,
  graphUrl,
  sanitizeProviderError,
  currentSendableBindings,
  listSubscribedApps,
  ensureAppSubscription,
  submitMissingCurrentTemplates,
  runMetaProviderReconnect,
};
