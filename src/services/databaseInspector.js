const { Pool } = require("pg");
const logger = require("../lib/logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("error", (error) => {
  logger.error({ err: error }, "unexpected database inspector PostgreSQL pool error");
});

async function getDatabaseStatus() {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      version() AS postgres_version,
      NOW() AS database_time,
      pg_database_size(current_database()) AS database_size_bytes
  `);

  const row = result.rows[0];
  return {
    databaseName: row.database_name,
    schemaName: row.schema_name,
    postgresVersion: row.postgres_version,
    databaseTime: row.database_time,
    databaseSizeBytes: Number(row.database_size_bytes),
  };
}

async function listDatabaseTables() {
  const result = await pool.query(`
    SELECT
      t.table_name,
      COALESCE(s.n_live_tup, 0)::bigint AS estimated_rows,
      pg_total_relation_size(format('%I.%I', t.table_schema, t.table_name)::regclass) AS total_bytes
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s
      ON s.schemaname = t.table_schema
     AND s.relname = t.table_name
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);

  return result.rows.map((row) => ({
    tableName: row.table_name,
    estimatedRows: Number(row.estimated_rows),
    totalBytes: Number(row.total_bytes),
  }));
}

async function getDatabaseSchema() {
  const columnsResult = await pool.query(`
    SELECT
      c.table_name,
      c.ordinal_position,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position
  `);

  const constraintsResult = await pool.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position
  `);

  const tables = {};

  for (const column of columnsResult.rows) {
    if (!tables[column.table_name]) {
      tables[column.table_name] = { columns: [], constraints: [] };
    }

    tables[column.table_name].columns.push({
      position: column.ordinal_position,
      name: column.column_name,
      dataType: column.data_type,
      databaseType: column.udt_name,
      nullable: column.is_nullable === "YES",
      default: column.column_default,
      maxLength: column.character_maximum_length,
    });
  }

  for (const constraint of constraintsResult.rows) {
    if (!tables[constraint.table_name]) {
      tables[constraint.table_name] = { columns: [], constraints: [] };
    }

    tables[constraint.table_name].constraints.push({
      name: constraint.constraint_name,
      type: constraint.constraint_type,
      column: constraint.column_name,
      references:
        constraint.constraint_type === "FOREIGN KEY"
          ? {
              table: constraint.foreign_table_name,
              column: constraint.foreign_column_name,
            }
          : null,
    });
  }

  return tables;
}

async function getDatabaseOverview() {
  const [status, tables] = await Promise.all([
    getDatabaseStatus(),
    listDatabaseTables(),
  ]);

  const extensions = await pool.query(`
    SELECT extname, extversion
    FROM pg_extension
    WHERE extname IN ('vector', 'plpgsql')
    ORDER BY extname
  `);

  return {
    status,
    tables,
    extensions: extensions.rows.map((row) => ({
      name: row.extname,
      version: row.extversion,
    })),
  };
}

module.exports = {
  getDatabaseStatus,
  listDatabaseTables,
  getDatabaseSchema,
  getDatabaseOverview,
};
