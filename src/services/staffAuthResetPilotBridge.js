const { pool } = require('../db/pool');
const {
  PILOT_IDS_FLAG,
  isProviderIndependentAuthEnabled,
  parsePilotAdminIds,
} = require('./providerIndependentStaffAuth');

function sortedAdminIds(values) {
  return [...values].map(Number).filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
}

async function reconcileStaffAuthResetPilotEligibility({ db = pool, env = process.env } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('staff auth pilot bridge db is required');

  if (!isProviderIndependentAuthEnabled(env)) {
    return {
      enabled: false,
      staticPilotCount: 0,
      resetPrincipalCount: 0,
      effectivePilotCount: 0,
      addedResetPrincipalCount: 0,
    };
  }

  const staticPilots = parsePilotAdminIds(env);
  if (!staticPilots.valid) {
    const error = new Error('Provider-independent staff auth pilot configuration is invalid.');
    error.code = 'STAFF_TOTP_PILOT_CONFIGURATION_INVALID';
    throw error;
  }

  const resetPrincipals = await db.query(
    `SELECT a.id
       FROM staff_admin_accounts a
       LEFT JOIN staff s ON s.id = a.staff_id
      WHERE a.active = TRUE
        AND (a.staff_id IS NULL OR s.status = 'active')
        AND COALESCE(a.permissions, '{}'::jsonb) @> '{"staff_auth:reset":true}'::jsonb
      ORDER BY a.id`
  );

  const resetIds = sortedAdminIds(resetPrincipals.rows.map((row) => row.id));
  const effectiveIds = new Set(staticPilots.ids);
  for (const id of resetIds) effectiveIds.add(id);

  const effective = sortedAdminIds(effectiveIds);
  env[PILOT_IDS_FLAG] = effective.join(',');

  return {
    enabled: true,
    staticPilotCount: staticPilots.ids.size,
    resetPrincipalCount: resetIds.length,
    effectivePilotCount: effective.length,
    addedResetPrincipalCount: effective.length - staticPilots.ids.size,
  };
}

module.exports = {
  sortedAdminIds,
  reconcileStaffAuthResetPilotEligibility,
};
