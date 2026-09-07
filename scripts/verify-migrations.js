#!/usr/bin/env node
require('dotenv').config();

const { closePool } = require('../src/db/pool');
const { verifyMigrationState } = require('../src/services/migrations');
const {
  CONTROLLED_RELEASE_MIGRATION_ENV,
  runControlledReleaseMigration,
} = require('../src/services/controlledReleaseMigration');
const {
  MODE_ENV: RETROSPECTIVE_ACCESS_MODE_ENV,
  runConfigured: runConfiguredRetrospectiveAccessProvisioning,
} = require('../src/services/retrospectiveAccessProvisioning753');

async function run() {
  const controlled = await runControlledReleaseMigration();
  const state = await verifyMigrationState();
  console.log(JSON.stringify({
    event: 'production_migration_authority_verified',
    mode: controlled.action === 'applied' ? 'controlled_single_migration_then_read_only' : 'read_only',
    executor: 'npm run db:migrate',
    controlledReleaseAuthority: CONTROLLED_RELEASE_MIGRATION_ENV,
    controlledReleaseAction: controlled.action,
    controlledReleaseFilename: controlled.filename,
    migrationFiles: state.migrationFiles,
    ledgerRows: state.ledgerRows,
    pending: state.pending,
    checksumMismatches: state.checksumMismatches,
    ledgerRowsAbsentFromRelease: state.ledgerRowsAbsentFromRelease,
  }));

  const retrospectiveAccess = await runConfiguredRetrospectiveAccessProvisioning();
  if (retrospectiveAccess.status !== 'disabled') {
    console.log(JSON.stringify({
      event: 'retrospective_access_753_control_operation',
      configuredBy: RETROSPECTIVE_ACCESS_MODE_ENV,
      ...retrospectiveAccess,
    }));
  }
  if (retrospectiveAccess.status === 'refused') {
    const error = new Error(`Retrospective access #753 control operation refused: ${retrospectiveAccess.reason}`);
    error.code = 'RETROSPECTIVE_ACCESS_753_REFUSED';
    throw error;
  }
}

run()
  .catch((error) => {
    console.error(JSON.stringify({
      event: 'production_migration_authority_failed',
      mode: 'startup_authority',
      code: error.code || 'MIGRATION_AUTHORITY_VERIFICATION_FAILED',
      message: error.message,
      details: error.details || {},
    }));
    process.exitCode = 1;
  })
  .finally(() => closePool());
