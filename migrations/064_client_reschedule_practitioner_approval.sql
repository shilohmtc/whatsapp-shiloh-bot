CREATE TABLE IF NOT EXISTS appointment_reschedule_requests (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  client_id BIGINT NOT NULL REFERENCES clients(id),
  service_id BIGINT REFERENCES services(id),
  approver_staff_id BIGINT NOT NULL REFERENCES staff(id),
  requested_by_phone VARCHAR(32) NOT NULL,
  original_starts_at TIMESTAMPTZ NOT NULL,
  original_ends_at TIMESTAMPTZ NOT NULL,
  proposed_starts_at TIMESTAMPTZ NOT NULL,
  proposed_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined','withdrawn','superseded','notification_failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approver_notified_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by_admin_id BIGINT REFERENCES staff_admin_accounts(id),
  decision_note TEXT,
  client_notified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_reschedule_requests_pending_appointment
  ON appointment_reschedule_requests(appointment_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_appointment_reschedule_requests_pending_staff
  ON appointment_reschedule_requests(approver_staff_id, proposed_starts_at, proposed_ends_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_appointment_reschedule_requests_status_requested
  ON appointment_reschedule_requests(status, requested_at);
