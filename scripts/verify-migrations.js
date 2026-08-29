#!/usr/bin/env node
require('dotenv').config();

const { closePool } = require('../src/db/pool');
const { verifyMigrationState } = require('../src/services/migrations');

async function run() {
  const state = await verifyMigrationState();
  console.log(JSON.stringify({
    event: 'production_migration_authority_verified',
    mode: 'read_only',
    executor: 'npm run db:migrate',
    migrationFiles: state.migrationFiles,
    ledgerRows: state.ledgerRows,
    pending: state.pending,
    checksumMismatches: state.checksumMismatches,
    ledgerRowsAbsentFromRelease: state.ledgerRowsAbsentFromRelease,
  }));
}

run()
  .catch((error) => {
    console.error(JSON.stringify({
      event: 'production_migration_authority_failed',
      mode: 'read_only',
      code: error.code || 'MIGRATION_AUTHORITY_VERIFICATION_FAILED',
      message: error.message,
      details: error.details || {},
    }));
    process.exitCode = 1;
  })
  .finally(() => closePool());
