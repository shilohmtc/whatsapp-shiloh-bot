-- Durable provider lifecycle evidence for Shiloh-owned appointment communications.
-- Keep customer_message_deliveries.status as the existing Shiloh queue/send state;
-- provider callbacks are additive evidence keyed by provider_message_id.

ALTER TABLE customer_message_deliveries
  ADD COLUMN IF NOT EXISTS provider_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_error JSONB;

CREATE INDEX IF NOT EXISTS idx_customer_message_deliveries_provider_message_id
  ON customer_message_deliveries(provider_message_id)
  WHERE provider_message_id IS NOT NULL;
