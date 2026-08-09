-- CRM-2 roster cleanup: retire obsolete SHILOH MTC operational staff record.
-- Historical appointment attribution is intentionally preserved.

DO $$
DECLARE
  target_count INTEGER;
  target_id BIGINT;
BEGIN
  SELECT COUNT(*), MIN(id)
    INTO target_count, target_id
    FROM staff
   WHERE LOWER(TRIM(display_name)) = LOWER('SHILOH MTC');

  IF target_count = 0 THEN
    RAISE NOTICE 'SHILOH MTC staff record already absent; nothing to retire.';
    RETURN;
  END IF;

  IF target_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one SHILOH MTC staff record, found %; refusing retirement.', target_count;
  END IF;

  UPDATE staff
     SET status = 'inactive', updated_at = NOW()
   WHERE id = target_id;

  -- Remove current operational scheduling state only. Historical appointment_staff rows remain untouched.
  DELETE FROM staff_working_hours WHERE staff_id = target_id;
  DELETE FROM staff_schedule_exceptions WHERE staff_id = target_id;
  DELETE FROM calendar_blocks WHERE staff_id = target_id;

  RAISE NOTICE 'Retired SHILOH MTC staff id %; historical appointment attribution preserved.', target_id;
END $$;
