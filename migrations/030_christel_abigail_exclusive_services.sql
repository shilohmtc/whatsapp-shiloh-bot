-- CRM-4: Christel + Abigail exclusive service categories.
-- Services under these categories may only be assigned/booked with Christel or Abigail.
-- Uses canonical staff_services so availability, booking and staff-scoped authorization share one rule.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM staff WHERE LOWER(display_name) = 'christel' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active staff member Christel not found';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM staff WHERE LOWER(display_name) = 'abigail' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active staff member Abigail not found';
  END IF;
END $$;

WITH allowed_staff AS (
  SELECT id
    FROM staff
   WHERE LOWER(display_name) IN ('christel','abigail')
     AND status = 'active'
), exclusive_services AS (
  SELECT s.id
    FROM services s
    JOIN service_categories sc ON sc.id = s.category_id
   WHERE s.status = 'active'
     AND LOWER(TRIM(sc.name)) IN (
       'massages',
       'pedicures & foot care',
       'pressotherapy'
     )
)
DELETE FROM staff_services ss
 WHERE ss.service_id IN (SELECT id FROM exclusive_services)
   AND ss.staff_id NOT IN (SELECT id FROM allowed_staff);

WITH allowed_staff AS (
  SELECT id
    FROM staff
   WHERE LOWER(display_name) IN ('christel','abigail')
     AND status = 'active'
), exclusive_services AS (
  SELECT s.id
    FROM services s
    JOIN service_categories sc ON sc.id = s.category_id
   WHERE s.status = 'active'
     AND LOWER(TRIM(sc.name)) IN (
       'massages',
       'pedicures & foot care',
       'pressotherapy'
     )
)
INSERT INTO staff_services (staff_id, service_id)
SELECT ast.id, es.id
  FROM allowed_staff ast
 CROSS JOIN exclusive_services es
ON CONFLICT (staff_id, service_id) DO NOTHING;
