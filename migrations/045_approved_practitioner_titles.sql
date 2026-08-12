-- Business-approved client-facing practitioner titles, confirmed 12 Aug 2026.
-- This changes public presentation metadata only. Operational staff roles and
-- staff_services mappings remain authoritative and unchanged.

INSERT INTO staff_customer_profiles
  (staff_id, public_title, short_bio, approved_specialties, is_approved, approval_source, approved_at, updated_at)
SELECT id,
       CASE LOWER(display_name)
         WHEN 'marietjie' THEN 'Esthetician'
         ELSE 'Massage practitioner'
       END,
       NULL,
       '[]'::jsonb,
       TRUE,
       'business_direction_2026-08-12_practitioner_titles',
       TIMESTAMPTZ '2026-08-12 11:33:00+02',
       NOW()
  FROM staff
 WHERE LOWER(display_name) IN ('christel', 'abigail', 'marietjie')
   AND status = 'active'
   AND resource_type = 'practitioner'
ON CONFLICT (staff_id) DO UPDATE SET
  public_title = EXCLUDED.public_title,
  is_approved = TRUE,
  approval_source = EXCLUDED.approval_source,
  approved_at = EXCLUDED.approved_at,
  updated_at = NOW();
