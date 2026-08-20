const { pool } = require('../db/pool');
const { applyMigrationFile } = require('./migrations');

const MIGRATION = '065_juvan_botha_jp_booking_approval.sql';
const POLICY_KEY = 'juvan_botha_jp_booking_approval';
const EXPECTED_CLIENT_NAME = 'Juvan Botha';
const EXPECTED_APPROVER_NAME = 'Jean-Pierre';

async function ensureJuvanBookingApprovalPolicy() {
  const migration = await applyMigrationFile(MIGRATION);
  const result = await pool.query(`
    SELECT p.client_id,
           p.approver_admin_id,
           p.expected_display_name,
           p.active,
           c.display_name,
           c.status AS client_status,
           saa.display_name AS approver_name,
           saa.active AS approver_active,
           saa.business_role,
           saa.calendar_scope,
           saa.service_scope,
           (saa.normalized_whatsapp IS NOT NULL) AS approver_whatsapp_configured,
           (SELECT COUNT(*)::int
              FROM clients named
             WHERE named.status='active'
               AND LOWER(TRIM(named.display_name))='juvan botha') AS active_name_count,
           (SELECT COUNT(DISTINCT cc.normalized_value)::int
              FROM client_contacts cc
             WHERE cc.client_id=p.client_id
               AND cc.contact_type IN ('whatsapp','mobile')
               AND NULLIF(TRIM(cc.normalized_value),'') IS NOT NULL) AS canonical_contact_count,
           (SELECT COUNT(DISTINCT other.id)::int
              FROM client_contacts target_cc
              JOIN client_contacts other_cc
                ON other_cc.normalized_value=target_cc.normalized_value
               AND other_cc.contact_type IN ('whatsapp','mobile')
              JOIN clients other
                ON other.id=other_cc.client_id
               AND other.status='active'
             WHERE target_cc.client_id=p.client_id
               AND target_cc.contact_type IN ('whatsapp','mobile')
               AND NULLIF(TRIM(target_cc.normalized_value),'') IS NOT NULL
               AND other.id<>p.client_id) AS shared_active_contact_count
      FROM client_booking_approval_policies p
      JOIN clients c ON c.id=p.client_id
      JOIN staff_admin_accounts saa ON saa.id=p.approver_admin_id
     WHERE p.policy_key=$1
  `, [POLICY_KEY]);

  if (result.rowCount !== 1) {
    throw new Error('Juvan Botha approval policy verification failed: expected exactly one persisted policy');
  }

  const row = result.rows[0];
  const valid = row.active === true
    && row.client_status === 'active'
    && String(row.display_name || '').trim().toLowerCase() === EXPECTED_CLIENT_NAME.toLowerCase()
    && String(row.expected_display_name || '').trim().toLowerCase() === EXPECTED_CLIENT_NAME.toLowerCase()
    && Number(row.active_name_count) === 1
    && Number(row.canonical_contact_count) >= 1
    && Number(row.shared_active_contact_count) === 0
    && row.approver_active === true
    && row.approver_whatsapp_configured === true
    && String(row.approver_name || '').trim().toLowerCase() === EXPECTED_APPROVER_NAME.toLowerCase()
    && row.business_role === 'business_admin'
    && row.calendar_scope === 'all_business'
    && row.service_scope === 'all_services';

  if (!valid) {
    throw new Error('Juvan Botha approval policy verification failed: canonical client or Jean-Pierre approval invariants drifted');
  }

  return {
    initialized: true,
    migration: MIGRATION,
    applied: migration.applied === true,
    checksumVerified: migration.checksumVerified === true,
    appliedAt: migration.appliedAt || null,
    policyKey: POLICY_KEY,
    clientId: String(row.client_id),
    displayName: EXPECTED_CLIENT_NAME,
    activeNameCount: Number(row.active_name_count),
    canonicalContactCount: Number(row.canonical_contact_count),
    sharedActiveContactCount: Number(row.shared_active_contact_count),
    approverAdminId: String(row.approver_admin_id),
    approverName: EXPECTED_APPROVER_NAME,
    approverWhatsAppConfigured: true,
  };
}

module.exports = {
  MIGRATION,
  POLICY_KEY,
  EXPECTED_CLIENT_NAME,
  EXPECTED_APPROVER_NAME,
  ensureJuvanBookingApprovalPolicy,
};
