-- One-purpose CRM maintenance migration authorized for production.
-- Permanently removes only the obsolete canonical staff record named SHILOH MTC.
-- Historical appointment linkage is a hard safety stop: if this staff row is referenced
-- by appointment_staff, the migration aborts and rolls back without changing anything.

DO $$
DECLARE
  target_id BIGINT;
  target_count INTEGER;
BEGIN
  SELECT COUNT(*), MIN(id)
    INTO target_count, target_id
    FROM staff
   WHERE LOWER(TRIM(display_name)) = LOWER('SHILOH MTC');

  IF target_count = 0 THEN
    RAISE NOTICE 'SHILOH MTC staff record is already absent; nothing to remove.';
    RETURN;
  END IF;

  IF target_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one SHILOH MTC staff record, found %; refusing deletion.', target_count;
  END IF;

  IF EXISTS (SELECT 1 FROM appointment_staff WHERE staff_id = target_id) THEN
    RAISE EXCEPTION 'SHILOH MTC staff id % has canonical appointment history; refusing hard deletion.', target_id;
  END IF;

  -- Remove only operational/configuration rows owned by this obsolete staff record.
  DELETE FROM staff_schedule_exceptions WHERE staff_id = target_id;
  DELETE FROM staff_working_hours WHERE staff_id = target_id;
  DELETE FROM calendar_blocks WHERE staff_id = target_id;
  DELETE FROM staff_services WHERE staff_id = target_id;
  DELETE FROM staff_admin_accounts WHERE staff_id = target_id;

  -- Any unexpected remaining foreign-key dependency will cause this DELETE to fail
  -- and the entire migration transaction to roll back, preserving the record safely.
  DELETE FROM staff WHERE id = target_id;

  RAISE NOTICE 'Removed obsolete SHILOH MTC staff id %.', target_id;
END $$;
