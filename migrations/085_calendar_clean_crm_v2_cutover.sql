-- Calendar Clean CRM V2 cutover compatibility seam.
--
-- This is an expand-only migration. It does not populate CRM V2, backfill an
-- appointment, or rewrite an existing pending booking or delivery obligation.
-- Legacy Admin/WhatsApp bookings continue to use client_id. New Calendar V2
-- bookings use crm_v2_client_id with client_id NULL and retain server-derived
-- client/mobile snapshots for acknowledgement and durable delivery.

ALTER TABLE admin_booking_sessions
  ALTER COLUMN client_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS crm_v2_client_id BIGINT
    REFERENCES crm_v2_clients(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS source_client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_mobile_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS acknowledged_mobile TEXT,
  ADD COLUMN IF NOT EXISTS mobile_acknowledged_at TIMESTAMPTZ;

ALTER TABLE admin_booking_sessions
  DROP CONSTRAINT IF EXISTS admin_booking_sessions_one_client_model_check,
  DROP CONSTRAINT IF EXISTS admin_booking_sessions_v2_snapshot_check,
  DROP CONSTRAINT IF EXISTS admin_booking_sessions_v2_acknowledgement_check;

ALTER TABLE admin_booking_sessions
  ADD CONSTRAINT admin_booking_sessions_one_client_model_check
    CHECK ((client_id IS NOT NULL) <> (crm_v2_client_id IS NOT NULL)),
  ADD CONSTRAINT admin_booking_sessions_v2_snapshot_check
    CHECK (
      crm_v2_client_id IS NULL
      OR (
        NULLIF(BTRIM(source_client_name), '') IS NOT NULL
        AND client_mobile_snapshot ~ '^27[678][0-9]{8}$'
      )
    ),
  ADD CONSTRAINT admin_booking_sessions_v2_acknowledgement_check
    CHECK (
      acknowledged_mobile IS NULL
      OR (
        crm_v2_client_id IS NOT NULL
        AND acknowledged_mobile = client_mobile_snapshot
        AND mobile_acknowledged_at IS NOT NULL
      )
    );

CREATE INDEX IF NOT EXISTS idx_admin_booking_sessions_crm_v2_client_id
  ON admin_booking_sessions(crm_v2_client_id)
  WHERE crm_v2_client_id IS NOT NULL;

ALTER TABLE customer_message_deliveries
  ADD COLUMN IF NOT EXISTS crm_v2_client_id BIGINT
    REFERENCES crm_v2_clients(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS recipient_mobile TEXT,
  ADD COLUMN IF NOT EXISTS client_name_snapshot TEXT;

ALTER TABLE customer_message_deliveries
  DROP CONSTRAINT IF EXISTS customer_message_deliveries_one_client_model_check,
  DROP CONSTRAINT IF EXISTS customer_message_deliveries_v2_recipient_check;

ALTER TABLE customer_message_deliveries
  ADD CONSTRAINT customer_message_deliveries_one_client_model_check
    CHECK (NOT (client_id IS NOT NULL AND crm_v2_client_id IS NOT NULL)),
  ADD CONSTRAINT customer_message_deliveries_v2_recipient_check
    CHECK (
      crm_v2_client_id IS NULL
      OR (
        recipient_mobile ~ '^27[678][0-9]{8}$'
        AND NULLIF(BTRIM(client_name_snapshot), '') IS NOT NULL
      )
    );

CREATE INDEX IF NOT EXISTS idx_customer_message_deliveries_crm_v2_client_id
  ON customer_message_deliveries(crm_v2_client_id)
  WHERE crm_v2_client_id IS NOT NULL;

ALTER TABLE IF EXISTS appointment_lifecycle
  ADD COLUMN IF NOT EXISTS crm_v2_client_id BIGINT
    REFERENCES crm_v2_clients(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS client_name_snapshot TEXT;

COMMENT ON COLUMN admin_booking_sessions.crm_v2_client_id IS
  'Server-owned CRM V2 identity for a pending new Calendar booking; mutually exclusive with legacy client_id.';
COMMENT ON COLUMN admin_booking_sessions.acknowledged_mobile IS
  'Server-derived CRM V2 mobile explicitly acknowledged by the authenticated Calendar operator.';
COMMENT ON COLUMN customer_message_deliveries.recipient_mobile IS
  'Final-commit recipient snapshot used by durable CRM V2 booking-confirmation retries.';
