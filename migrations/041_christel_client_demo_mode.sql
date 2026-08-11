-- Controlled client-demo mode for showing Shiloh's first-appointment experience.
-- Only Christel receives the explicit permission. Demo appointments are separately
-- tagged by source in application code and can be purged only through the guarded
-- demo cleanup lifecycle.

CREATE TABLE IF NOT EXISTS admin_client_demo_sessions (
  admin_id BIGINT PRIMARY KEY REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
  normalized_whatsapp VARCHAR(32) NOT NULL UNIQUE,
  virtual_phone VARCHAR(32) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  state TEXT NOT NULL DEFAULT 'client'
    CHECK (state IN ('client','collect_practitioner','awaiting_booking_confirmation','booked')),
  demo_client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  demo_appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  pending_staff_name TEXT,
  delete_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"demo:client":true}'::jsonb,
    updated_at = NOW()
WHERE active = TRUE
  AND LOWER(display_name) = 'christel'
  AND business_role = 'owner';
