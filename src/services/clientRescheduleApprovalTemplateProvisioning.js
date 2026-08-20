const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');
const { buildDefinition } = require('./clientLifecycleTemplateProvisioning');
const {
  CONTRACTS,
  configuredTemplateName,
  semanticComponents,
  compareContract,
  selectProviderVariant,
  fetchAllTemplates,
} = require('./metaTemplateContracts');

const GRAPH_VERSION = 'v23.0';
const TARGET_KEYS = Object.freeze(['reschedule_approval_request', 'reschedule_declined']);

function targetEntry(key) {
  if (!TARGET_KEYS.includes(key)) throw new Error(`Unsupported reschedule approval template key: ${key}`);
  const entry = CONTRACTS.find((candidate) => candidate.key === key);
  if (!entry) throw new Error(`Missing Meta contract for reschedule approval template key: ${key}`);
  return entry;
}

function graphConfig() {
  return {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  };
}

function sanitizedState(entry, providers) {
  const { provider, duplicateCount } = selectProviderVariant(providers, entry);
  const configuredName = configuredTemplateName(entry);
  const contract = provider ? compareContract(entry, provider) : null;
  return {
    key: entry.key,
    templateName: entry.contract.name,
    configuredName,
    configured: configuredName === entry.contract.name,
    provider: {
      exists: Boolean(provider),
      status: provider?.status || null,
      category: provider?.category || null,
      language: provider?.language || null,
      duplicateCount,
      components: provider ? semanticComponents(provider.components) : null,
    },
    contract,
    ready: Boolean(
      configuredName === entry.contract.name
      && duplicateCount === 0
      && provider?.status === 'APPROVED'
      && contract?.exact
    ),
  };
}

async function loadProviderState() {
  const wabaId = await discoverWabaId();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered', wabaId: null, templates: [] };
  const providers = await fetchAllTemplates(wabaId);
  const templates = TARGET_KEYS.map((key) => sanitizedState(targetEntry(key), providers));
  return { ok: true, wabaId, templates };
}

async function inspectRescheduleApprovalTemplates() {
  const state = await loadProviderState();
  return { ok: state.ok, reason: state.reason || null, templates: state.templates };
}

function graphUrl(wabaId) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/message_templates`;
}

async function submitOneIfAbsent(key) {
  const entry = targetEntry(key);
  const before = await loadProviderState();
  if (!before.ok) return { ok: false, key, templateName: entry.contract.name, submitted: false, reason: before.reason, template: null };
  const existing = before.templates.find((item) => item.key === key);
  if (existing.provider.duplicateCount > 0) {
    return { ok: true, key, templateName: entry.contract.name, submitted: false, reason: 'duplicate_variants_present', template: existing };
  }
  if (existing.provider.exists) {
    return {
      ok: true,
      key,
      templateName: entry.contract.name,
      submitted: false,
      reason: existing.contract?.exact ? 'already_exists_exact' : 'existing_contract_mismatch',
      template: existing,
    };
  }

  await axios.post(graphUrl(before.wabaId), buildDefinition(key), graphConfig());
  const after = await loadProviderState();
  const readback = after.templates.find((item) => item.key === key) || null;
  return {
    ok: after.ok,
    key,
    templateName: entry.contract.name,
    submitted: true,
    reason: 'submitted',
    template: readback,
  };
}

async function provisionRescheduleApprovalTemplatesOnce() {
  const results = [];
  for (const key of TARGET_KEYS) results.push(await submitOneIfAbsent(key));
  return { ok: results.every((result) => result.ok), results };
}

module.exports = {
  TARGET_KEYS,
  inspectRescheduleApprovalTemplates,
  submitOneIfAbsent,
  provisionRescheduleApprovalTemplatesOnce,
};