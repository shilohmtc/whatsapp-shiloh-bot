const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("../db/pool");

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "migrations");

function checksum(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function migrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
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

async function getMigrationStatus() {
  const client = await pool.connect();
  try {
    await ensureMigrationTable(client);
    const applied = await client.query(
      "SELECT filename, checksum, applied_at FROM schema_migrations ORDER BY filename"
    );
    const appliedMap = new Map(applied.rows.map((row) => [row.filename, row]));

    return migrationFiles().map((filename) => {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf8");
      const hash = checksum(content);
      const existing = appliedMap.get(filename);
      return {
        filename,
        checksum: hash,
        applied: Boolean(existing),
        checksumMatches: existing ? existing.checksum === hash : null,
        appliedAt: existing?.applied_at || null,
      };
    });
  } finally {
    client.release();
  }
}

async function applyMigrationFile(filename) {
  const safeFilename = String(filename || "").trim();
  if (!/^\d+_.+\.sql$/.test(safeFilename) || !migrationFiles().includes(safeFilename)) {
    throw new Error(`Unknown migration file: ${safeFilename || "(empty)"}`);
  }

  const fullPath = path.join(MIGRATIONS_DIR, safeFilename);
  const sql = fs.readFileSync(fullPath, "utf8");
  const hash = checksum(sql);
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);
    const existing = await client.query(
      "SELECT checksum, applied_at FROM schema_migrations WHERE filename = $1",
      [safeFilename]
    );

    if (existing.rowCount > 0) {
      if (existing.rows[0].checksum !== hash) {
        throw new Error(`Migration ${safeFilename} has changed after being applied`);
      }
      return {
        filename: safeFilename,
        applied: false,
        checksumVerified: true,
        appliedAt: existing.rows[0].applied_at || null,
      };
    }

    await client.query("BEGIN");
    try {
      if (sql.trim()) await client.query(sql);
      const recorded = await client.query(
        "INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) RETURNING applied_at",
        [safeFilename, hash]
      );
      await client.query("COMMIT");
      return {
        filename: safeFilename,
        applied: true,
        checksumVerified: true,
        appliedAt: recorded.rows[0]?.applied_at || null,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
  }
}

async function applyPendingMigrations() {
  const result = { applied: [], skipped: [] };
  for (const filename of migrationFiles()) {
    const migration = await applyMigrationFile(filename);
    if (migration.applied) result.applied.push(filename);
    else result.skipped.push(filename);
  }
  return result;
}

module.exports = {
  getMigrationStatus,
  applyMigrationFile,
  applyPendingMigrations,
};
