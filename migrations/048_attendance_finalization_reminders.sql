CREATE TABLE IF NOT EXISTS attendance_finalization_reminders (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
  clinic_date DATE NOT NULL,
  reminder_kind TEXT NOT NULL CHECK (reminder_kind IN ('end_of_day','next_morning')),
  pending_count INTEGER NOT NULL CHECK (pending_count > 0),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admin_id, clinic_date, reminder_kind)
);

CREATE INDEX IF NOT EXISTS idx_attendance_finalization_reminders_date
  ON attendance_finalization_reminders (clinic_date, reminder_kind);
