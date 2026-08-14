-- Client booking approval model correction:
-- Jean-Pierre is an authenticated project/business admin and may intentionally have staff_id NULL.
-- Support a specific admin account as the required approver without inventing a clinic staff record.

ALTER TABLE appointment_booking_approvals
  ADD COLUMN IF NOT EXISTS approver_admin_id BIGINT REFERENCES staff_admin_accounts(id);

ALTER TABLE appointment_booking_approvals
  ALTER COLUMN approver_staff_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_admin_approver
  ON appointment_booking_approvals(approver_admin_id, status);
