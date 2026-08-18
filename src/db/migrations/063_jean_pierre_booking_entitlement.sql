-- Explicit business-admin exception: Jean-Pierre shares only Christel + Abigail's
-- booking scope without requiring a manufactured practitioner link.
-- This replaces (and preserves the fail-closed character of) migration 062.

CREATE OR REPLACE FUNCTION enforce_admin_booking_practitioner_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_name text;
  linked_staff_id bigint;
  admin_business_role text;
  admin_calendar_scope text;
  admin_service_scope text;
  target_staff_name text;
  allowed boolean := false;
BEGIN
  SELECT LOWER(TRIM(a.display_name)), a.staff_id, a.business_role, a.calendar_scope, a.service_scope
    INTO admin_name, linked_staff_id, admin_business_role, admin_calendar_scope, admin_service_scope
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
  ELSIF admin_name = 'jean-pierre'
    AND admin_business_role = 'business_admin'
    AND admin_calendar_scope = 'all_business'
    AND admin_service_scope = 'all_services' THEN
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
