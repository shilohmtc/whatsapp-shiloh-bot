const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '061_massage_packages.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function ensureMassagePackageSchema() {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const hash = checksum(sql);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const existing = await client.query(
      'SELECT checksum, applied_at FROM schema_migrations WHERE filename = $1 FOR UPDATE',
      [MIGRATION_FILENAME]
    );

    if (existing.rowCount > 0) {
      if (existing.rows[0].checksum !== hash) {
        throw new Error(`Migration ${MIGRATION_FILENAME} has changed after being applied`);
      }
      await client.query('COMMIT');
      return {
        initialized: true,
        applied: false,
        migration: MIGRATION_FILENAME,
        checksumVerified: true,
        appliedAt: existing.rows[0].applied_at,
      };
    }

    if (sql.trim()) await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
      [MIGRATION_FILENAME, hash]
    );
    await client.query('COMMIT');

    return {
      initialized: true,
      applied: true,
      migration: MIGRATION_FILENAME,
      checksumVerified: true,
    };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { MIGRATION_FILENAME, ensureMassagePackageSchema };
