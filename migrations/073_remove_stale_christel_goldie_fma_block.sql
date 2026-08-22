DO $$
DECLARE
  v_christel_id BIGINT;
  v_staff_count INTEGER;
  v_target_count INTEGER;
BEGIN
  SELECT COUNT(*), MIN(id)
    INTO v_staff_count, v_christel_id
    FROM staff
   WHERE LOWER(TRIM(display_name)) = 'christel'
     AND status = 'active'
     AND resource_type = 'practitioner';

  IF v_staff_count <> 1 THEN
    RAISE EXCEPTION '073 expected exactly one active Christel practitioner; found %', v_staff_count;
  END IF;

  SELECT COUNT(*)
    INTO v_target_count
    FROM calendar_blocks cb
   WHERE cb.id = 141
     AND cb.staff_id = v_christel_id
     AND cb.block_type = 'time_off'
     AND cb.starts_at = TIMESTAMPTZ '2026-08-29 06:00:00+00'
     AND cb.ends_at = TIMESTAMPTZ '2026-08-29 22:00:00+00'
     AND cb.title = 'FMA Course'
     AND cb.source = 'goldie_import';

  IF v_target_count <> 1 THEN
    RAISE EXCEPTION '073 exact stale Goldie block precondition failed; matched % rows', v_target_count;
  END IF;

  DELETE FROM calendar_blocks cb
   WHERE cb.id = 141
     AND cb.staff_id = v_christel_id
     AND cb.block_type = 'time_off'
     AND cb.starts_at = TIMESTAMPTZ '2026-08-29 06:00:00+00'
     AND cb.ends_at = TIMESTAMPTZ '2026-08-29 22:00:00+00'
     AND cb.title = 'FMA Course'
     AND cb.source = 'goldie_import';

  IF NOT FOUND THEN
    RAISE EXCEPTION '073 stale Goldie block was not removed';
  END IF;
END $$;
