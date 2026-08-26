-- Durable, idempotent initial client-booking confirmation obligations.
-- Migration 082 is reserved by the independent WS-10 recovery-hash correction.
--
-- Expand/contract rule: client_id remains nullable in migration 083 so the
-- currently deployed pre-083 artifact can continue inserting its legacy
-- delivery rows during Render zero-downtime replacement and remains a valid
-- code-only rollback target. New code still writes client_id for every new
-- obligation. NOT NULL enforcement belongs in a later controlled contract
-- migration after the old artifact is retired as a rollback target.

ALTER TABLE customer_message_deliveries
  DROP CONSTRAINT IF EXISTS customer_message_deliveries_status_check;

ALTER TABLE customer_message_deliveries
  ADD CONSTRAINT customer_message_deliveries_status_check
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'uncertain')),
  ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS contact_id BIGINT REFERENCES client_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name_authority_id BIGINT REFERENCES client_facing_name_authorities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_error TEXT;

UPDATE customer_message_deliveries delivery
   SET client_id = appointment.client_id
  FROM appointments appointment
 WHERE delivery.appointment_id = appointment.id
   AND delivery.client_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'customer_message_deliveries'::regclass
       AND conname = 'customer_message_deliveries_attempt_count_check'
  ) THEN
    ALTER TABLE customer_message_deliveries
      ADD CONSTRAINT customer_message_deliveries_attempt_count_check
      CHECK (attempt_count >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_message_deliveries_retry
  ON customer_message_deliveries(next_attempt_at, appointment_id)
  WHERE message_kind = 'booking_confirmation'
    AND status IN ('pending', 'failed');
