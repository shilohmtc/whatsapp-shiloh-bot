-- #796 Business-admin service creation authority alignment
--
-- Owner-authorized retained-authority change for the two already-resolved
-- canonical broad Workspace principals. Runtime authorization remains generic;
-- this migration only aligns persisted capability data.

DO $$
DECLARE
  target_count integer;
BEGIN
  SELECT COUNT(*)
    INTO target_count
    FROM staff_admin_accounts
   WHERE (id = 2
          AND active = TRUE
          AND role = 'owner'
          AND business_role = 'owner'
          AND calendar_scope = 'all_business'
          AND service_scope = 'all_services')
      OR (id = 4
          AND active = TRUE
          AND role = 'admin'
          AND business_role = 'business_admin'
          AND calendar_scope = 'all_business'
          AND service_scope = 'all_services');

  IF target_count <> 2 THEN
    RAISE EXCEPTION 'migration 110 service-create authority targets do not match canonical expected principal shapes';
  END IF;

  UPDATE staff_admin_accounts
     SET permissions = COALESCE(permissions, '{}'::jsonb) || jsonb_build_object('services:create', TRUE)
   WHERE id IN (2, 4)
     AND COALESCE((permissions ->> 'services:create')::boolean, FALSE) IS NOT TRUE;

  IF EXISTS (
    SELECT 1
      FROM staff_admin_accounts
     WHERE id IN (2, 4)
       AND COALESCE((permissions ->> 'services:create')::boolean, FALSE) IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'migration 110 failed to establish services:create for all authorized targets';
  END IF;
END $$;
