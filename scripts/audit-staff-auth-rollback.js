require('dotenv').config();
const { pool } = require('../src/db/pool');
const { createProviderIndependentStaffAuthService } = require('../src/services/providerIndependentStaffAuth');

function option(name) {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find((argument) => argument.startsWith(prefix));
  return value ? value.slice(prefix.length).trim() : '';
}

async function main() {
  const operatorReference = option('operator');
  const controlReference = option('control-reference');
  const reason = option('reason') || 'provider_independent_auth_disabled';
  if (!operatorReference || !controlReference) {
    throw new Error('Usage: --operator=<actual 40 operator> --control-reference=<00 authorization> [--reason=<controlled reason>]');
  }
  const service = createProviderIndependentStaffAuthService({ db: pool });
  const result = await service.recordRollback({ operatorReference, controlReference, reason });
  if (!result.ok) throw new Error(result.code);
  console.log(JSON.stringify({ event: 'staff_auth_rollback_audited', controlReference }));
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(JSON.stringify({ event: 'staff_auth_rollback_audit_failed', message: error.message }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
