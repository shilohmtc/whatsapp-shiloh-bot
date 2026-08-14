-- Repair active Elim MediHeel / pedicure service ownership to the current
-- client-facing business rule: these services are Marietjie-only.
-- This does not create, activate, rename, reprice, or otherwise modify services.

DO $$
DECLARE
  marietjie_id BIGINT;
  marietjie_count INTEGER;
BEGIN
  SELECT COUNT(*), MIN(id)
    INTO marietjie_count, marietjie_id
    FROM staff
   WHERE LOWER(display_name) = 'marietjie'
     AND status = 'active'
     AND resource_type = 'practitioner';

  IF marietjie_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active Marietjie practitioner; found %', marietjie_count;
  END IF;

  DELETE FROM staff_services ss
   USING services s
   LEFT JOIN service_categories sc ON sc.id = s.category_id
   WHERE ss.service_id = s.id
     AND s.status = 'active'
     AND ss.staff_id <> marietjie_id
     AND (
       LOWER(COALESCE(sc.name, '')) = 'pedicures & foot care'
       OR LOWER(s.name) LIKE '%pedicur%'
       OR LOWER(s.name) LIKE '%medi-heel%'
       OR LOWER(s.name) LIKE '%mediheel%'
       OR LOWER(s.name) LIKE '%elim%'
     );

  INSERT INTO staff_services (staff_id, service_id)
  SELECT marietjie_id, s.id
    FROM services s
    LEFT JOIN service_categories sc ON sc.id = s.category_id
   WHERE s.status = 'active'
     AND (
       LOWER(COALESCE(sc.name, '')) = 'pedicures & foot care'
       OR LOWER(s.name) LIKE '%pedicur%'
       OR LOWER(s.name) LIKE '%medi-heel%'
       OR LOWER(s.name) LIKE '%mediheel%'
       OR LOWER(s.name) LIKE '%elim%'
     )
  ON CONFLICT (staff_id, service_id) DO NOTHING;
END $$;
