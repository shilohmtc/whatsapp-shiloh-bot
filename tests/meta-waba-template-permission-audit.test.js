const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  sanitizeDiagnosticText,
  runMetaWabaTemplatePermissionAudit,
} = require('../src/services/metaWabaTemplatePermissionAudit');
const {
  AUDIT_FLAG,
  runMetaWabaTemplatePermissionAuditBootstrap,
} = require('../src/bootstrap/metaWabaTemplatePermissionAuditBootstrap');

function providerRestrictionGraph() {
  return async (pathName) => {
    if (pathName === 'waba-123/message_templates') return { ok: true, data: { data: [{ id: 'template-1' }] } };
    if (pathName === 'me/permissions') return { ok: true, data: { data: [
      { permission: 'whatsapp_business_management', status: 'granted' },
      { permission: 'whatsapp_business_messaging', status: 'granted' },
      { permission: 'business_management', status: 'granted' },
    ] } };
    if (pathName === 'debug_token') return { ok: true, data: { data: {
      is_valid: true,
      type: 'SYSTEM_USER',
      user_id: '9988776655443322',
      scopes: ['whatsapp_business_management', 'whatsapp_business_messaging', 'business_management'],
      granular_scopes: [{ scope: 'whatsapp_business_management', target_ids: ['waba-123'] }],
    } } };
    if (pathName === 'me') return { ok: true, data: { business: { id: 'biz-456' } } };
    if (pathName === 'me/businesses') return { ok: true, data: { data: [{ id: 'biz-456' }] } };
    if (pathName === 'biz-456/owned_whatsapp_business_accounts') return { ok: true, data: { data: [{ id: 'waba-123' }] } };
    if (pathName === 'biz-456/client_whatsapp_business_accounts') return { ok: true, data: { data: [] } };
    if (pathName === 'waba-123') return { ok: true, data: {
      account_review_status: 'APPROVED',
      business_verification_status: 'verified',
      status: 'ACTIVE',
      ownership_type: 'BUSINESS_OWNED',
      owner_business: { id: 'biz-456' },
      health_status: { can_send_message: 'AVAILABLE' },
    } };
    if (pathName === 'waba-123/assigned_users') return { ok: true, data: { data: [
      { id: '9988776655443322', user_type: 'SYSTEM_USER', tasks: ['MANAGE_TEMPLATES'] },
    ] } };
    throw new Error(`unexpected path ${pathName}`);
  };
}

test('audit proves adequate token scope asset task ownership and healthy WABA without exposing identifiers', async () => {
  const token = 'EAAabcdefghijklmnopqrstuvwxyz1234567890';
  const result = await runMetaWabaTemplatePermissionAudit({
    env: { WHATSAPP_TOKEN: token },
    discoverWabaId: async () => 'waba-123',
    graphGet: providerRestrictionGraph(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.evidence.templateListReadable, true);
  assert.equal(result.evidence.permissions.whatsappBusinessManagementGranted, true);
  assert.equal(result.evidence.token.isValid, true);
  assert.equal(result.evidence.token.whatsappBusinessManagementScope, true);
  assert.equal(result.evidence.token.granularWabaTargetPresent, true);
  assert.equal(result.evidence.businessRelationships.ownedWabaMatch, true);
  assert.equal(result.evidence.businessRelationships.clientWabaMatch, false);
  assert.equal(result.evidence.waba.accountReviewStatus, 'APPROVED');
  assert.equal(result.evidence.waba.businessVerificationStatus, 'verified');
  assert.equal(result.evidence.waba.ownerBusinessMatchesDiscoveredBusiness, true);
  assert.equal(result.evidence.assignedUsers.currentTokenPrincipalAssigned, true);
  assert.equal(result.evidence.assignedUsers.currentPrincipalCanManageTemplates, true);
  assert.equal(result.conclusion.providerWabaRestrictionIndicated, true);
  assert.equal(result.conclusion.localPermissionDeficiencyProven, false);

  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /9988776655443322/);
  assert.doesNotMatch(serialized, /biz-456/);
  assert.doesNotMatch(serialized, /waba-123/);
  assert.doesNotMatch(serialized, /EAAabcdefghijklmnopqrstuvwxyz1234567890/);
});

test('audit identifies assigned-user template-management deficiency when proven', async () => {
  const graphGet = providerRestrictionGraph();
  const wrapped = async (pathName, params) => {
    if (pathName === 'waba-123/assigned_users') return { ok: true, data: { data: [
      { id: '9988776655443322', user_type: 'SYSTEM_USER', tasks: ['VIEW_TEMPLATES'] },
    ] } };
    return graphGet(pathName, params);
  };
  const result = await runMetaWabaTemplatePermissionAudit({
    env: { WHATSAPP_TOKEN: 'provider-secret' },
    discoverWabaId: async () => 'waba-123',
    graphGet: wrapped,
  });
  assert.equal(result.conclusion.managementScopeProven, true);
  assert.equal(result.conclusion.assetManagementProven, false);
  assert.equal(result.conclusion.localPermissionDeficiencyProven, true);
  assert.equal(result.conclusion.providerWabaRestrictionIndicated, false);
});

test('diagnostic sanitizer removes phone token long IDs and challenge material', () => {
  const input = 'Bearer EAAabcdefghijklmnopqrstuvwxyz1234567890 phone +27821234567 id 9988776655443322 code ABCDEFGHJK';
  const output = sanitizeDiagnosticText(input, 300);
  assert.doesNotMatch(output, /27821234567/);
  assert.doesNotMatch(output, /EAAabcdefghijklmnopqrstuvwxyz1234567890/);
  assert.doesNotMatch(output, /9988776655443322/);
  assert.doesNotMatch(output, /ABCDEFGHJK/);
});

test('runtime audit is fail-closed and disabled unless its exact one-shot flag is true', async () => {
  let calls = 0;
  const disabled = await runMetaWabaTemplatePermissionAuditBootstrap({
    env: {},
    audit: async () => { calls += 1; return { ok: true }; },
    log: { info() {}, warn() {} },
  });
  assert.deepEqual(disabled, { skipped: true });
  assert.equal(calls, 0);

  const enabled = await runMetaWabaTemplatePermissionAuditBootstrap({
    env: { [AUDIT_FLAG]: 'true' },
    audit: async () => { calls += 1; return { ok: true, evidence: { safe: true }, conclusion: { safe: true } }; },
    log: { info() {}, warn() {} },
  });
  assert.equal(enabled.skipped, false);
  assert.equal(enabled.ok, true);
  assert.equal(calls, 1);
});

test('production diagnostic implementation is GET-only and startup-wired', () => {
  const serviceSource = fs.readFileSync(path.join(__dirname, '../src/services/metaWabaTemplatePermissionAudit.js'), 'utf8');
  const packageSource = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8');
  assert.doesNotMatch(serviceSource, /axios\.post|\.post\s*\(/);
  assert.doesNotMatch(serviceSource, /message_templates[^\n]*delete/i);
  assert.match(packageSource, /metaWabaTemplatePermissionAuditBootstrap\.js/);
});
