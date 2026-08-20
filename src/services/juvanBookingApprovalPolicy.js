const { pool } = require('../db/pool');
const { applyMigrationFile } = require('./migrations');
const {
  DEMO_KEY,
  POLICY_KEY,
  EXPECTED_DISPLAY_NAME,
  resolveCurrentControlledDemoClient,
} = require('./controlledDemoIdentity');

const BASE_MIGRATION = '065_juvan_botha_jp_booking_approval.sql';
const IDENTITY_MIGRATION = '066_controlled_juvan_demo_identity.sql';
const REBIND_MIGRATION = '067_controlled_juvan_registration_rebind.sql';
const EXPECTED_APPROVER_NAME = 'Jean-Pierre';

async function ensureJuvanBookingApprovalPolicy() {
  const baseMigration = await applyMigrationFile(BASE_MIGRATION);
  const identityMigration = await applyMigrationFile(IDENTITY_MIGRATION);
  const rebindMigration = await applyMigrationFile(REBIND_MIGRATION);

  const result = await pool.query(`
    SELECT d.demo_key,
           d.normalized_phone,
           d.current_client_id,
           d.expected_display_name,
           d.active AS demo_active,
           p.client_id AS policy_client_id,
           p.approver_admin_id,
           p.active AS policy_active,
           saa.display_name AS approver_name,
           saa.active AS approver_active,
           saa.business_role,
           saa.calendar_scope,
           saa.service_scope,
           (saa.normalized_whatsapp IS NOT NULL) AS approver_whatsapp_configured
      FROM controlled_demo_identities d
      JOIN client_booking_approval_policies p
        ON p.policy_key=$2
      JOIN staff_admin_accounts saa
        ON saa.id=p.approver_admin_id
     WHERE d.demo_key=$1
       AND d.active=TRUE
  `, [DEMO_KEY, POLICY_KEY]);

  if (result.rowCount !== 1) {
    throw new Error('Controlled Juvan demo identity verification failed: expected one identity and approval policy');
  }

  const row = result.rows[0];
  const state = await resolveCurrentControlledDemoClient(pool);
  if (!['bound', 'unbound'].includes(state.status)) {
    throw new Error(`Controlled Juvan demo identity verification failed: ${state.status}`);
  }

  const pointerAligned = state.status === 'bound'
    ? String(row.current_client_id || '') === String(row.policy_client_id || '')
      && String(row.current_client_id || '') === String(state.client?.id || '')
    : row.current_client_id == null && row.policy_client_id == null;

  const valid = row.demo_active === true
    && row.policy_active === true
    && pointerAligned
    && /^\d+$/.test(String(row.normalized_phone || ''))
    && String(row.expected_display_name || '').trim().toLowerCase() === EXPECTED_DISPLAY_NAME.toLowerCase()
    && row.approver_active === true
    && row.approver_whatsapp_configured === true
    && String(row.approver_name || '').trim().toLowerCase() === EXPECTED_APPROVER_NAME.toLowerCase()
    && row.business_role === 'business_admin'
    && row.calendar_scope === 'all_business'
    && row.service_scope === 'all_services';

  if (!valid) {
    throw new Error('Controlled Juvan demo identity verification failed: identity, policy, or Jean-Pierre authority drifted');
  }

  return {
    initialized: true,
    migrations: [
      { filename: BASE_MIGRATION, applied: baseMigration.applied === true, checksumVerified: baseMigration.checksumVerified === true },
      { filename: IDENTITY_MIGRATION, applied: identityMigration.applied === true, checksumVerified: identityMigration.checksumVerified === true },
      { filename: REBIND_MIGRATION, applied: rebindMigration.applied === true, checksumVerified: rebindMigration.checksumVerified === true },
    ],
    demoKey: DEMO_KEY,
    bindingState: state.status,
    currentClientId: state.client?.id ? String(state.client.id) : null,
    currentDisplayName: state.client?.display_name || null,
    phoneSuffix: String(row.normalized_phone).slice(-4),
    approverAdminId: String(row.approver_admin_id),
    approverName: EXPECTED_APPROVER_NAME,
    approverWhatsAppConfigured: true,
  };
}

module.exports = {
  BASE_MIGRATION,
  IDENTITY_MIGRATION,
  REBIND_MIGRATION,
  POLICY_KEY,
  EXPECTED_CLIENT_NAME: EXPECTED_DISPLAY_NAME,
  EXPECTED_APPROVER_NAME,
  ensureJuvanBookingApprovalPolicy,
};
