-- Guarded cleanup of legacy-only Goldie clients whose complete appointment history
-- consists exclusively of retired service IDs 2,49,53,59,60,61,62.
--
-- Safety rules are recalculated at execution time. Clients are excluded if they have:
--   * any non-retired/null service on any appointment
--   * any future non-cancelled/non-no-show appointment
--   * completed CRM onboarding
--   * a non-Goldie source
--
-- The prior production audit found 22 candidates. If a larger set appears, abort rather
-- than broadening the destructive scope. If fewer remain, only the still-eligible subset
-- is removed.

DO $$
DECLARE
  retired BIGINT[] := ARRAY[2,49,53,59,60,61,62]::BIGINT[];
  candidate_ids BIGINT[];
  candidate_count INTEGER;
  appointment_count INTEGER;
  deleted_clients INTEGER;
BEGIN
  WITH affected AS (
    SELECT DISTINCT a.client_id
    FROM appointments a
    JOIN appointment_services aps ON aps.appointment_id = a.id
    WHERE a.client_id IS NOT NULL
      AND aps.service_id = ANY(retired)
  ), eligible AS (
    SELECT c.id
    FROM affected af
    JOIN clients c ON c.id = af.client_id
    WHERE c.source = 'goldie_import'
      AND EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = c.id)
      AND NOT EXISTS (
        SELECT 1
        FROM appointments a
        JOIN appointment_services aps ON aps.appointment_id = a.id
        WHERE a.client_id = c.id
          AND (aps.service_id IS NULL OR NOT (aps.service_id = ANY(retired)))
      )
      AND NOT EXISTS (
        SELECT 1
        FROM appointments a
        WHERE a.client_id = c.id
          AND a.starts_at >= NOW()
          AND a.status NOT IN ('cancelled','no_show')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM client_onboarding_sessions cos
        WHERE cos.client_id = c.id
          AND cos.state = 'complete'
      )
  )
  SELECT COALESCE(array_agg(id ORDER BY id), ARRAY[]::BIGINT[]), COUNT(*)::INTEGER
  INTO candidate_ids, candidate_count
  FROM eligible;

  IF candidate_count > 22 THEN
    RAISE EXCEPTION 'Legacy orphan cleanup found % eligible clients, exceeding audited maximum 22; refusing cleanup.', candidate_count;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO appointment_count
  FROM appointments
  WHERE client_id = ANY(candidate_ids);

  -- Remove incomplete onboarding state owned only by clients being retired.
  DELETE FROM client_onboarding_sessions
  WHERE client_id = ANY(candidate_ids)
    AND state <> 'complete';

  -- Appointment child rows cascade through the canonical appointment model.
  DELETE FROM appointments
  WHERE client_id = ANY(candidate_ids);

  -- client_contacts cascade from clients; any unexpected FK dependency will make
  -- this migration fail and roll back atomically rather than partially clean data.
  DELETE FROM clients
  WHERE id = ANY(candidate_ids);
  GET DIAGNOSTICS deleted_clients = ROW_COUNT;

  IF deleted_clients <> candidate_count THEN
    RAISE EXCEPTION 'Expected to delete % legacy orphan clients but deleted %; rolling back.', candidate_count, deleted_clients;
  END IF;

  RAISE NOTICE 'Legacy orphan cleanup complete: % clients and % appointments removed.', deleted_clients, appointment_count;
END $$;
