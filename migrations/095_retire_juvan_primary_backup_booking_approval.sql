-- Booking & Admin UX: retire controlled Juvan Primary/Backup approval for future bookings.
-- Historical appointment_booking_approvals rows using controlled_juvan_primary_backup
-- remain untouched and continue to be interpreted by application compatibility code.
--
-- Future controlled-Juvan bookings now use the same assigned-practitioner approval
-- authority as ordinary client WhatsApp bookings. Dummy Test compatibility and the
-- Abigail -> Christel observer rule remain unchanged.

CREATE OR REPLACE FUNCTION create_client_booking_approval_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_source TEXT;
  booking_client_name TEXT;
  observer_id BIGINT;
  required_approver_id BIGINT;
  required_approver_admin_id BIGINT;
  required_approval_mode TEXT;
  dummy_count INTEGER;
  jp_count INTEGER;
BEGIN
  SELECT a.source, c.display_name
    INTO booking_source, booking_client_name
    FROM appointments a
    JOIN clients c ON c.id = a.client_id
   WHERE a.id = NEW.appointment_id;

  IF booking_source IS DISTINCT FROM 'shiloh_client_whatsapp' OR NEW.position <> 1 THEN
    RETURN NEW;
  END IF;

  observer_id := NULL;
  required_approver_id := NEW.staff_id;
  required_approver_admin_id := NULL;
  required_approval_mode := 'standard';

  IF LOWER(TRIM(COALESCE(booking_client_name, ''))) = 'dummy test' THEN
    SELECT COUNT(*)::int
      INTO dummy_count
      FROM clients c
     WHERE LOWER(TRIM(c.display_name)) = 'dummy test'
       AND c.status = 'active';

    IF dummy_count <> 1 THEN
      RAISE EXCEPTION 'Dummy Test approval blocked: expected exactly one active CRM Dummy Test profile';
    END IF;

    SELECT COUNT(*)::int, MIN(saa.id)
      INTO jp_count, required_approver_admin_id
      FROM staff_admin_accounts saa
     WHERE LOWER(TRIM(saa.display_name)) = 'jean-pierre'
       AND saa.active = TRUE
       AND saa.business_role = 'business_admin'
       AND saa.calendar_scope = 'all_business'
       AND saa.service_scope = 'all_services'
       AND saa.normalized_whatsapp IS NOT NULL;

    IF jp_count <> 1 OR required_approver_admin_id IS NULL THEN
      RAISE EXCEPTION 'Dummy Test approval blocked: expected exactly one active Jean-Pierre business_admin account with all_business/all_services scope and WhatsApp identity';
    END IF;

    required_approver_id := NULL;
  ELSIF LOWER(COALESCE(NEW.staff_name_snapshot, '')) = 'abigail' THEN
    SELECT id INTO observer_id
      FROM staff
     WHERE LOWER(display_name) = 'christel'
       AND status = 'active'
     ORDER BY id
     LIMIT 1;
  END IF;

  INSERT INTO appointment_booking_approvals
    (appointment_id, approver_staff_id, approver_admin_id, observer_staff_id, status, approval_mode)
  VALUES
    (NEW.appointment_id, required_approver_id, required_approver_admin_id, observer_id, 'pending', required_approval_mode)
  ON CONFLICT (appointment_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_booking_approval_hold ON appointment_staff;
CREATE TRIGGER trg_client_booking_approval_hold
AFTER INSERT ON appointment_staff
FOR EACH ROW
EXECUTE FUNCTION create_client_booking_approval_hold();
