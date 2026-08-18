ALTER TABLE appointment_booking_approvals
  ADD COLUMN IF NOT EXISTS approver_template_name TEXT;
