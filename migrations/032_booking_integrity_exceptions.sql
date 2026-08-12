-- Booking-integrity review ledger for calendar events that are not CRM-linked.
-- This table never creates appointments and never authorizes outbound messaging.

CREATE TABLE IF NOT EXISTS booking_integrity_exceptions (
  id BIGSERIAL PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  practitioner TEXT NOT NULL,
  summary TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  classification TEXT NOT NULL CHECK (classification IN ('booking_like','calendar_block')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','observed','resolved')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (calendar_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_integrity_open
  ON booking_integrity_exceptions(status, starts_at)
  WHERE status = 'open';
