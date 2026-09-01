const logger = require('../lib/logger');
const { runMetaProviderReconnect } = require('../services/metaProviderReconnect');

const RECONNECT_FLAG = 'META_PROVIDER_RECONNECT_ON_START';

function enabled(env = process.env) {
  return String(env[RECONNECT_FLAG] || '').trim().toLowerCase() === 'true';
}

async function runMetaProviderReconnectBootstrap({
  env = process.env,
  log = logger,
  reconnect = runMetaProviderReconnect,
} = {}) {
  if (!enabled(env)) return { skipped: true };
  try {
    const result = await reconnect({ env });
    const templateResults = result?.templateProvisioning?.templates || [];
    const fields = {
      ok: result?.ok === true,
      reason: result?.reason || null,
      wabaId: result?.wabaId || null,
      subscription: result?.subscription ? {
        ok: result.subscription.ok === true,
        action: result.subscription.action || null,
        expectedAppName: result.subscription.expectedAppName || null,
        app: result.subscription.app || null,
        reason: result.subscription.reason || null,
        providerError: result.subscription.providerError || null,
      } : null,
      templates: {
        total: templateResults.length,
        submitted: templateResults.filter((item) => item.action === 'submitted').map((item) => item.contractId),
        skippedExisting: templateResults.filter((item) => item.action === 'skipped_existing').map((item) => item.contractId),
        failed: templateResults.filter((item) => item.ok !== true).map((item) => ({
          contractId: item.contractId,
          action: item.action,
          reason: item.reason || null,
          providerError: item.providerError || null,
        })),
      },
    };
    log[result?.ok ? 'info' : 'warn'](fields, 'Sanitized Meta provider reconnect completed');
    return { skipped: false, ...result };
  } catch (error) {
    log.warn(
      { errorType: String(error?.name || 'Error').slice(0, 60) },
      'Meta provider reconnect failed closed',
    );
    return { skipped: false, ok: false, reason: 'provider_reconnect_failed_closed' };
  }
}

if (require.main !== module) {
  runMetaProviderReconnectBootstrap().catch((error) => {
    logger.warn(
      { errorType: String(error?.name || 'Error').slice(0, 60) },
      'Meta provider reconnect bootstrap failed closed',
    );
  });
}

module.exports = {
  RECONNECT_FLAG,
  enabled,
  runMetaProviderReconnectBootstrap,
};
