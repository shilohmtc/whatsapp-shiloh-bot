-- Durable multi-turn state for historical appointment service-change finalization.
-- Production startup also ensures this table because repository migrations are not auto-applied by Render.

CREATE TABLE IF NOT EXISTS admin_appointment_service_change_intents (
  phone VARCHAR(32) PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  proposed_service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  adjusted_price NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'selecting_service',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_service_change_status_check
    CHECK (status IN ('selecting_service','awaiting_service_confirmation','collecting_price','awaiting_price_confirmation')),
  CONSTRAINT admin_service_change_price_check
    CHECK (adjusted_price IS NULL OR adjusted_price >= 0)
);
