-- Approved client-facing practitioner profile metadata.
-- Operational staff identity and staff_services remain canonical in their existing tables.
-- Public descriptive fields are fail-closed and may only be exposed when explicitly approved.

CREATE TABLE IF NOT EXISTS staff_customer_profiles (
  staff_id BIGINT PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
  public_title TEXT,
  short_bio TEXT,
  approved_specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approval_source TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_customer_profiles_specialties_array CHECK (jsonb_typeof(approved_specialties) = 'array'),
  CONSTRAINT staff_customer_profiles_approval_check CHECK (
    (is_approved = FALSE)
    OR (approval_source IS NOT NULL AND approved_at IS NOT NULL)
  )
);

INSERT INTO staff_customer_profiles
  (staff_id, public_title, short_bio, approved_specialties, is_approved, approval_source, approved_at, updated_at)
SELECT id, 'Massage practitioner', NULL, '[]'::jsonb, TRUE,
       'business_direction_2026-08-12', TIMESTAMPTZ '2026-08-12 00:00:00+02', NOW()
  FROM staff
 WHERE LOWER(display_name) IN ('christel', 'abigail')
   AND status = 'active'
   AND resource_type = 'practitioner'
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_customer_profiles
  (staff_id, public_title, short_bio, approved_specialties, is_approved, approval_source, approved_at, updated_at)
SELECT id, NULL, NULL, '[]'::jsonb, FALSE, NULL, NULL, NOW()
  FROM staff
 WHERE LOWER(display_name) = 'marietjie'
   AND status = 'active'
   AND resource_type = 'practitioner'
ON CONFLICT (staff_id) DO NOTHING;
