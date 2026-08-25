const logger = require('../lib/logger');
const { pool } = require('../db/pool');
const { createCalendarOperationalService } = require('../services/calendarOperationalMutations');

const DEFAULT_INTERVAL_MS = 60_000;
const INITIAL_DELAY_MS = 5_000;

function workerEnabled(env = process.env) {
  return String(env.SHILOH_CALENDAR_PROVIDER_SYNC_WORKER_ENABLED || '').trim().toLowerCase() !== 'false';
}

function workerIntervalMs(env = process.env) {
  const requested = Number(env.SHILOH_CALENDAR_PROVIDER_SYNC_INTERVAL_MS);
  if (!Number.isFinite(requested)) return DEFAULT_INTERVAL_MS;
  return Math.max(15_000, Math.min(Math.floor(requested), 300_000));
}

function startCalendarProviderSyncRecovery({
  env = process.env,
  service = createCalendarOperationalService({ db: pool, env }),
  log = logger,
  setIntervalFn = setInterval,
  setTimeoutFn = setTimeout,
  clearIntervalFn = clearInterval,
  clearTimeoutFn = clearTimeout,
} = {}) {
  if (!workerEnabled(env)) return { enabled: false, runNow: async () => ({ skipped: true }), stop: () => {} };

  let inFlight = false;
  let stopped = false;
  let intervalHandle = null;
  let initialHandle = null;

  async function runNow() {
    if (stopped || inFlight) return { skipped: true, reason: stopped ? 'stopped' : 'in_flight' };
    inFlight = true;
    try {
      const result = await service.processDueProviderSyncJobs({ limit: 25 });
      if (Number(result?.processedMutations || 0) > 0) {
        const failedJobs = (result.outcomes || []).reduce(
          (count, item) => count + (item.outcomes || []).filter((job) => job.status === 'failed').length,
          0
        );
        log[failedJobs ? 'warn' : 'info'](
          { processedMutations: Number(result.processedMutations || 0), failedJobs },
          'Shiloh Calendar provider synchronization recovery pass completed'
        );
      }
      return result;
    } catch (error) {
      log.warn({ errorType: String(error?.name || 'Error').slice(0, 60) }, 'Shiloh Calendar provider synchronization recovery pass failed safely');
      return { processedMutations: 0, failed: true };
    } finally {
      inFlight = false;
    }
  }

  initialHandle = setTimeoutFn(() => { runNow(); }, INITIAL_DELAY_MS);
  intervalHandle = setIntervalFn(() => { runNow(); }, workerIntervalMs(env));
  if (typeof initialHandle?.unref === 'function') initialHandle.unref();
  if (typeof intervalHandle?.unref === 'function') intervalHandle.unref();

  function stop() {
    stopped = true;
    if (initialHandle) clearTimeoutFn(initialHandle);
    if (intervalHandle) clearIntervalFn(intervalHandle);
    initialHandle = null;
    intervalHandle = null;
  }

  return { enabled: true, runNow, stop };
}

if (require.main !== module) startCalendarProviderSyncRecovery();

module.exports = {
  DEFAULT_INTERVAL_MS,
  INITIAL_DELAY_MS,
  workerEnabled,
  workerIntervalMs,
  startCalendarProviderSyncRecovery,
};
