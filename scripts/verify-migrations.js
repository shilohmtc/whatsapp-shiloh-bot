#!/usr/bin/env node
require('dotenv').config();

const { closePool } = require('../src/db/pool');
const { verifyMigrationState } = require('../src/services/migrations');
const { runConfiguredCalendarOccupancyReset } = require('../src/services/calendarOccupancyReset');

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

  const reset = await runConfiguredCalendarOccupancyReset();
  if (reset.status !== 'disabled') {
    console.log(JSON.stringify({ event: 'calendar_occupancy_reset_584', ...reset }));
  }
  if (reset.status === 'refused') {
    const error = new Error(`Calendar occupancy reset refused: ${reset.reason}`);
    error.code = 'CALENDAR_OCCUPANCY_RESET_REFUSED';
    throw error;
  }
}

run()
  .catch((error) => {
    console.error(JSON.stringify({
      event: 'production_migration_authority_failed',
      mode: 'startup_gate',
      code: error.code || 'MIGRATION_AUTHORITY_VERIFICATION_FAILED',
      message: error.message,
      details: error.details || {},
    }));
    process.exitCode = 1;
  })
  .finally(() => closePool());
