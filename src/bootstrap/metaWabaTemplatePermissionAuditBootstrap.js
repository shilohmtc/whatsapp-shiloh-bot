const logger = require('../lib/logger');
const { runMetaWabaTemplatePermissionAudit } = require('../services/metaWabaTemplatePermissionAudit');

const AUDIT_FLAG = 'META_WABA_TEMPLATE_PERMISSION_AUDIT_ON_START';

function enabled(env = process.env) {
  return String(env[AUDIT_FLAG] || '').trim().toLowerCase() === 'true';
}

async function runMetaWabaTemplatePermissionAuditBootstrap({ env = process.env, log = logger, audit = runMetaWabaTemplatePermissionAudit } = {}) {
  if (!enabled(env)) return { skipped: true };
  try {
    const result = await audit({ env });
    const fields = {
      ok: result?.ok === true,
      reason: result?.reason || null,
      evidence: result?.evidence || null,
      conclusion: result?.conclusion || null,
    };
    log[result?.ok ? 'info' : 'warn'](fields, 'Sanitized Meta WABA template permission audit completed');
    return { skipped: false, ...result };
  } catch (error) {
    log.warn({ errorType: String(error?.name || 'Error').slice(0, 60) }, 'Meta WABA template permission audit failed closed');
    return { skipped: false, ok: false, reason: 'audit_failed_closed' };
  }
}

if (require.main !== module) {
  runMetaWabaTemplatePermissionAuditBootstrap().catch((error) => {
    logger.warn({ errorType: String(error?.name || 'Error').slice(0, 60) }, 'Meta WABA template permission bootstrap failed closed');
  });
}

module.exports = {
  AUDIT_FLAG,
  enabled,
  runMetaWabaTemplatePermissionAuditBootstrap,
};
