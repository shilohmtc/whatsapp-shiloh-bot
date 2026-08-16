-- Preserve attended appointment truth while allowing an explicitly certified
-- no-charge financial outcome with R0 client charge and R0 practitioner earnings.
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS financial_classification TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS pre_adjustment_total_price NUMERIC(12,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'appointments_financial_classification_check'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_financial_classification_check
      CHECK (financial_classification IN ('standard','no_charge'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_financial_classification
  ON appointments(financial_classification);
