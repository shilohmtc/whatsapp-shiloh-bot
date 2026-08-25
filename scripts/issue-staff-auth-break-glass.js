require('dotenv').config();
const { pool } = require('../src/db/pool');
const { createProviderIndependentStaffAuthService } = require('../src/services/providerIndependentStaffAuth');

function option(name) {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find((argument) => argument.startsWith(prefix));
  return value ? value.slice(prefix.length).trim() : '';
}

async function main() {
  if (!process.stdout.isTTY) {
    throw new Error('Break-glass issuance requires an interactive secure terminal; redirected or captured output is forbidden');
  }
  const adminId = Number(option('admin-id'));
  const operatorReference = option('operator');
  const controlReference = option('control-reference');
  if (!Number.isSafeInteger(adminId) || adminId <= 0 || !operatorReference || !controlReference) {
    throw new Error('Usage: --admin-id=<immutable ID> --operator=<actual 40 operator> --control-reference=<00 authorization>');
  }
  const service = createProviderIndependentStaffAuthService({ db: pool });
  const result = await service.issueBreakGlass({ adminId, operatorReference, controlReference });
  if (!result.ok) throw new Error(result.code);
  const handoff = result.url || result.token;
  process.stdout.write(`Controlled recovery handoff (shown once; expires ${new Date(result.expiresAt).toISOString()}):\n${handoff}\n`);
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(JSON.stringify({ event: 'staff_auth_break_glass_issue_failed', message: error.message }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
