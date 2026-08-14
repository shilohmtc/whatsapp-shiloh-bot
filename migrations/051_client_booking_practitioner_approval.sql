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

CREATE OR REPLACE FUNCTION create_client_booking_approval_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_source TEXT;
  observer_id BIGINT;
BEGIN
  SELECT source INTO booking_source FROM appointments WHERE id = NEW.appointment_id;
  IF booking_source IS DISTINCT FROM 'shiloh_client_whatsapp' OR NEW.position <> 1 THEN
    RETURN NEW;
  END IF;

  observer_id := NULL;
  IF LOWER(COALESCE(NEW.staff_name_snapshot, '')) = 'abigail' THEN
    SELECT id INTO observer_id
      FROM staff
     WHERE LOWER(display_name) = 'christel'
       AND status = 'active'
     ORDER BY id
     LIMIT 1;
  END IF;

  INSERT INTO appointment_booking_approvals
    (appointment_id, approver_staff_id, observer_staff_id, status)
  VALUES (NEW.appointment_id, NEW.staff_id, observer_id, 'pending')
  ON CONFLICT (appointment_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_booking_approval_hold ON appointment_staff;
CREATE TRIGGER trg_client_booking_approval_hold
AFTER INSERT ON appointment_staff
FOR EACH ROW
EXECUTE FUNCTION create_client_booking_approval_hold();
