-- CRM-1: canonical client identity/onboarding foundation.
-- Adds DOB and persistent WhatsApp onboarding state without changing historical migrations.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

CREATE INDEX IF NOT EXISTS idx_clients_date_of_birth
  ON clients(date_of_birth);

CREATE TABLE IF NOT EXISTS client_onboarding_sessions (
  phone TEXT PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'collect_name',
  pending_name TEXT,
  pending_contact TEXT,
  pending_date_of_birth DATE,
  booking_requested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_onboarding_state_check CHECK (
    state IN ('collect_name','confirm_whatsapp','collect_contact','collect_dob','complete')
  )
);

CREATE INDEX IF NOT EXISTS idx_client_onboarding_sessions_client_id
  ON client_onboarding_sessions(client_id);
