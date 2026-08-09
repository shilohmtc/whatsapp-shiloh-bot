-- CRM-1: guarded WhatsApp Admin Assistant booking creation.
-- Adds persistent pending booking confirmations and grants explicit appointment:create permission.
-- Does not modify any completed historical migration or reconciliation decision.

CREATE TABLE IF NOT EXISTS admin_booking_sessions (
  admin_id BIGINT PRIMARY KEY REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  state TEXT NOT NULL DEFAULT 'confirm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_booking_sessions_time_check CHECK (ends_at > starts_at),
  CONSTRAINT admin_booking_sessions_state_check CHECK (state IN ('confirm'))
);

CREATE INDEX IF NOT EXISTS idx_admin_booking_sessions_starts_at
  ON admin_booking_sessions(starts_at);

UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"appointment:create":true}'::jsonb,
    updated_at = NOW()
WHERE active = TRUE;
