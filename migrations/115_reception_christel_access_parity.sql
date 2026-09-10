-- #845 owner-approved Shiloh Reception access parity with Christel.
--
-- This changes only the exact shared Reception principal's permissions. Reception
-- retains its own identity, roles, scopes, credentials, passkeys and sessions.
-- Runtime authority remains capability-driven; names are migration target guards only.

DO $$
DECLARE
  christel_id BIGINT;
  reception_id BIGINT;
  expected_permissions JSONB := '{
    "appointment:view":true,
    "appointment:create":true,
    "appointment:record_past":true,
    "appointment:adjust_end":true,
    "calendar:booking:reschedule":true,
    "calendar:booking:cancel":true,
    "calendar:booking:reassign":true,
    "client:lookup":true,
    "client:delete":true,
    "client:manage":true,
    "client:notify":true,
    "walkin:create":true,
    "booking:update":true,
    "loyalty:redeem":true,
    "service:pricing":true,
    "staff:services:view":true,
    "services:view":true,
    "services:manage":true,
    "services:create":true,
    "schedule:manage":true,
    "staff:view":true,
    "staff:manage":true,
    "staff_access:manage":true,
    "staff_auth:reset":true
  }'::jsonb;
  christel_enabled JSONB;
  reception_enabled JSONB;
BEGIN
  IF (
    SELECT COUNT(*)
      FROM staff_admin_accounts a
     WHERE LOWER(TRIM(a.display_name))='christel'
       AND a.active=TRUE
  ) <> 1 THEN
    RAISE EXCEPTION 'migration 115 expected exactly one active canonical Christel owner';
  END IF;

  SELECT a.id,
         COALESCE((SELECT jsonb_object_agg(e.key,e.value) FROM jsonb_each(COALESCE(a.permissions,'{}'::jsonb)) e WHERE e.value='true'::jsonb),'{}'::jsonb)
    INTO STRICT christel_id,christel_enabled
    FROM staff_admin_accounts a
    JOIN staff s ON s.id=a.staff_id AND s.status='active'
   WHERE LOWER(TRIM(a.display_name))='christel'
     AND a.active=TRUE
     AND a.role='owner'
     AND a.business_role='owner'
     AND a.calendar_scope='all_business'
     AND a.service_scope='all_services';

  IF christel_enabled <> expected_permissions THEN
    RAISE EXCEPTION 'migration 115 Christel capability authority drifted from the reviewed canonical set';
  END IF;

  IF (
    SELECT COUNT(*)
      FROM staff_admin_accounts a
     WHERE LOWER(TRIM(a.display_name))='shiloh reception'
       AND a.active=TRUE
  ) <> 1 THEN
    RAISE EXCEPTION 'migration 115 expected exactly one active canonical Shiloh Reception principal';
  END IF;

  SELECT a.id,
         COALESCE((SELECT jsonb_object_agg(e.key,e.value) FROM jsonb_each(COALESCE(a.permissions,'{}'::jsonb)) e WHERE e.value='true'::jsonb),'{}'::jsonb)
    INTO STRICT reception_id,reception_enabled
    FROM staff_admin_accounts a
   WHERE LOWER(TRIM(a.display_name))='shiloh reception'
     AND a.active=TRUE
     AND a.staff_id IS NULL
     AND a.role='receptionist'
     AND a.business_role='booking_operator'
     AND a.calendar_scope='all_business'
     AND a.service_scope='all_services';

  IF NOT (expected_permissions @> reception_enabled) THEN
    RAISE EXCEPTION 'migration 115 Reception has unreviewed enabled authority and was not overwritten';
  END IF;

  UPDATE staff_admin_accounts
     SET permissions=expected_permissions,
         updated_at=NOW()
   WHERE id=reception_id;

  INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
  VALUES(
    christel_id,
    'workspace.reception_access_parity_approved',
    'staff_admin_account',
    reception_id,
    jsonb_build_object(
      'controlReference','#845',
      'sourceAdminId',christel_id,
      'enabledCapabilityCount',(SELECT COUNT(*) FROM jsonb_object_keys(expected_permissions)),
      'identityChanged',FALSE,
      'credentialMaterialChanged',FALSE,
      'sessionMaterialChanged',FALSE
    )
  );

  IF NOT EXISTS (
    SELECT 1
      FROM staff_admin_accounts a
     WHERE a.id=reception_id
       AND a.staff_id IS NULL
       AND a.role='receptionist'
       AND a.business_role='booking_operator'
       AND a.calendar_scope='all_business'
       AND a.service_scope='all_services'
       AND COALESCE((SELECT jsonb_object_agg(e.key,e.value) FROM jsonb_each(COALESCE(a.permissions,'{}'::jsonb)) e WHERE e.value='true'::jsonb),'{}'::jsonb)=expected_permissions
  ) THEN
    RAISE EXCEPTION 'migration 115 failed Reception access parity postcondition';
  END IF;
END $$;
