-- C1.9: durable recovery ledger for client booking Calendar writes whose provider outcome may be uncertain.
-- appointment_id intentionally has no foreign key because the surrounding CRM transaction may roll back.

CREATE TABLE IF NOT EXISTS client_booking_calendar_write_attempts (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  appointment_id BIGINT NOT NULL,
  staff_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconciled_at TIMESTAMPTZ,
  resolution TEXT,
  last_error TEXT,
  UNIQUE (provider, calendar_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_client_booking_calendar_write_attempts_pending
  ON client_booking_calendar_write_attempts(provider, staff_name, starts_at, ends_at, id)
  WHERE reconciled_at IS NULL;
