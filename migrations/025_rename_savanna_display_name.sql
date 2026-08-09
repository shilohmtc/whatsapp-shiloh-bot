-- CRM-2: simplify Savanna's practitioner display name across admin and booking UX.
-- Guarded to the existing active freelancer record so this remains idempotent.

UPDATE staff
SET display_name = 'Savanna'
WHERE display_name = 'Savanna Massage Practitioner'
  AND scheduling_type = 'freelance'
  AND status = 'active';
