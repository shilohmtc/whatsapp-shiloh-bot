ALTER TABLE appointment_booking_approvals
  ADD COLUMN IF NOT EXISTS approver_notification_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approver_message_id TEXT,
  ADD COLUMN IF NOT EXISTS last_approver_notification_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_booking_approvals_pending_delivery
  ON appointment_booking_approvals(status, requested_at, last_approver_notification_attempt_at);
