-- Christel-only historical finalization price adjustments.
-- Preserve the imported/original appointment value for audit while making the
-- explicitly approved adjusted amount the canonical completed treatment value.

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_financial_classification_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_financial_classification_check
  CHECK (financial_classification IN ('standard','no_charge','price_adjusted'));

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
);
