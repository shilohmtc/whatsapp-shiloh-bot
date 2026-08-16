const { pool } = require('../db/pool');

let initialized = false;
let initializing = null;

async function ensureHistoricalFinalizationFinancialSchema() {
  if (initialized) return { initialized: true };
  if (initializing) return initializing;

  initializing = (async () => {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      // Serialize this small compatibility bootstrap across rolling instances.
      await db.query(`SELECT pg_advisory_xact_lock(hashtext('shiloh_historical_finalization_financial_schema'))`);

      await db.query(`
        ALTER TABLE appointments
          ADD COLUMN IF NOT EXISTS financial_classification TEXT NOT NULL DEFAULT 'standard',
          ADD COLUMN IF NOT EXISTS pre_adjustment_total_price NUMERIC(12,2)
      `);

      // Keep the canonical classification constraint aligned with the live outcomes.
      await db.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_financial_classification_check`);
      await db.query(`
        ALTER TABLE appointments
          ADD CONSTRAINT appointments_financial_classification_check
          CHECK (financial_classification IN ('standard','no_charge','price_adjusted'))
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_appointments_financial_classification
          ON appointments(financial_classification)
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_appointment_price_adjustment_intents (
          phone VARCHAR(32) PRIMARY KEY,
          appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
          adjusted_price NUMERIC(12,2),
          status TEXT NOT NULL DEFAULT 'collecting_price',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT admin_price_adjustment_status_check
            CHECK (status IN ('collecting_price','awaiting_confirmation')),
          CONSTRAINT admin_price_adjustment_value_check
            CHECK (adjusted_price IS NULL OR adjusted_price > 0)
        )
      `);

      await db.query('COMMIT');
      initialized = true;
      return { initialized: true };
    } catch (error) {
      try { await db.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      db.release();
      initializing = null;
    }
  })();

  return initializing;
}

module.exports = { ensureHistoricalFinalizationFinancialSchema };
