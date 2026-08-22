-- Durable verified-client authority.
--
-- This migration intentionally performs NO trust backfill. Existing source,
-- contact type, verified_at, profile completeness, appointment history and
-- imported values remain provenance/proxy evidence only until an explicit
-- verification event is recorded under the ratified authority contract.

CREATE TABLE IF NOT EXISTS client_identity_verifications (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_contact_id BIGINT REFERENCES client_contacts(id) ON DELETE SET NULL,
  verification_method TEXT NOT NULL CHECK (BTRIM(verification_method) <> ''),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_identity_verifications_client_active
  ON client_identity_verifications(client_id, verified_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_client_identity_verifications_contact_active
  ON client_identity_verifications(client_contact_id, verified_at DESC)
  WHERE client_contact_id IS NOT NULL AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS uq_client_identity_verifications_active_method
  ON client_identity_verifications(client_id, COALESCE(client_contact_id, 0), verification_method)
  WHERE status = 'active';

ALTER TABLE client_onboarding_sessions
  ADD COLUMN IF NOT EXISTS authority_version TEXT;

COMMENT ON TABLE client_identity_verifications IS
  'Explicit Shiloh client/contact verification evidence. Provenance, imported labels, profile completeness, appointment history, contact_type and client_contacts.verified_at alone are not verified identity authority.';

COMMENT ON COLUMN client_identity_verifications.evidence_reference IS
  'Sanitized verification evidence/reference metadata only; do not duplicate imported address-book payloads here.';
