-- #605: align the recovery-code persistence CHECK with the canonical runtime
-- serialization emitted by providerIndependentStaffAuth.hashRecoveryCode().
--
-- Historical migration 081 used over-escaped dollar separators in the regex.
-- Do not edit 081: it is already in the production migration ledger and changing
-- it would create checksum drift. This additive migration replaces only the CHECK.
--
-- Canonical format today:
--   scrypt$16384$8$1$<16-byte base64url salt>$<32-byte base64url derived key>
--   salt: 22 unpadded base64url characters
--   derived key: 43 unpadded base64url characters

ALTER TABLE staff_auth_recovery_codes
  DROP CONSTRAINT IF EXISTS staff_auth_recovery_hash_check;

ALTER TABLE staff_auth_recovery_codes
  ADD CONSTRAINT staff_auth_recovery_hash_check
  CHECK (
    code_hash ~ '^scrypt[$]16384[$]8[$]1[$][A-Za-z0-9_-]{22}[$][A-Za-z0-9_-]{43}$'
  );
