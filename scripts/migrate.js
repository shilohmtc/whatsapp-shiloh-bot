#!/usr/bin/env node
require('dotenv').config();

const { closePool } = require('../src/db/pool');
const { applyPendingMigrations } = require('../src/services/migrations');

async function run() {
  if (process.argv.slice(2).length) {
    throw new Error('Unknown migration runner argument. The canonical executor applies the ordered pending release inventory only.');
  }
  const result = await applyPendingMigrations();
  for (const filename of result.skipped) console.log(`skip ${filename}`);
  for (const filename of result.applied) console.log(`applied ${filename}`);
  console.log(JSON.stringify({
    event: 'production_migration_executor_complete',
    authority: 'npm run db:migrate',
    applied: result.applied,
    skipped: result.skipped,
  }));
}

run()
  .catch((error) => {
    console.error(JSON.stringify({
      event: 'production_migration_executor_failed',
      code: error.code || 'MIGRATION_EXECUTOR_FAILED',
      message: error.message,
    }));
    process.exitCode = 1;
  })
  .finally(() => closePool());
