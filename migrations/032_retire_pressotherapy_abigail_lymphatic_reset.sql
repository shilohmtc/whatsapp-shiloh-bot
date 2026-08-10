-- CRM-4 service catalogue/routing update.
-- Pressotherapy is no longer offered: retire all active services in that category and remove staff mappings.
-- Lymphatic Drainage Reset Package is exclusive to Abigail.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM staff WHERE LOWER(display_name) = 'abigail' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active staff member Abigail not found';
  END IF;
END $$;

-- Remove all staff assignments for Pressotherapy before retiring the service(s).
WITH pressotherapy_services AS (
  SELECT s.id
    FROM services s
    JOIN service_categories sc ON sc.id = s.category_id
   WHERE LOWER(TRIM(sc.name)) = 'pressotherapy'
)
DELETE FROM staff_services ss
 WHERE ss.service_id IN (SELECT id FROM pressotherapy_services);

-- Preserve historical records but make Pressotherapy unavailable for discovery/booking.
UPDATE services s
   SET status = 'inactive'
  FROM service_categories sc
 WHERE sc.id = s.category_id
   AND LOWER(TRIM(sc.name)) = 'pressotherapy'
   AND s.status <> 'inactive';

-- Lymphatic Drainage Reset Package: remove every practitioner except Abigail.
WITH abigail AS (
  SELECT id FROM staff WHERE LOWER(display_name) = 'abigail' AND status = 'active' ORDER BY id LIMIT 1
), lymphatic_reset AS (
  SELECT id
    FROM services
   WHERE LOWER(TRIM(name)) = 'lymphatic drainage reset package'
     AND status = 'active'
)
DELETE FROM staff_services ss
 WHERE ss.service_id IN (SELECT id FROM lymphatic_reset)
   AND ss.staff_id <> (SELECT id FROM abigail);

-- Ensure Abigail is assigned to the package.
WITH abigail AS (
  SELECT id FROM staff WHERE LOWER(display_name) = 'abigail' AND status = 'active' ORDER BY id LIMIT 1
), lymphatic_reset AS (
  SELECT id
    FROM services
   WHERE LOWER(TRIM(name)) = 'lymphatic drainage reset package'
     AND status = 'active'
)
INSERT INTO staff_services (staff_id, service_id)
SELECT a.id, lr.id
  FROM abigail a
 CROSS JOIN lymphatic_reset lr
ON CONFLICT (staff_id, service_id) DO NOTHING;
