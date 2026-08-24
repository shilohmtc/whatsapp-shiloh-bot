const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');
const { sanitizeProviderText } = require('./whatsappStatusCallback');

const GRAPH_VERSION = 'v23.0';
const REQUIRED_TEMPLATE_SCOPE = 'whatsapp_business_management';
const TEMPLATE_MANAGEMENT_TASKS = new Set(['MANAGE', 'MANAGE_TEMPLATES']);

function graphUrl(path) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${String(path).replace(/^\//, '')}`;
}

function sanitizeDiagnosticText(value, maxLength = 180) {
  const base = sanitizeProviderText(value, maxLength);
  if (!base) return null;
  return base
    .replace(/\b\d{8,25}\b/g, '[REDACTED_ID]')
    .replace(/\b[A-Za-z0-9_-]{30,}\b/g, '[REDACTED_SECRET_OR_ID]')
    .slice(0, maxLength);
}

function sanitizeGraphError(error) {
  const provider = error?.response?.data?.error || {};
  return {
    httpStatus: error?.response?.status || null,
    code: sanitizeDiagnosticText(provider.code, 40),
    subcode: sanitizeDiagnosticText(provider.error_subcode, 40),
    type: sanitizeDiagnosticText(provider.type, 80),
    message: sanitizeDiagnosticText(provider.message, 180),
  };
}

function makeGraphClient({ env = process.env, get = axios.get.bind(axios) } = {}) {
  const token = env.WHATSAPP_TOKEN;
  if (!token) throw new Error('WHATSAPP_TOKEN is not configured');
  return async function graphGet(path, params = {}) {
    try {
      const response = await get(graphUrl(path), {
        headers: { Authorization: `Bearer ${token}` },
        params,
        timeout: 15000,
      });
      return { ok: true, data: response?.data || {} };
    } catch (error) {
      return { ok: false, error: sanitizeGraphError(error) };
    }
  };
}

function summarizePermissions(data) {
  const rows = Array.isArray(data?.data) ? data.data : [];
  const granted = rows
    .filter((row) => String(row?.status || '').toLowerCase() === 'granted')
    .map((row) => String(row?.permission || '').trim())
    .filter(Boolean);
  return {
    querySucceeded: true,
    whatsappBusinessManagementGranted: granted.includes('whatsapp_business_management'),
    whatsappBusinessMessagingGranted: granted.includes('whatsapp_business_messaging'),
    businessManagementGranted: granted.includes('business_management'),
  };
}

function summarizeDebugToken(data, wabaId) {
  const debug = data?.data || {};
  const scopes = Array.isArray(debug.scopes) ? debug.scopes.map(String) : [];
  const granular = Array.isArray(debug.granular_scopes) ? debug.granular_scopes : [];
  const managementGranular = granular.find((row) => String(row?.scope || '') === REQUIRED_TEMPLATE_SCOPE) || null;
  const targets = Array.isArray(managementGranular?.target_ids) ? managementGranular.target_ids.map(String) : [];
  return {
    querySucceeded: true,
    isValid: debug.is_valid === true,
    tokenType: sanitizeDiagnosticText(debug.type, 40),
    whatsappBusinessManagementScope: scopes.includes(REQUIRED_TEMPLATE_SCOPE),
    whatsappBusinessMessagingScope: scopes.includes('whatsapp_business_messaging'),
    businessManagementScope: scopes.includes('business_management'),
    granularWhatsappBusinessManagementPresent: Boolean(managementGranular),
    granularWabaTargetPresent: targets.includes(String(wabaId)),
    principalId: debug.user_id ? String(debug.user_id) : null,
  };
}

function summarizeHealthStatus(value) {
  if (value == null) return { present: false, canSendMessage: null, entities: [] };
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { present: true, canSendMessage: sanitizeDiagnosticText(value, 60), entities: [] };
  }
  const entities = Array.isArray(value.entities) ? value.entities.map((entity) => ({
    entityType: sanitizeDiagnosticText(entity?.entity_type, 60),
    canSendMessage: sanitizeDiagnosticText(entity?.can_send_message, 60),
  })) : [];
  return {
    present: true,
    canSendMessage: sanitizeDiagnosticText(value.can_send_message, 60),
    entities,
  };
}

function summarizeWaba(data, tokenBusinessIds) {
  const ownerId = data?.owner_business?.id || data?.owner_business;
  return {
    querySucceeded: true,
    accountReviewStatus: sanitizeDiagnosticText(data?.account_review_status, 60),
    businessVerificationStatus: sanitizeDiagnosticText(data?.business_verification_status, 60),
    status: sanitizeDiagnosticText(data?.status, 60),
    ownershipType: sanitizeDiagnosticText(data?.ownership_type, 60),
    ownerBusinessPresent: Boolean(ownerId),
    ownerBusinessMatchesTokenBusinessContext: ownerId ? tokenBusinessIds.includes(String(ownerId)) : null,
    onBehalfOfBusinessPresent: Boolean(data?.on_behalf_of_business_info),
    sharedWithPartners: data?.is_shared_with_partners === true,
    healthStatus: summarizeHealthStatus(data?.health_status),
  };
}

function summarizeAssignedUsers(data, principalId) {
  const rows = Array.isArray(data?.data) ? data.data : [];
  const principal = principalId
    ? rows.find((row) => String(row?.id || row?.user?.id || '') === String(principalId))
    : null;
  const tasks = Array.isArray(principal?.tasks) ? principal.tasks.map((task) => String(task).toUpperCase()) : [];
  return {
    querySucceeded: true,
    assignedUserCount: rows.length,
    currentTokenPrincipalAssigned: Boolean(principal),
    currentPrincipalTasks: tasks,
    currentPrincipalCanManageTemplates: tasks.some((task) => TEMPLATE_MANAGEMENT_TASKS.has(task)),
  };
}

function summarizeSystemUsers(data, principalId) {
  const rows = Array.isArray(data?.data) ? data.data : [];
  const principal = principalId ? rows.find((row) => String(row?.id || '') === String(principalId)) : null;
  return {
    querySucceeded: true,
    systemUserCount: rows.length,
    currentTokenPrincipalIsSystemUser: Boolean(principal),
    currentPrincipalSystemUserRole: sanitizeDiagnosticText(principal?.role, 60),
  };
}

async function discoverBusinessContext(graphGet) {
  const ids = [];
  const me = await graphGet('me', { fields: 'id,business' });
  if (me.ok && me.data?.business?.id) ids.push(String(me.data.business.id));

  const businesses = await graphGet('me/businesses', { fields: 'id', limit: 100 });
  if (businesses.ok) {
    for (const row of businesses.data?.data || []) if (row?.id) ids.push(String(row.id));
  }
  return {
    ids: [...new Set(ids)],
    principalId: me.ok && me.data?.id ? String(me.data.id) : null,
    meQuerySucceeded: me.ok,
    businessesQuerySucceeded: businesses.ok,
  };
}

async function summarizeBusinessWabaRelationships(graphGet, businessIds, wabaId) {
  let ownedProbeSucceeded = false;
  let clientProbeSucceeded = false;
  let ownedWabaMatch = false;
  let clientWabaMatch = false;
  for (const businessId of businessIds) {
    const owned = await graphGet(`${businessId}/owned_whatsapp_business_accounts`, { fields: 'id', limit: 250 });
    if (owned.ok) {
      ownedProbeSucceeded = true;
      if ((owned.data?.data || []).some((row) => String(row?.id) === String(wabaId))) ownedWabaMatch = true;
    }
    const client = await graphGet(`${businessId}/client_whatsapp_business_accounts`, { fields: 'id', limit: 250 });
    if (client.ok) {
      clientProbeSucceeded = true;
      if ((client.data?.data || []).some((row) => String(row?.id) === String(wabaId))) clientWabaMatch = true;
    }
  }
  return {
    discoveredBusinessCount: businessIds.length,
    ownedProbeSucceeded,
    clientProbeSucceeded,
    ownedWabaMatch,
    clientWabaMatch,
  };
}

async function inspectAssignedUsers(graphGet, wabaId, businessIds, principalId) {
  let lastError = null;
  for (const businessId of businessIds) {
    const assigned = await graphGet(`${wabaId}/assigned_users`, {
      business: businessId,
      fields: 'id,tasks,user_type',
      limit: 100,
    });
    if (assigned.ok) return summarizeAssignedUsers(assigned.data, principalId);
    lastError = assigned.error;
  }
  return lastError
    ? { querySucceeded: false, error: lastError }
    : { querySucceeded: false, reason: 'business_context_unavailable' };
}

async function inspectSystemUsers(graphGet, businessIds, principalId) {
  let anySucceeded = false;
  let total = 0;
  let role = null;
  let principalFound = false;
  let lastError = null;
  for (const businessId of businessIds) {
    const users = await graphGet(`${businessId}/system_users`, { fields: 'id,role', limit: 100 });
    if (!users.ok) {
      lastError = users.error;
      continue;
    }
    anySucceeded = true;
    const summary = summarizeSystemUsers(users.data, principalId);
    total += summary.systemUserCount;
    if (summary.currentTokenPrincipalIsSystemUser) {
      principalFound = true;
      role = summary.currentPrincipalSystemUserRole;
    }
  }
  if (!anySucceeded) return lastError
    ? { querySucceeded: false, error: lastError }
    : { querySucceeded: false, reason: 'business_context_unavailable' };
  return {
    querySucceeded: true,
    systemUserCount: total,
    currentTokenPrincipalIsSystemUser: principalFound,
    currentPrincipalSystemUserRole: role,
  };
}

async function runMetaWabaTemplatePermissionAudit(options = {}) {
  const env = options.env || process.env;
  const discover = options.discoverWabaId || discoverWabaId;
  const graphGet = options.graphGet || makeGraphClient({ env, get: options.get });
  const wabaId = await discover();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered' };

  const templateList = await graphGet(`${wabaId}/message_templates`, {
    fields: 'id,name,status,category,language',
    limit: 1,
  });
  const permissions = await graphGet('me/permissions');
  const debugToken = await graphGet('debug_token', { input_token: env.WHATSAPP_TOKEN });
  const businessContext = await discoverBusinessContext(graphGet);
  const waba = await graphGet(wabaId, {
    fields: 'account_review_status,business_verification_status,status,ownership_type,owner_business,on_behalf_of_business_info,is_shared_with_partners,health_status',
  });

  const tokenBusinessIds = [...businessContext.ids];
  const ownerBusinessId = waba.ok ? (waba.data?.owner_business?.id || waba.data?.owner_business || null) : null;
  const businessIds = [...new Set([...tokenBusinessIds, ...(ownerBusinessId ? [String(ownerBusinessId)] : [])])];

  const debugSummary = debugToken.ok
    ? summarizeDebugToken(debugToken.data, wabaId)
    : { querySucceeded: false, error: debugToken.error, principalId: null };
  const principalId = debugSummary.principalId || businessContext.principalId;
  const relationships = await summarizeBusinessWabaRelationships(graphGet, businessIds, wabaId);
  const assignedUsers = await inspectAssignedUsers(graphGet, wabaId, businessIds, principalId);
  const systemUsers = await inspectSystemUsers(graphGet, businessIds, principalId);

  const permissionSummary = permissions.ok
    ? summarizePermissions(permissions.data)
    : { querySucceeded: false, error: permissions.error };
  const wabaSummary = waba.ok
    ? summarizeWaba(waba.data, tokenBusinessIds)
    : { querySucceeded: false, error: waba.error };

  const tokenEvidence = { ...debugSummary };
  delete tokenEvidence.principalId;

  const evidence = {
    templateListReadable: templateList.ok,
    templateListError: templateList.ok ? null : templateList.error,
    token: tokenEvidence,
    permissions: permissionSummary,
    businessContext: {
      meQuerySucceeded: businessContext.meQuerySucceeded,
      businessesQuerySucceeded: businessContext.businessesQuerySucceeded,
      tokenBusinessCount: tokenBusinessIds.length,
      ownerBusinessFallbackUsed: Boolean(ownerBusinessId && !tokenBusinessIds.includes(String(ownerBusinessId))),
    },
    businessRelationships: relationships,
    waba: wabaSummary,
    assignedUsers,
    systemUsers,
  };

  const managementScopeProven = permissionSummary.whatsappBusinessManagementGranted === true
    || debugSummary.whatsappBusinessManagementScope === true
    || templateList.ok;
  const assetManagementProven = assignedUsers.currentPrincipalCanManageTemplates === true;
  const wabaApproved = String(wabaSummary.accountReviewStatus || '').toUpperCase() === 'APPROVED';
  const businessVerified = String(wabaSummary.businessVerificationStatus || '').toLowerCase() === 'verified';
  const wabaReviewDeficiencyProven = wabaSummary.querySucceeded === true
    && Boolean(wabaSummary.accountReviewStatus)
    && !wabaApproved;
  const businessVerificationDeficiencyProven = wabaSummary.querySucceeded === true
    && Boolean(wabaSummary.businessVerificationStatus)
    && !businessVerified;

  return {
    ok: true,
    evidence,
    conclusion: {
      managementScopeProven,
      assetManagementProven,
      wabaApproved,
      businessVerified,
      wabaReviewDeficiencyProven,
      businessVerificationDeficiencyProven,
      localPermissionDeficiencyProven: managementScopeProven && assignedUsers.querySucceeded && !assetManagementProven,
      providerWabaRestrictionIndicated: managementScopeProven && assetManagementProven && wabaApproved && businessVerified,
    },
  };
}

module.exports = {
  REQUIRED_TEMPLATE_SCOPE,
  TEMPLATE_MANAGEMENT_TASKS,
  sanitizeDiagnosticText,
  sanitizeGraphError,
  makeGraphClient,
  summarizePermissions,
  summarizeDebugToken,
  summarizeHealthStatus,
  summarizeWaba,
  summarizeAssignedUsers,
  summarizeSystemUsers,
  runMetaWabaTemplatePermissionAudit,
};
