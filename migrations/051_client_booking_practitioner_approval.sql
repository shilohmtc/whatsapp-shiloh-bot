CREATE TABLE IF NOT EXISTS appointment_booking_approvals (
  appointment_id BIGINT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
  approver_staff_id BIGINT NOT NULL REFERENCES staff(id),
  observer_staff_id BIGINT REFERENCES staff(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approver_notified_at TIMESTAMPTZ,
  observer_notified_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by_admin_id BIGINT,
  decision_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_status
  ON appointment_booking_approvals(status, requested_at);

CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_approver
  ON appointment_booking_approvals(approver_staff_id, status);
