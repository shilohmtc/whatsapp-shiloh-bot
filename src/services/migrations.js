const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/pool');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');
const MIGRATION_EXECUTOR_LOCK = 'SHILOH_PRODUCTION_MIGRATION_EXECUTOR';

class MigrationAuthorityError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'MigrationAuthorityError';
    this.code = code;
    this.details = details;
  }
}

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function migrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
}

function migrationInventory() {
  return migrationFiles().map((filename) => {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
    return { filename, checksum: checksum(content) };
  });
}

function assertKnownMigration(filename) {
  const safeFilename = String(filename || '').trim();
  if (!/^\d+_.+\.sql$/.test(safeFilename) || !migrationFiles().includes(safeFilename)) {
    throw new MigrationAuthorityError(
      'MIGRATION_UNKNOWN_FILE',
      `Unknown migration file: ${safeFilename || '(empty)'}`,
      { filename: safeFilename || null }
    );
  }
  return safeFilename;
}

async function acquireClient(db = pool) {
  if (db && typeof db.connect === 'function') {
    const client = await db.connect();
    return { client, release: () => client.release() };
  }
  if (db && typeof db.query === 'function') {
    return { client: db, release: () => {} };
  }
  throw new TypeError('A PostgreSQL pool or query client is required');
}

async function readMigrationAuthority(client) {
  const table = await client.query(
    "SELECT to_regclass('public.schema_migrations')::text AS table_name"
  );
  if (!table.rows[0]?.table_name) {
    throw new MigrationAuthorityError(
      'MIGRATION_LEDGER_MISSING',
      'Migration authority verification failed: schema_migrations is missing. Run "npm run db:migrate" through controlled release tooling before starting the application.'
    );
  }

  const applied = await client.query(
    'SELECT filename, checksum, applied_at FROM schema_migrations ORDER BY filename'
  );
  const inventory = migrationInventory();
  const fileMap = new Map(inventory.map((item) => [item.filename, item]));
  const ledgerMap = new Map(applied.rows.map((item) => [item.filename, item]));
  const migrations = inventory.map((item) => {
    const ledger = ledgerMap.get(item.filename) || null;
    return {
      filename: item.filename,
      checksum: item.checksum,
      applied: Boolean(ledger),
      checksumMatches: ledger ? ledger.checksum === item.checksum : null,
      appliedAt: ledger?.applied_at || null,
    };
  });
  const pending = migrations.filter((item) => !item.applied).map((item) => item.filename);
  const checksumMismatches = migrations
    .filter((item) => item.applied && item.checksumMatches !== true)
    .map((item) => item.filename);
  const ledgerRowsAbsentFromRelease = applied.rows
    .filter((item) => !fileMap.has(item.filename))
    .map((item) => item.filename);

  return {
    migrationFiles: inventory.length,
    ledgerRows: applied.rows.length,
    pending,
    checksumMismatches,
    ledgerRowsAbsentFromRelease,
    migrations,
  };
}

async function getMigrationStatus({ db = pool } = {}) {
  const { client, release } = await acquireClient(db);
  try {
    return (await readMigrationAuthority(client)).migrations;
  } finally {
    release();
  }
}

function assertReconciled(state) {
  if (state.checksumMismatches.length) {
    throw new MigrationAuthorityError(
      'MIGRATION_CHECKSUM_MISMATCH',
      `Migration authority verification failed: applied migration checksum mismatch (${state.checksumMismatches.join(', ')}). Restore the exact released migration files; startup will not rewrite history.`,
      { filenames: state.checksumMismatches }
    );
  }
  if (state.ledgerRowsAbsentFromRelease.length) {
    throw new MigrationAuthorityError(
      'MIGRATION_LEDGER_UNKNOWN_FILE',
      `Migration authority verification failed: ledger rows are absent from this release (${state.ledgerRowsAbsentFromRelease.join(', ')}). Deploy the matching release; startup will not alter the ledger.`,
      { filenames: state.ledgerRowsAbsentFromRelease }
    );
  }
  if (state.pending.length) {
    throw new MigrationAuthorityError(
      'MIGRATION_PENDING',
      `Migration authority verification failed: pending migrations (${state.pending.join(', ')}). Run "npm run db:migrate" through controlled release tooling before starting the application.`,
      { filenames: state.pending }
    );
  }
  return state;
}

async function verifyMigrationState({ db = pool } = {}) {
  const { client, release } = await acquireClient(db);
  let began = false;
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    began = true;
    const state = assertReconciled(await readMigrationAuthority(client));
    await client.query('ROLLBACK');
    began = false;
    return state;
  } catch (error) {
    if (began) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    throw error;
  } finally {
    release();
  }
}

async function verifyMigrationFiles(filenames, { db = pool } = {}) {
  const requested = [...new Set((filenames || []).map(assertKnownMigration))];
  const state = await verifyMigrationState({ db });
  const status = new Map(state.migrations.map((item) => [item.filename, item]));
  return requested.map((filename) => status.get(filename));
}

async function verifyMigrationFile(filename, options = {}) {
  return (await verifyMigrationFiles([filename], options))[0];
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function applyMigrationFile(filename, { db = pool } = {}) {
  const safeFilename = assertKnownMigration(filename);
  const fullPath = path.join(MIGRATIONS_DIR, safeFilename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  const hash = checksum(sql);
  const { client, release } = await acquireClient(db);
  let began = false;

  try {
    await client.query('BEGIN');
    began = true;
    await client.query("SET LOCAL lock_timeout='15s'");
    await client.query("SET LOCAL statement_timeout='120s'");
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [MIGRATION_EXECUTOR_LOCK]);
    await ensureMigrationTable(client);
    const existing = await client.query(
      'SELECT checksum, applied_at FROM schema_migrations WHERE filename = $1 FOR UPDATE',
      [safeFilename]
    );

    if (existing.rowCount > 0) {
      if (existing.rows[0].checksum !== hash) {
        throw new MigrationAuthorityError(
          'MIGRATION_CHECKSUM_MISMATCH',
          `Migration ${safeFilename} has changed after being applied`,
          { filename: safeFilename }
        );
      }
      await client.query('COMMIT');
      began = false;
      return {
        filename: safeFilename,
        applied: false,
        checksumVerified: true,
        appliedAt: existing.rows[0].applied_at || null,
      };
    }

    if (sql.trim()) await client.query(sql);
    const recorded = await client.query(
      'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) RETURNING applied_at',
      [safeFilename, hash]
    );
    await client.query('COMMIT');
    began = false;
    return {
      filename: safeFilename,
      applied: true,
      checksumVerified: true,
      appliedAt: recorded.rows[0]?.applied_at || null,
    };
  } catch (error) {
    if (began) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    throw error;
  } finally {
    release();
  }
}

async function applyPendingMigrations({ db = pool } = {}) {
  const { client, release } = await acquireClient(db);
  try {
    const table = await client.query(
      "SELECT to_regclass('public.schema_migrations')::text AS table_name"
    );
    if (table.rows[0]?.table_name) {
      const state = await readMigrationAuthority(client);
      if (state.checksumMismatches.length) {
        throw new MigrationAuthorityError(
          'MIGRATION_CHECKSUM_MISMATCH',
          `Migration executor refused checksum drift (${state.checksumMismatches.join(', ')})`,
          { filenames: state.checksumMismatches }
        );
      }
      if (state.ledgerRowsAbsentFromRelease.length) {
        throw new MigrationAuthorityError(
          'MIGRATION_LEDGER_UNKNOWN_FILE',
          `Migration executor refused unknown ledger rows (${state.ledgerRowsAbsentFromRelease.join(', ')})`,
          { filenames: state.ledgerRowsAbsentFromRelease }
        );
      }
    }
  } finally {
    release();
  }

  const result = { applied: [], skipped: [] };
  for (const filename of migrationFiles()) {
    const migration = await applyMigrationFile(filename, { db });
    if (migration.applied) result.applied.push(filename);
    else result.skipped.push(filename);
  }
  return result;
}

module.exports = {
  MIGRATIONS_DIR,
  MIGRATION_EXECUTOR_LOCK,
  MigrationAuthorityError,
  checksum,
  migrationFiles,
  migrationInventory,
  getMigrationStatus,
  verifyMigrationFile,
  verifyMigrationFiles,
  verifyMigrationState,
  applyMigrationFile,
  applyPendingMigrations,
};
