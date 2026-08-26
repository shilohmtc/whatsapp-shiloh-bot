ALTER TABLE staff_auth_recovery_codes
  DROP CONSTRAINT staff_auth_recovery_hash_check,
  ADD CONSTRAINT staff_auth_recovery_hash_check
    CHECK (code_hash ~ '^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$');
