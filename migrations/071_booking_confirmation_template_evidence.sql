CREATE TABLE IF NOT EXISTS customer_message_deliveries (
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  message_kind TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent')),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  template_name TEXT,
  provider_message_id TEXT,
  PRIMARY KEY (appointment_id, message_kind)
);

ALTER TABLE customer_message_deliveries
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
