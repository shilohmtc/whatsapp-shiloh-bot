#!/usr/bin/env node
require('dotenv').config();

const { closePool } = require('../src/db/pool');
const {
  CONTROLLED_RELEASE_MIGRATION_ENV,
  runControlledReleaseMigration,
} = require('../src/services/controlledReleaseMigration');

async function run() {
  const result = await runControlledReleaseMigration();
  console.log(JSON.stringify({
    event: 'controlled_release_migration_gate_complete',
    authority: CONTROLLED_RELEASE_MIGRATION_ENV,
    ...result,
  }));
}

run()
  .catch((error) => {
    console.error(JSON.stringify({
      event: 'controlled_release_migration_gate_failed',
      authority: CONTROLLED_RELEASE_MIGRATION_ENV,
      code: error.code || 'CONTROLLED_RELEASE_MIGRATION_FAILED',
      message: error.message,
      details: error.details || {},
    }));
    process.exitCode = 1;
  })
  .finally(() => closePool());
