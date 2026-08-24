const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');
const { sanitizeProviderText } = require('./whatsappStatusCallback');
const {
  STAFF_AUTH_TEMPLATE_NAME,
  STAFF_AUTH_TEMPLATE_LANGUAGE,
  STAFF_AUTH_TEMPLATE_CATEGORY,
  buildStaffAuthTemplateSubmissionDefinition,
} = require('./staffAuthTemplateDefinition');

const GRAPH_VERSION = 'v23.0';

function summarizeExactTemplate(providers = []) {
  const matches = providers.filter((provider) => (
    provider?.name === STAFF_AUTH_TEMPLATE_NAME
    && provider?.language === STAFF_AUTH_TEMPLATE_LANGUAGE
  ));
  const first = matches[0] || null;
  return {
    exists: Boolean(first),
    status: first?.status || null,
    category: first?.category || null,
    language: first?.language || null,
    duplicateCount: Math.max(matches.length - 1, 0),
  };
}

async function inspectStaffAuthTemplateInventory(options = {}) {
  const discover = options.discoverWabaId || discoverWabaId;
  const fetchTemplates = options.fetchTemplates || require('./metaTemplateContracts').fetchAllTemplates;
  const wabaId = await discover();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered', authenticationTemplateCount: 0, exactTemplate: summarizeExactTemplate([]) };
  const providers = await fetchTemplates(wabaId);
  const authenticationTemplates = providers.filter((provider) => String(provider?.category || '').toUpperCase() === STAFF_AUTH_TEMPLATE_CATEGORY);
  return {
    ok: true,
    authenticationTemplateCount: authenticationTemplates.length,
    exactTemplate: summarizeExactTemplate(providers),
  };
}

function sanitizedSubmissionFailure(error) {
  const provider = error?.response?.data?.error || {};
  return {
    status: error?.response?.status || null,
    providerCode: sanitizeProviderText(provider.code, 60),
    providerTitle: sanitizeProviderText(provider.error_user_title || provider.type, 120),
    providerMessage: sanitizeProviderText(provider.error_user_msg || provider.message, 180),
  };
}

async function submitStaffAuthTemplateIfAbsent(options = {}) {
  const env = options.env || process.env;
  const discover = options.discoverWabaId || discoverWabaId;
  const fetchTemplates = options.fetchTemplates || require('./metaTemplateContracts').fetchAllTemplates;
  const post = options.post || axios.post.bind(axios);
  if (!env.WHATSAPP_TOKEN) return { ok: false, reason: 'provider_token_unavailable' };

  const wabaId = await discover();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered' };
  const providers = await fetchTemplates(wabaId);
  const exactTemplate = summarizeExactTemplate(providers);
  if (exactTemplate.exists) return { ok: true, submitted: false, reason: 'exact_identity_already_exists', exactTemplate };

  try {
    const response = await post(
      `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/message_templates`,
      buildStaffAuthTemplateSubmissionDefinition(),
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    return {
      ok: true,
      submitted: true,
      status: response?.data?.status || null,
      category: response?.data?.category || null,
    };
  } catch (error) {
    return { ok: false, reason: 'provider_rejected_submission', provider: sanitizedSubmissionFailure(error) };
  }
}

module.exports = {
  summarizeExactTemplate,
  inspectStaffAuthTemplateInventory,
  sanitizedSubmissionFailure,
  submitStaffAuthTemplateIfAbsent,
};
