ALTER TABLE appointment_lifecycle
  ADD COLUMN IF NOT EXISTS followup_template_name TEXT,
  ADD COLUMN IF NOT EXISTS followup_provider_message_id TEXT;
