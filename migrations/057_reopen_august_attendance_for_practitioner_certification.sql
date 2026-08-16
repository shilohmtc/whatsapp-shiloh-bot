-- Controlled production reconciliation approved 2026-08-16.
-- Re-open historical attendance outcomes for 2026-08-01 through 2026-08-15 so
-- Christel can certify Christel/Abigail visits and Marietjie can certify her own.
-- Preserve cancellations and all prior status-history evidence.

CREATE TEMP TABLE reopen_targets ON COMMIT DROP AS
SELECT a.id, a.status AS previous_status
FROM appointments a
WHERE (a.starts_at AT TIME ZONE 'Africa/Johannesburg')::date BETWEEN DATE '2026-08-01' AND DATE '2026-08-15'
  AND a.status IN ('completed','no_show');

DO $$
DECLARE
  target_count integer;
  unroutable_count integer;
BEGIN
  SELECT COUNT(*) INTO target_count FROM reopen_targets;
  IF target_count <> 31 THEN
    RAISE EXCEPTION 'Historical attendance reopen aborted: expected exactly 31 finalized visits, found %', target_count;
  END IF;

  SELECT COUNT(*) INTO unroutable_count
  FROM reopen_targets rt
  WHERE NOT EXISTS (
          SELECT 1 FROM appointment_staff ast
          JOIN staff s ON s.id = ast.staff_id
          WHERE ast.appointment_id = rt.id
            AND lower(trim(s.display_name)) IN ('christel','abigail','marietjie')
        )
     OR EXISTS (
          SELECT 1 FROM appointment_staff ast
          LEFT JOIN staff s ON s.id = ast.staff_id
          WHERE ast.appointment_id = rt.id
            AND (ast.staff_id IS NULL OR lower(trim(COALESCE(s.display_name, ast.staff_name_snapshot, ''))) NOT IN ('christel','abigail','marietjie'))
        )
     OR (
          EXISTS (
            SELECT 1 FROM appointment_staff ast
            JOIN staff s ON s.id = ast.staff_id
            WHERE ast.appointment_id = rt.id AND lower(trim(s.display_name)) = 'marietjie'
          )
          AND EXISTS (
            SELECT 1 FROM appointment_staff ast
            JOIN staff s ON s.id = ast.staff_id
            WHERE ast.appointment_id = rt.id AND lower(trim(s.display_name)) IN ('christel','abigail')
          )
        );

  IF unroutable_count <> 0 THEN
    RAISE EXCEPTION 'Historical attendance reopen aborted: % finalized visits are not exclusively routable to Christel/Abigail or Marietjie', unroutable_count;
  END IF;
END $$;

INSERT INTO appointment_status_history (appointment_id, from_status, to_status, changed_by, reason)
SELECT rt.id,
       rt.previous_status,
       'scheduled',
       'system:approved-historical-attendance-reopen-2026-08-16',
       'Approved historical attendance reopen so Christel/Marietjie can perform final practitioner certification through Admin Finalize past visits'
FROM reopen_targets rt;

UPDATE appointment_lifecycle al
SET status = 'scheduled', updated_at = NOW()
FROM reopen_targets rt
WHERE al.appointment_id = rt.id;

UPDATE appointments a
SET status = 'scheduled', updated_at = NOW()
FROM reopen_targets rt
WHERE a.id = rt.id;
