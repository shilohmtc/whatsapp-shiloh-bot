-- Owner-approved permanent Sunday closure authority.
-- South African Sunday public-holiday records remain canonical; observed Mondays are unaffected.
-- This migration fails closed until any conflicting production scheduling state is reconciled.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM location_working_hours
     WHERE day_of_week = 0
       AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'Permanent Sunday closure: active Sunday location working hours require reconciliation';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM location_hours_exceptions
     WHERE exception_type = 'open'
       AND EXTRACT(DOW FROM exception_date)::int = 0
  ) THEN
    RAISE EXCEPTION 'Permanent Sunday closure: open Sunday location exceptions require reconciliation';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM appointments
     WHERE status <> 'cancelled'
       AND starts_at >= NOW()
       AND EXTRACT(DOW FROM (starts_at AT TIME ZONE 'Africa/Johannesburg'))::int = 0
  ) THEN
    RAISE EXCEPTION 'Permanent Sunday closure: future Sunday appointments require reconciliation';
  END IF;
END $$;

ALTER TABLE location_working_hours
  ADD CONSTRAINT location_working_hours_sunday_closed_check
  CHECK (day_of_week <> 0 OR active = FALSE);

ALTER TABLE location_hours_exceptions
  ADD CONSTRAINT location_hours_exceptions_sunday_closed_check
  CHECK (exception_type <> 'open' OR EXTRACT(DOW FROM exception_date)::int <> 0);

CREATE OR REPLACE FUNCTION enforce_future_appointment_sunday_closure()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.status, '') <> 'cancelled'
     AND NEW.starts_at >= NOW()
     AND EXTRACT(DOW FROM (NEW.starts_at AT TIME ZONE 'Africa/Johannesburg'))::int = 0 THEN
    RAISE EXCEPTION 'Shiloh is permanently closed on Sundays'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER appointments_permanent_sunday_closure
BEFORE INSERT OR UPDATE OF starts_at, status ON appointments
FOR EACH ROW
EXECUTE FUNCTION enforce_future_appointment_sunday_closure();
