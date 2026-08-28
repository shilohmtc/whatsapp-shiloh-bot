-- WhatsApp / CRM V2 identity compatibility foundation.
--
-- Expand only: retained legacy onboarding rows are neither copied nor updated.
-- A session may remain unbound while collecting registration details, but once
-- bound it can reference exactly one legacy client or one CRM V2 client.

ALTER TABLE client_onboarding_sessions
  ADD COLUMN IF NOT EXISTS crm_v2_client_id BIGINT
    REFERENCES crm_v2_clients(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS identity_model TEXT;

ALTER TABLE client_onboarding_sessions
  ADD CONSTRAINT client_onboarding_sessions_identity_xor_check
    CHECK (num_nonnulls(client_id, crm_v2_client_id) <= 1),
  ADD CONSTRAINT client_onboarding_sessions_identity_model_check
    CHECK (
      (client_id IS NULL AND crm_v2_client_id IS NULL AND identity_model IS NULL)
      OR (client_id IS NOT NULL AND crm_v2_client_id IS NULL AND identity_model = 'legacy')
      OR (client_id IS NULL AND crm_v2_client_id IS NOT NULL AND identity_model = 'crm_v2')
    ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_client_onboarding_sessions_crm_v2_client_id
  ON client_onboarding_sessions(crm_v2_client_id)
  WHERE crm_v2_client_id IS NOT NULL;

COMMENT ON COLUMN client_onboarding_sessions.crm_v2_client_id IS
  'Canonical CRM V2 identity for future WhatsApp activation; mutually exclusive with retained legacy client_id.';

COMMENT ON COLUMN client_onboarding_sessions.identity_model IS
  'Durable discriminant: legacy or crm_v2. NULL is retained only for unbound or pre-086 legacy rows until their next normal write.';
