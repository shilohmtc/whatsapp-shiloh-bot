ALTER TABLE appointment_lifecycle
  ADD COLUMN IF NOT EXISTS appointment_id BIGINT REFERENCES appointments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS appointment_ends_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_lifecycle_appointment_id
  ON appointment_lifecycle (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointment_lifecycle_canonical_due
  ON appointment_lifecycle (status, appointment_at, appointment_ends_at)
  WHERE appointment_id IS NOT NULL;
