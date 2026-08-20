ALTER TABLE appointment_reschedule_requests
  ADD COLUMN IF NOT EXISTS client_notification_attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_notification_last_error TEXT,
  ADD COLUMN IF NOT EXISTS client_notification_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_notification_suppressed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_notification_suppression_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_appointment_reschedule_requests_approved_unnotified
  ON appointment_reschedule_requests(updated_at, id)
  WHERE status='approved'
    AND client_notified_at IS NULL
    AND client_notification_suppressed_at IS NULL;
