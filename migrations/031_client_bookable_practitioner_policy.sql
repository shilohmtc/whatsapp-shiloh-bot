-- CRM-4: explicit client-bookable practitioner policy.
-- Client-facing booking may use Christel, Abigail, and Marietjie only.
-- Marietjie remains limited to her canonical staff_services mappings.
-- Freelancers and any other practitioner records remain internal/non-client-bookable.

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS client_bookable BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE staff
   SET client_bookable = CASE
     WHEN status = 'active'
      AND resource_type = 'practitioner'
      AND LOWER(display_name) IN ('christel','abigail','marietjie')
     THEN TRUE
     ELSE FALSE
   END,
       updated_at = NOW();

CREATE INDEX IF NOT EXISTS idx_staff_client_bookable
  ON staff(client_bookable)
  WHERE client_bookable = TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM staff
     WHERE LOWER(display_name) = 'christel' AND status = 'active' AND client_bookable = TRUE
  ) THEN
    RAISE EXCEPTION 'Christel must exist as an active client-bookable practitioner';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM staff
     WHERE LOWER(display_name) = 'abigail' AND status = 'active' AND client_bookable = TRUE
  ) THEN
    RAISE EXCEPTION 'Abigail must exist as an active client-bookable practitioner';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM staff
     WHERE LOWER(display_name) = 'marietjie' AND status = 'active' AND client_bookable = TRUE
  ) THEN
    RAISE EXCEPTION 'Marietjie must exist as an active client-bookable practitioner';
  END IF;
END $$;
