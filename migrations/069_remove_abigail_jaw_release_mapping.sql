-- Business-approved practitioner catalogue correction, 2026-08-20.
-- Remove only Abigail's eligibility for Upper Back, Neck & Jaw Release.
-- Preserve the canonical service row, all other practitioner mappings, and appointment history.

DO $$
DECLARE
  abigail_id BIGINT;
  abigail_count INTEGER;
  target_service_id BIGINT;
  target_service_count INTEGER;
  other_mapping_count_before BIGINT;
  other_mapping_count_after BIGINT;
  appointment_count_before BIGINT;
  appointment_count_after BIGINT;
BEGIN
  SELECT COUNT(*), MIN(id)
    INTO abigail_count, abigail_id
    FROM staff
   WHERE LOWER(display_name) = 'abigail'
     AND status = 'active'
     AND resource_type = 'practitioner';

  IF abigail_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active Abigail practitioner; found %', abigail_count;
  END IF;

  SELECT COUNT(*), MIN(id)
    INTO target_service_count, target_service_id
    FROM services
   WHERE external_source = 'goldie'
     AND external_id = 'b5c96105-f534-406d-89ec-68e78c65cf8b'
     AND name = 'Upper Back, Neck & Jaw Release'
     AND status = 'active';

  IF target_service_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active canonical Upper Back, Neck & Jaw Release service; found %', target_service_count;
  END IF;

  SELECT COUNT(*)
    INTO other_mapping_count_before
    FROM staff_services
   WHERE service_id = target_service_id
     AND staff_id <> abigail_id;

  SELECT COUNT(DISTINCT appointment_id)
    INTO appointment_count_before
    FROM appointment_services
   WHERE service_id = target_service_id;

  DELETE FROM staff_services
   WHERE service_id = target_service_id
     AND staff_id = abigail_id;

  IF EXISTS (
    SELECT 1
      FROM staff_services
     WHERE service_id = target_service_id
       AND staff_id = abigail_id
  ) THEN
    RAISE EXCEPTION 'Abigail still has Upper Back, Neck & Jaw Release practitioner eligibility';
  END IF;

  SELECT COUNT(*)
    INTO other_mapping_count_after
    FROM staff_services
   WHERE service_id = target_service_id
     AND staff_id <> abigail_id;

  SELECT COUNT(DISTINCT appointment_id)
    INTO appointment_count_after
    FROM appointment_services
   WHERE service_id = target_service_id;

  IF other_mapping_count_after <> other_mapping_count_before THEN
    RAISE EXCEPTION 'Non-Abigail practitioner mappings changed during Jaw Release correction';
  END IF;

  IF appointment_count_after <> appointment_count_before THEN
    RAISE EXCEPTION 'Appointment history changed during Jaw Release correction';
  END IF;
END $$;
