-- SHILOH-STAFF-WHATSAPP-PASSKEY-BOOTSTRAP-V1
-- Reuse the existing hashed one-time bootstrap authority with explicit purpose isolation,
-- and add a WebAuthn registration challenge purpose that is admin-bound but sessionless.
-- No plaintext setup token, biometric, private key, session token, TOTP secret, recovery code,
-- provider credential, role, scope, or capability is stored or broadened by this migration.

ALTER TABLE staff_auth_break_glass_bootstraps
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'break_glass';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_auth_bootstrap_purpose_check') THEN
    ALTER TABLE staff_auth_break_glass_bootstraps
      ADD CONSTRAINT staff_auth_bootstrap_purpose_check
      CHECK (purpose IN ('break_glass', 'passkey_bootstrap'));
  END IF;
END $$;

DROP INDEX IF EXISTS uq_staff_auth_open_break_glass_per_admin;
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_auth_open_bootstrap_per_admin_purpose
  ON staff_auth_break_glass_bootstraps(admin_id, purpose)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

ALTER TABLE staff_auth_webauthn_challenges
  DROP CONSTRAINT IF EXISTS staff_auth_webauthn_purpose_check;
ALTER TABLE staff_auth_webauthn_challenges
  ADD CONSTRAINT staff_auth_webauthn_purpose_check
    CHECK (purpose IN ('registration', 'authentication', 'bootstrap_registration'));

ALTER TABLE staff_auth_webauthn_challenges
  DROP CONSTRAINT IF EXISTS staff_auth_webauthn_registration_binding_check;
ALTER TABLE staff_auth_webauthn_challenges
  ADD CONSTRAINT staff_auth_webauthn_registration_binding_check CHECK (
    (purpose = 'registration' AND admin_id IS NOT NULL AND session_id IS NOT NULL)
    OR (purpose = 'bootstrap_registration' AND admin_id IS NOT NULL AND session_id IS NULL)
    OR (purpose = 'authentication' AND admin_id IS NOT NULL AND session_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_staff_auth_webauthn_bootstrap_registration_admin
  ON staff_auth_webauthn_challenges(admin_id, expires_at DESC)
  WHERE purpose = 'bootstrap_registration' AND consumed_at IS NULL;
