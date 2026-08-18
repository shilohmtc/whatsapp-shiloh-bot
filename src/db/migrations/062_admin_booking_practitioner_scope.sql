-- Fail-closed practitioner scope for admin-created bookings.
-- Business/menu capability is deliberately separate from practitioner booking entitlement.

CREATE OR REPLACE FUNCTION enforce_admin_booking_practitioner_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_name text;
  linked_staff_id bigint;
  target_staff_name text;
  allowed boolean := false;
BEGIN
  SELECT LOWER(TRIM(a.display_name)), a.staff_id
    INTO admin_name, linked_staff_id
    FROM staff_admin_accounts a
   WHERE a.id = NEW.admin_id
     AND a.active = TRUE;

  SELECT LOWER(TRIM(s.display_name))
    INTO target_staff_name
    FROM staff s
   WHERE s.id = NEW.staff_id
     AND s.status = 'active';

  IF admin_name IS NULL OR target_staff_name IS NULL THEN
    RAISE EXCEPTION 'admin_booking_scope_denied: unresolved active admin or practitioner';
  END IF;

  IF admin_name IN ('christel', 'abigail') THEN
    allowed := target_staff_name IN ('christel', 'abigail');
  ELSIF admin_name = 'marietjie' THEN
    allowed := target_staff_name = 'marietjie';
  ELSIF linked_staff_id IS NOT NULL THEN
    allowed := linked_staff_id = NEW.staff_id;
  ELSE
    allowed := false;
  END IF;

  IF NOT allowed THEN
    RAISE EXCEPTION 'admin_booking_scope_denied: admin % cannot book practitioner %', admin_name, target_staff_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_booking_practitioner_scope ON admin_booking_sessions;
CREATE TRIGGER trg_admin_booking_practitioner_scope
BEFORE INSERT OR UPDATE OF staff_id, admin_id
ON admin_booking_sessions
FOR EACH ROW
EXECUTE FUNCTION enforce_admin_booking_practitioner_scope();
