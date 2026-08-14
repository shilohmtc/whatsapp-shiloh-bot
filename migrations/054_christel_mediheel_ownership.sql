-- Authoritative clinic correction: active MediHeel / Elim treatments are Christel-only.
-- This supersedes the Marietjie assignment in migration 053 for these services only.
-- It does not create, activate, rename, reprice, or otherwise modify services.

DO $$
DECLARE
  christel_id BIGINT;
  christel_count INTEGER;
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

  DELETE FROM staff_services ss
   USING services s
   WHERE ss.service_id = s.id
     AND s.status = 'active'
     AND ss.staff_id <> christel_id
     AND (
       LOWER(s.name) LIKE '%medi-heel%'
       OR LOWER(s.name) LIKE '%mediheel%'
       OR LOWER(s.name) LIKE '%elim%'
     );

  INSERT INTO staff_services (staff_id, service_id)
  SELECT christel_id, s.id
    FROM services s
   WHERE s.status = 'active'
     AND (
       LOWER(s.name) LIKE '%medi-heel%'
       OR LOWER(s.name) LIKE '%mediheel%'
       OR LOWER(s.name) LIKE '%elim%'
     )
  ON CONFLICT (staff_id, service_id) DO NOTHING;
END $$;
