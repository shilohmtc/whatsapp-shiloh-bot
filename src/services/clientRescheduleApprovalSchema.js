const { pool } = require('../db/pool');
const { applyMigrationFile } = require('./migrations');

const MIGRATION = '064_client_reschedule_practitioner_approval.sql';
const APPROVAL_TEMPLATE = 'shiloh_reschedule_approval_request_v1';
const DECLINED_TEMPLATE = 'shiloh_reschedule_declined_v1';

async function ensureClientRescheduleApprovalSchema() {
  const migration = await applyMigrationFile(MIGRATION);
  const verification = await pool.query(`
    SELECT to_regclass('public.appointment_reschedule_requests') AS request_table,
           EXISTS (
             SELECT 1
               FROM pg_indexes
              WHERE schemaname='public'
                AND indexname='uq_appointment_reschedule_requests_pending_appointment'
           ) AS pending_unique_index,
           EXISTS (
             SELECT 1
               FROM pg_indexes
              WHERE schemaname='public'
                AND indexname='idx_appointment_reschedule_requests_pending_staff'
           ) AS pending_staff_index
  `);
  const row = verification.rows[0] || {};
  if (!row.request_table || !row.pending_unique_index || !row.pending_staff_index) {
    throw new Error('Client reschedule approval schema verification failed');
  }

  return {
    initialized: true,
    migration: MIGRATION,
    applied: migration.applied === true,
    checksumVerified: migration.checksumVerified === true,
    appliedAt: migration.appliedAt || null,
    requestTable: String(row.request_table),
    pendingUniqueIndex: row.pending_unique_index === true,
    pendingStaffIndex: row.pending_staff_index === true,
    featureEnabled: process.env.WHATSAPP_RESCHEDULE_APPROVAL_ENABLED === 'true',
    approvalTemplateConfigured: String(process.env.WHATSAPP_RESCHEDULE_APPROVAL_REQUEST_TEMPLATE || '').trim() === APPROVAL_TEMPLATE,
    declinedTemplateConfigured: String(process.env.WHATSAPP_RESCHEDULE_DECLINED_TEMPLATE || '').trim() === DECLINED_TEMPLATE,
  };
}

module.exports = {
  MIGRATION,
  APPROVAL_TEMPLATE,
  DECLINED_TEMPLATE,
  ensureClientRescheduleApprovalSchema,
};
