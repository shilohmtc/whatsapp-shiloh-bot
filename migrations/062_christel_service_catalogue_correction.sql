-- Controlled Christel catalogue correction approved 2026-08-18.
--
-- Scope is deliberately limited to the reviewed Christel services below. The
-- duplicate 90-minute Sports Massage service is retired without deleting its
-- service row or appointment links. Canonical duration fields are corrected at
-- service level; no price, name, description, package or appointment data is
-- rewritten.

DO $$
DECLARE
  christel_id BIGINT;
  christel_count INTEGER;
  unexpected_buffers TEXT;
  retired_history_before BIGINT;
  retained_history_before BIGINT;
  retired_history_after BIGINT;
  retained_history_after BIGINT;
BEGIN
  SELECT COUNT(*), MIN(id)
    INTO christel_count, christel_id
    FROM staff
   WHERE LOWER(display_name) = 'christel'
     AND status = 'active'
     AND resource_type = 'practitioner';

  IF christel_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active Christel practitioner; found %', christel_count;
  END IF;

  -- This is the durable form of the mandatory pre-implementation scope gate:
  -- every active service mapped to Christel is inspected, and an unreviewed
  -- non-zero buffer aborts the entire transaction before any correction occurs.
  SELECT STRING_AGG(
           FORMAT('#%s %s (%s + %s + %s)', s.id, s.name,
                  s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes),
           '; ' ORDER BY s.id
         )
    INTO unexpected_buffers
    FROM services s
    JOIN staff_services ss ON ss.service_id = s.id
   WHERE ss.staff_id = christel_id
     AND s.status = 'active'
     AND (s.processing_time_minutes <> 0 OR s.extra_time_minutes <> 0)
     AND NOT (
       COALESCE(s.external_source, '') = 'goldie'
       AND COALESCE(s.external_id, '') = ANY (ARRAY[
         'e4510fa9-579f-46dd-8fff-107c00748597',
         '61a0a7db-426d-4ecf-94ff-9fd6855f384d',
         'b39dcaf1-7894-40e0-8a51-c7ab4eba553a'
       ]::TEXT[])
     );

  IF unexpected_buffers IS NOT NULL THEN
    RAISE EXCEPTION 'Unreviewed Christel service buffer conflict: %', unexpected_buffers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM services
     WHERE id = 27
       AND external_source = 'goldie'
       AND external_id = '1d734e8b-d21e-44c3-9a3f-b2a7165a7787'
       AND duration_minutes = 90
       AND processing_time_minutes = 0
       AND extra_time_minutes = 0
       AND status IN ('active', 'inactive')
  ) THEN
    RAISE EXCEPTION 'Controlled retirement target service #27 does not match the reviewed canonical record';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM services
     WHERE id = 34
       AND external_source = 'goldie'
       AND external_id = '46043512-d1df-4169-92b4-132160fca809'
       AND status = 'active'
       AND duration_minutes = 120
       AND processing_time_minutes = 0
       AND extra_time_minutes = 0
  ) THEN
    RAISE EXCEPTION 'Distinct 120-minute Sports Massage service #34 does not match the reviewed canonical record';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM services
     WHERE id = 65
       AND external_source = 'shiloh_package'
       AND external_id = 'sports-massage-monthly-session'
       AND status = 'active'
       AND duration_minutes = 50
       AND processing_time_minutes = 0
       AND extra_time_minutes = 0
  ) THEN
    RAISE EXCEPTION 'Package-only Sports Massage service #65 does not match the reviewed canonical record';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM services s
    JOIN staff_services ss ON ss.service_id = s.id AND ss.staff_id = christel_id
     WHERE s.external_source = 'goldie'
       AND s.external_id = 'e4510fa9-579f-46dd-8fff-107c00748597'
       AND s.status = 'active'
       AND s.duration_minutes = 60
       AND s.processing_time_minutes = 0
       AND s.extra_time_minutes IN (0, 15)
  ) THEN
    RAISE EXCEPTION 'Reviewed Medi-Heel service does not match the approved 60-minute correction target';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM services s
    JOIN staff_services ss ON ss.service_id = s.id AND ss.staff_id = christel_id
     WHERE s.external_source = 'goldie'
       AND s.external_id = '61a0a7db-426d-4ecf-94ff-9fd6855f384d'
       AND s.status = 'active'
       AND s.duration_minutes = 90
       AND s.processing_time_minutes = 0
       AND s.extra_time_minutes IN (0, 15)
  ) THEN
    RAISE EXCEPTION 'Reviewed Full Body Swedish service does not match the approved 90-minute correction target';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM services s
    JOIN staff_services ss ON ss.service_id = s.id AND ss.staff_id = christel_id
     WHERE s.external_source = 'goldie'
       AND s.external_id = 'b39dcaf1-7894-40e0-8a51-c7ab4eba553a'
       AND s.status = 'active'
       AND s.duration_minutes = 90
       AND s.processing_time_minutes IN (0, 5)
       AND s.extra_time_minutes = 0
  ) THEN
    RAISE EXCEPTION 'Reviewed Lower Back, Hip & Psoas service does not match the approved 90-minute correction target';
  END IF;

  SELECT COUNT(DISTINCT aps.appointment_id)
    INTO retired_history_before
    FROM appointment_services aps
   WHERE aps.service_id = 27;

  SELECT COUNT(DISTINCT aps.appointment_id)
    INTO retained_history_before
    FROM appointment_services aps
   WHERE aps.service_id = 34;

  UPDATE services
     SET status = 'inactive',
         updated_at = NOW()
   WHERE id = 27
     AND status <> 'inactive';

  DELETE FROM staff_services
   WHERE service_id = 27;

  UPDATE services
     SET extra_time_minutes = 0,
         updated_at = NOW()
   WHERE external_source = 'goldie'
     AND external_id IN (
       'e4510fa9-579f-46dd-8fff-107c00748597',
       '61a0a7db-426d-4ecf-94ff-9fd6855f384d'
     )
     AND extra_time_minutes <> 0;

  UPDATE services
     SET processing_time_minutes = 0,
         updated_at = NOW()
   WHERE external_source = 'goldie'
     AND external_id = 'b39dcaf1-7894-40e0-8a51-c7ab4eba553a'
     AND processing_time_minutes <> 0;

  SELECT COUNT(DISTINCT aps.appointment_id)
    INTO retired_history_after
    FROM appointment_services aps
   WHERE aps.service_id = 27;

  SELECT COUNT(DISTINCT aps.appointment_id)
    INTO retained_history_after
    FROM appointment_services aps
   WHERE aps.service_id = 34;

  IF retired_history_after <> retired_history_before
     OR retained_history_after <> retained_history_before THEN
    RAISE EXCEPTION 'Appointment history changed during controlled Christel catalogue correction';
  END IF;

  IF EXISTS (SELECT 1 FROM staff_services WHERE service_id = 27) THEN
    RAISE EXCEPTION 'Retired service #27 still has practitioner eligibility';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM services
     WHERE id = 27 AND status = 'inactive'
  ) OR NOT EXISTS (
    SELECT 1 FROM services
     WHERE id = 34 AND status = 'active'
       AND duration_minutes + processing_time_minutes + extra_time_minutes = 120
  ) OR NOT EXISTS (
    SELECT 1 FROM services
     WHERE id = 65 AND status = 'active'
       AND duration_minutes + processing_time_minutes + extra_time_minutes = 50
  ) THEN
    RAISE EXCEPTION 'Sports Massage retirement/retention postcondition failed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM services
     WHERE external_source = 'goldie'
       AND external_id = 'e4510fa9-579f-46dd-8fff-107c00748597'
       AND (duration_minutes <> 60 OR processing_time_minutes <> 0 OR extra_time_minutes <> 0)
  ) OR EXISTS (
    SELECT 1 FROM services
     WHERE external_source = 'goldie'
       AND external_id = '61a0a7db-426d-4ecf-94ff-9fd6855f384d'
       AND (duration_minutes <> 90 OR processing_time_minutes <> 0 OR extra_time_minutes <> 0)
  ) OR EXISTS (
    SELECT 1 FROM services
     WHERE external_source = 'goldie'
       AND external_id = 'b39dcaf1-7894-40e0-8a51-c7ab4eba553a'
       AND (duration_minutes <> 90 OR processing_time_minutes <> 0 OR extra_time_minutes <> 0)
  ) THEN
    RAISE EXCEPTION 'Reviewed Christel duration postcondition failed';
  END IF;
END $$;
