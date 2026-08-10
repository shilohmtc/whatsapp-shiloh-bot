CREATE TABLE IF NOT EXISTS appointment_calendar_share_tokens (
  appointment_id BIGINT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
