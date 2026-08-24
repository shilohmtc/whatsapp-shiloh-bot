const logger = require('../lib/logger');
const {
  inspectStaffAuthTemplateInventory,
  submitStaffAuthTemplateIfAbsent,
} = require('../services/staffAuthTemplateProvisioning');

const AUDIT_FLAG = 'META_STAFF_AUTH_TEMPLATE_AUDIT_ON_START';
const PROVISION_FLAG = 'META_STAFF_AUTH_TEMPLATE_PROVISION_ON_START';

function enabled(name, env = process.env) {
  return String(env[name] || '').trim().toLowerCase() === 'true';
}

async function runStaffAuthTemplateBootstrap({ env = process.env, log = logger } = {}) {
  if (!enabled(AUDIT_FLAG, env) && !enabled(PROVISION_FLAG, env)) return { skipped: true };

  const before = await inspectStaffAuthTemplateInventory();
  log.info({
    ok: before?.ok === true,
    reason: before?.reason || null,
    authenticationTemplateCount: before?.authenticationTemplateCount ?? null,
    exactTemplate: before?.exactTemplate || null,
  }, 'Sanitized staff authentication WhatsApp template inventory checked');

  if (!enabled(PROVISION_FLAG, env)) return { skipped: false, inspected: true, before };
  if (!before?.ok) {
    log.warn({ reason: before?.reason || 'inventory_unavailable' }, 'Staff authentication WhatsApp template submission blocked by provider inventory gate');
    return { skipped: false, inspected: true, submitted: false, reason: before?.reason || 'inventory_unavailable' };
  }
  if (before?.exactTemplate?.exists) {
    log.info({ exactTemplate: before.exactTemplate }, 'Staff authentication WhatsApp template submission not required');
    return { skipped: false, inspected: true, submitted: false, reason: 'exact_identity_already_exists' };
  }

  const result = await submitStaffAuthTemplateIfAbsent();
  const fields = {
    ok: result?.ok === true,
    submitted: result?.submitted === true,
    reason: result?.reason || null,
    status: result?.status || null,
    category: result?.category || null,
  };
  if (result?.provider) fields.provider = result.provider;
  log[result?.ok ? 'info' : 'warn'](fields, 'Staff authentication WhatsApp template controlled submission checked');
  return { skipped: false, inspected: true, ...result };
}

if (require.main !== module) {
  runStaffAuthTemplateBootstrap().catch((error) => {
    logger.warn({ errorType: String(error?.name || 'Error').slice(0, 60) }, 'Staff authentication WhatsApp template bootstrap failed closed');
  });
}

module.exports = {
  AUDIT_FLAG,
  PROVISION_FLAG,
  enabled,
  runStaffAuthTemplateBootstrap,
};
