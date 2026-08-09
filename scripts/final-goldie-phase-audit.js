require('dotenv').config();

const { pool, closePool } = require('../src/db/pool');
const { getMigrationStatus } = require('../src/services/migrations');
const { getPostCanonicalizationAudit } = require('../src/services/canonicalizationAudit');
const { buildAppointmentReconciliationPlan } = require('../src/services/appointmentReconciliationPlan');
const { buildCalendarBlockPlan } = require('../src/services/calendarBlockPromotion');

async function scalar(sql, params = []) {
  const result = await pool.query(sql, params);
  return Number(result.rows[0]?.count || 0);
}

async function run() {
  const [
    migrations,
    canonicalizationAudit,
    appointmentPlan,
    calendarPlan,
    goldieAppointments,
    goldieCalendarBlocks,
    duplicateAppointmentExternalIds,
    orphanAppointmentServices,
    orphanAppointmentStaff,
    unmatchedGoldieAppointments,
    matchedGoldieAppointments,
    ambiguousGoldieAppointments,
    erroredGoldieAppointments,
  ] = await Promise.all([
    getMigrationStatus(),
    getPostCanonicalizationAudit('1'),
    buildAppointmentReconciliationPlan({ appointmentBatchId: '2', clientBatchId: '1' }),
    buildCalendarBlockPlan({ appointmentBatchId: '2' }),
    scalar(`SELECT COUNT(*) AS count FROM appointments WHERE source='goldie'`),
    scalar(`SELECT COUNT(*) AS count FROM calendar_blocks WHERE source='goldie'`),
    scalar(`SELECT COUNT(*) AS count FROM (SELECT external_id FROM appointments WHERE source='goldie' GROUP BY external_id HAVING COUNT(*)>1) x`),
    scalar(`SELECT COUNT(*) AS count FROM appointment_services aps LEFT JOIN appointments a ON a.id=aps.appointment_id LEFT JOIN services s ON s.id=aps.service_id WHERE a.id IS NULL OR s.id IS NULL`),
    scalar(`SELECT COUNT(*) AS count FROM appointment_staff ast LEFT JOIN appointments a ON a.id=ast.appointment_id LEFT JOIN staff st ON st.id=ast.staff_id WHERE a.id IS NULL OR st.id IS NULL`),
    scalar(`SELECT COUNT(*) AS count FROM external_records WHERE source='goldie' AND entity_type='appointment' AND import_batch_id='2' AND reconciliation_status='unmatched'`),
    scalar(`SELECT COUNT(*) AS count FROM external_records WHERE source='goldie' AND entity_type='appointment' AND import_batch_id='2' AND reconciliation_status='matched'`),
    scalar(`SELECT COUNT(*) AS count FROM external_records WHERE source='goldie' AND entity_type='appointment' AND import_batch_id='2' AND reconciliation_status='ambiguous'`),
    scalar(`SELECT COUNT(*) AS count FROM external_records WHERE source='goldie' AND entity_type='appointment' AND import_batch_id='2' AND reconciliation_status='error'`),
  ]);

  const migrationProblems = migrations.filter((m) => m.applied && m.checksumMatches === false);
  const pendingMigrations = migrations.filter((m) => !m.applied);
  const executionFlags = {
    appointmentPromotionConfigured: Boolean(process.env.GOLDIE_APPOINTMENT_PROMOTION_CONFIRMATION),
    calendarBlockPromotionConfigured: Boolean(process.env.GOLDIE_CALENDAR_BLOCK_PROMOTION_CONFIRMATION),
    createNewPromotionConfigured: Boolean(process.env.GOLDIE_CREATE_NEW_CONFIRMATION),
    migrationStartupConfigured: Boolean(process.env.APPLY_DATABASE_MIGRATIONS_ON_STARTUP),
  };

  const checks = {
    allAppliedMigrationChecksumsMatch: migrationProblems.length === 0,
    noPendingMigrations: pendingMigrations.length === 0,
    canonicalizationAuditPasses: canonicalizationAudit.overallPass === true,
    noDuplicateGoldieAppointmentExternalIds: duplicateAppointmentExternalIds === 0,
    noOrphanAppointmentServices: orphanAppointmentServices === 0,
    noOrphanAppointmentStaff: orphanAppointmentStaff === 0,
    noFurtherSafeAutomaticAppointments: appointmentPlan.summary?.promotion?.safeSingleClientAppointments === 0,
    noFurtherSafeCalendarBlocks: calendarPlan.summary?.eligible === 0,
    noExecutionFlagsConfigured: Object.values(executionFlags).every((v) => v === false),
  };

  console.log(JSON.stringify({
    report: 'final_goldie_phase_audit',
    mode: 'read_only',
    writesPerformed: false,
    overallPass: Object.values(checks).every(Boolean),
    checks,
    counts: {
      goldieAppointments,
      goldieCalendarBlocks,
      matchedGoldieAppointmentSourceRows: matchedGoldieAppointments,
      unmatchedGoldieAppointmentSourceRows: unmatchedGoldieAppointments,
      ambiguousGoldieAppointmentSourceRows: ambiguousGoldieAppointments,
      erroredGoldieAppointmentSourceRows: erroredGoldieAppointments,
      duplicateAppointmentExternalIds,
      orphanAppointmentServices,
      orphanAppointmentStaff,
      remainingDryRunRows: appointmentPlan.summary?.total,
      remainingSafeAppointments: appointmentPlan.summary?.promotion?.safeSingleClientAppointments,
      remainingCalendarRows: calendarPlan.summary?.nonAppointmentRows,
      remainingSafeCalendarBlocks: calendarPlan.summary?.eligible,
    },
    residualBlockers: appointmentPlan.blockerCounts,
    executionFlags,
    migrations: migrations.map((m) => ({ filename: m.filename, applied: m.applied, checksumMatches: m.checksumMatches })),
    pendingMigrations: pendingMigrations.map((m) => m.filename),
    migrationProblems: migrationProblems.map((m) => m.filename),
    canonicalizationChecks: canonicalizationAudit.checks,
    disposition: {
      automaticMigrationExhausted: appointmentPlan.summary?.promotion?.safeSingleClientAppointments === 0 && calendarPlan.summary?.eligible === 0,
      residualRowsMustRemainHeldUntilNewIdentityOrServiceEvidenceExists: true,
    },
  }));
}

run()
  .catch((error) => {
    console.error(JSON.stringify({ report: 'final_goldie_phase_audit', error: error.message, stack: error.stack }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
