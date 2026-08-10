-- CRM-4: staff-scoped service authorization.
-- Practitioners default to their own staff/service scope; project admins may retain all-service visibility.
-- Marietjie's aesthetic/service categories below are exclusive to Marietjie.

ALTER TABLE staff_admin_accounts
  ADD COLUMN IF NOT EXISTS service_scope TEXT NOT NULL DEFAULT 'own_services';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_admin_accounts_service_scope_check'
  ) THEN
    ALTER TABLE staff_admin_accounts
      ADD CONSTRAINT staff_admin_accounts_service_scope_check
      CHECK (service_scope IN ('own_services','all_services'));
  END IF;
END $$;

UPDATE staff_admin_accounts
   SET service_scope = CASE
     WHEN LOWER(display_name) = 'jean-pierre' OR role = 'admin' THEN 'all_services'
     ELSE 'own_services'
   END,
       updated_at = NOW();

WITH marietjie AS (
  SELECT id FROM staff WHERE LOWER(display_name) = 'marietjie' AND status = 'active' ORDER BY id LIMIT 1
), exclusive_services AS (
  SELECT s.id
    FROM services s
    JOIN service_categories sc ON sc.id = s.category_id
   WHERE s.status = 'active'
     AND sc.name IN (
       'Facials',
       'Permanant Makeup',
       'Mikroneedling',
       'Facial Waxing',
       '1. SQT BoiMicroneedling',
       '2. SQT BioMicroneedling',
       'HIFU',
       'Profosma Jet Plasma',
       'Plasma Fybroblast Consultation',
       'Plasma Fybroblast Prices',
       'Ozone & Far Infrared',
       'Vaginal Tightening & Rejuvenation',
       'Neo Pelvic Therapy'
     )
)
DELETE FROM staff_services ss
 WHERE ss.service_id IN (SELECT id FROM exclusive_services)
   AND ss.staff_id <> (SELECT id FROM marietjie);

WITH marietjie AS (
  SELECT id FROM staff WHERE LOWER(display_name) = 'marietjie' AND status = 'active' ORDER BY id LIMIT 1
), exclusive_services AS (
  SELECT s.id
    FROM services s
    JOIN service_categories sc ON sc.id = s.category_id
   WHERE s.status = 'active'
     AND sc.name IN (
       'Facials',
       'Permanant Makeup',
       'Mikroneedling',
       'Facial Waxing',
       '1. SQT BoiMicroneedling',
       '2. SQT BioMicroneedling',
       'HIFU',
       'Profosma Jet Plasma',
       'Plasma Fybroblast Consultation',
       'Plasma Fybroblast Prices',
       'Ozone & Far Infrared',
       'Vaginal Tightening & Rejuvenation',
       'Neo Pelvic Therapy'
     )
)
INSERT INTO staff_services (staff_id, service_id)
SELECT m.id, es.id
  FROM marietjie m
 CROSS JOIN exclusive_services es
ON CONFLICT (staff_id, service_id) DO NOTHING;
