ALTER TABLE appointment_change_intents
  ADD COLUMN IF NOT EXISTS appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointment_change_intents_appointment
  ON appointment_change_intents (appointment_id)
  WHERE appointment_id IS NOT NULL;
