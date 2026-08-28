ALTER TABLE appointment_reschedule_requests
  ALTER COLUMN client_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS crm_v2_client_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'appointment_reschedule_requests'::regclass
       AND conname = 'appointment_reschedule_requests_crm_v2_client_id_fkey'
  ) THEN
    ALTER TABLE appointment_reschedule_requests
      ADD CONSTRAINT appointment_reschedule_requests_crm_v2_client_id_fkey
      FOREIGN KEY (crm_v2_client_id)
      REFERENCES crm_v2_clients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE appointment_reschedule_requests
  DROP CONSTRAINT IF EXISTS appointment_reschedule_requests_client_identity_xor;

ALTER TABLE appointment_reschedule_requests
  ADD CONSTRAINT appointment_reschedule_requests_client_identity_xor
  CHECK (num_nonnulls(client_id, crm_v2_client_id) = 1)
  NOT VALID;

ALTER TABLE appointment_reschedule_requests
  VALIDATE CONSTRAINT appointment_reschedule_requests_client_identity_xor;
