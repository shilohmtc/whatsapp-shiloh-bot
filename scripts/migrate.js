require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool, closePool } = require("../src/db/pool");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

function checksum(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
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

async function run() {
  const files = fs.existsSync(MIGRATIONS_DIR)
    ? fs.readdirSync(MIGRATIONS_DIR).filter((name) => /^\d+_.+\.sql$/.test(name)).sort()
    : [];

  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    for (const filename of files) {
      const fullPath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(fullPath, "utf8");
      const hash = checksum(sql);
      const existing = await client.query(
        "SELECT checksum FROM schema_migrations WHERE filename = $1",
        [filename]
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum !== hash) {
          throw new Error(`Migration ${filename} has changed after being applied`);
        }
        console.log(`skip ${filename}`);
        continue;
      }

      await client.query("BEGIN");
      try {
        if (sql.trim()) await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)",
          [filename, hash]
        );
        await client.query("COMMIT");
        console.log(`applied ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
    await closePool();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
