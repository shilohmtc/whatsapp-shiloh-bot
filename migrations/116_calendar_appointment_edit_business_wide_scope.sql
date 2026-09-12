-- #903 owner-authorized Calendar appointment-edit scope alignment.
--
-- Canonical durable principal IDs come from prior controlled reconciliation:
--   admin 1 = Marietjie, admin 2 = Christel, admin 4 = JP.
-- Shiloh Reception is resolved by its canonical shared-principal identity because
-- it intentionally has no linked staff row.
--
-- #903 requires Marietjie, Christel, Reception and JP(test) to edit all
-- canonically editable appointment fields across the business-wide Calendar
-- projection. Existing migrations already provide the required edit
-- capabilities to this cohort; only Marietjie's retained own-services scopes
-- are narrower than the newly authorized #903 contract.
--
-- This migration changes only Marietjie's Calendar/service scopes. It preserves
-- role, business_role, every permission, staff/service assignment, authentication
-- authority and all unrelated access. Runtime authorization remains generic and
-- capability/scope driven; there is no person-name application branch.

DO $$
DECLARE
  target RECORD;
  principal RECORD;
  required_capabilities TEXT[] := ARRAY[
    'appointment:view',
    'calendar:booking:reschedule',
    'calendar:booking:cancel',
    'calendar:booking:reassign',
    'appointment:adjust_end'
  ];
  capability TEXT;
  reception_count INTEGER;
BEGIN
  SELECT a.id,a.staff_id,a.display_name,a.role,a.active,a.permissions,
         a.business_role,a.calendar_scope,a.service_scope,s.status AS staff_status
    INTO target
    FROM staff_admin_accounts a
    LEFT JOIN staff s ON s.id=a.staff_id
   WHERE a.id=1
   FOR UPDATE OF a;

  IF target.id IS NULL
     OR LOWER(TRIM(target.display_name)) <> 'marietjie'
     OR target.active IS NOT TRUE
     OR target.staff_id IS NULL
     OR target.staff_status <> 'active'
     OR target.business_role <> 'tenant_practitioner' THEN
    RAISE EXCEPTION '#903 Marietjie canonical principal invariant failed';
  END IF;

  IF target.calendar_scope NOT IN ('own_services','all_business')
     OR target.service_scope NOT IN ('own_services','all_services') THEN
    RAISE EXCEPTION '#903 Marietjie scope drift requires manual reconciliation: calendar=%, service=%',
      target.calendar_scope,target.service_scope;
  END IF;

  FOREACH capability IN ARRAY required_capabilities LOOP
    IF COALESCE(target.permissions -> capability, 'false'::jsonb) <> 'true'::jsonb THEN
      RAISE EXCEPTION '#903 Marietjie missing required appointment-edit capability: %', capability;
    END IF;
  END LOOP;

  UPDATE staff_admin_accounts
     SET calendar_scope='all_business',
         service_scope='all_services',
         updated_at=NOW()
   WHERE id=target.id
     AND (calendar_scope <> 'all_business' OR service_scope <> 'all_services');

  -- Fail closed if any member of the authorized cohort lacks the bounded
  -- appointment-edit contract after alignment. These checks do not add or
  -- remove permissions; they only prove the expected persisted authority.
  FOR principal IN
    SELECT a.id,a.display_name,a.active,a.permissions,a.calendar_scope,a.service_scope
      FROM staff_admin_accounts a
     WHERE a.id IN (1,2,4)
     ORDER BY a.id
  LOOP
    IF principal.active IS NOT TRUE
       OR principal.calendar_scope <> 'all_business'
       OR principal.service_scope <> 'all_services' THEN
      RAISE EXCEPTION '#903 appointment editor scope invariant failed for admin % (%): calendar=%, service=%',
        principal.id,principal.display_name,principal.calendar_scope,principal.service_scope;
    END IF;
    FOREACH capability IN ARRAY required_capabilities LOOP
      IF COALESCE(principal.permissions -> capability, 'false'::jsonb) <> 'true'::jsonb THEN
        RAISE EXCEPTION '#903 appointment editor admin % missing required capability: %', principal.id,capability;
      END IF;
    END LOOP;
  END LOOP;

  IF (SELECT COUNT(*) FROM staff_admin_accounts WHERE id IN (1,2,4)) <> 3 THEN
    RAISE EXCEPTION '#903 canonical named-principal cohort did not resolve exactly';
  END IF;

  SELECT COUNT(*) INTO reception_count
    FROM staff_admin_accounts
   WHERE LOWER(TRIM(display_name))='shiloh reception'
     AND staff_id IS NULL;
  IF reception_count <> 1 THEN
    RAISE EXCEPTION '#903 Shiloh Reception canonical principal is missing or ambiguous';
  END IF;

  SELECT a.id,a.display_name,a.active,a.permissions,a.calendar_scope,a.service_scope
    INTO principal
    FROM staff_admin_accounts a
   WHERE LOWER(TRIM(a.display_name))='shiloh reception'
     AND a.staff_id IS NULL;

  IF principal.active IS NOT TRUE
     OR principal.calendar_scope <> 'all_business'
     OR principal.service_scope <> 'all_services' THEN
    RAISE EXCEPTION '#903 Reception scope invariant failed: calendar=%, service=%',
      principal.calendar_scope,principal.service_scope;
  END IF;
  FOREACH capability IN ARRAY required_capabilities LOOP
    IF COALESCE(principal.permissions -> capability, 'false'::jsonb) <> 'true'::jsonb THEN
      RAISE EXCEPTION '#903 Reception missing required appointment-edit capability: %', capability;
    END IF;
  END LOOP;
END $$;
