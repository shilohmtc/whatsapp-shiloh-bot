-- Retire discontinued operational services while preserving all historical appointments and clients.
-- Explicitly KEEP Medi-Heel services #1 and #3 active.

DO $$
BEGIN
  -- Protect Medi-Heel services from accidental retirement in this migration.
  IF EXISTS (
    SELECT 1 FROM services
    WHERE id IN (1,3)
      AND LOWER(name) NOT LIKE '%medi-heel%'
  ) THEN
    RAISE EXCEPTION 'Protected Medi-Heel service IDs no longer match expected catalogue rows; aborting.';
  END IF;

  -- Retire discontinued services that were still operational.
  UPDATE services
     SET status = 'inactive',
         updated_at = NOW()
   WHERE id IN (2,49)
     AND status <> 'inactive';

  -- Remove only current operational staff eligibility for discontinued services.
  -- Historical appointment_services rows remain untouched.
  DELETE FROM staff_services
   WHERE service_id IN (2,49,53,59,60,61,62);
END $$;
