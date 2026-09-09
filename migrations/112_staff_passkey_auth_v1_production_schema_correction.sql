-- SHILOH-STAFF-PASSKEY-AUTH-V1-PRODUCTION-SCHEMA-CORRECTION
-- Correct PostgreSQL credential-id validation and bind authentication challenges to the known canonical admin.

ALTER TABLE staff_auth_passkey_credentials
  DROP CONSTRAINT IF EXISTS staff_auth_passkey_credential_id_check;
ALTER TABLE staff_auth_passkey_credentials
  ADD CONSTRAINT staff_auth_passkey_credential_id_check CHECK (
    char_length(credential_id) BETWEEN 16 AND 1366
    AND credential_id ~ '^[A-Za-z0-9_-]+$'
  );

ALTER TABLE staff_auth_webauthn_challenges
  DROP CONSTRAINT IF EXISTS staff_auth_webauthn_registration_binding_check;
ALTER TABLE staff_auth_webauthn_challenges
  ADD CONSTRAINT staff_auth_webauthn_registration_binding_check CHECK (
    (purpose = 'registration' AND admin_id IS NOT NULL AND session_id IS NOT NULL)
    OR (purpose = 'authentication' AND admin_id IS NOT NULL AND session_id IS NULL)
  );
