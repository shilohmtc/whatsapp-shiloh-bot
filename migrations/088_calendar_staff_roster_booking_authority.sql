-- #555: capability-driven Calendar authority and practitioner roster reconciliation.
--
-- Private staff mobiles are never committed. If Naomi or ILince does not yet have
-- one exact canonical principal, the controlled migration session must provide:
--   SET LOCAL shiloh.private_naomi_mobile = '<normalized SA mobile>';
--   SET LOCAL shiloh.private_ilince_mobile = '<normalized SA mobile>';
-- The values are consumed only to create the required canonical principals.

ALTER TABLE staff_admin_accounts
  DROP CONSTRAINT IF EXISTS staff_admin_business_role_check;

ALTER TABLE staff_admin_accounts
  ADD CONSTRAINT staff_admin_business_role_check
  CHECK (business_role IN ('owner','business_admin','booking_operator','tenant_practitioner','employee_practitioner'));

DO $$
DECLARE
  christel_staff_id BIGINT;
  abigail_staff_id BIGINT;
  marietjie_staff_id BIGINT;
  pieter_staff_id BIGINT;
  savanna_staff_id BIGINT;
  ilince_staff_id BIGINT;
  swedish_service_id BIGINT;
  christel_admin_id BIGINT;
  abigail_admin_id BIGINT;
  marietjie_admin_id BIGINT;
  jp_admin_id BIGINT;
  naomi_admin_id BIGINT;
  ilince_admin_id BIGINT;
  private_mobile TEXT;
  assignment_ids BIGINT[];
BEGIN
  SELECT id INTO STRICT christel_staff_id FROM staff WHERE source_name='Christel .';
  SELECT id INTO STRICT abigail_staff_id FROM staff WHERE source_name='Abigail .';
  SELECT id INTO STRICT marietjie_staff_id FROM staff WHERE source_name='Marietjie .';
  SELECT id INTO STRICT pieter_staff_id FROM staff WHERE source_name='Pieter .';
  SELECT id INTO STRICT savanna_staff_id FROM staff WHERE source_name='Savanna Massage Practitioner';
  SELECT id INTO STRICT ilince_staff_id FROM staff WHERE source_name='ILince .';
  SELECT id INTO STRICT swedish_service_id
    FROM services
   WHERE external_source='goldie'
     AND external_id='61a0a7db-426d-4ecf-94ff-9fd6855f384d'
     AND name='Full Body Swedish'
     AND status='active';

  SELECT id INTO STRICT christel_admin_id
    FROM staff_admin_accounts WHERE staff_id=christel_staff_id;
  SELECT id INTO STRICT abigail_admin_id
    FROM staff_admin_accounts WHERE staff_id=abigail_staff_id;
  SELECT id INTO STRICT marietjie_admin_id
    FROM staff_admin_accounts WHERE staff_id=marietjie_staff_id;
  SELECT id INTO STRICT jp_admin_id
    FROM staff_admin_accounts
   WHERE LOWER(TRIM(display_name))='jean-pierre'
     AND staff_id IS NULL;

  IF (SELECT COUNT(*) FROM staff_admin_accounts WHERE LOWER(TRIM(display_name))='naomi') > 1 THEN
    RAISE EXCEPTION 'Naomi canonical principal is ambiguous';
  END IF;
  SELECT id INTO naomi_admin_id
    FROM staff_admin_accounts
   WHERE LOWER(TRIM(display_name))='naomi';
  IF naomi_admin_id IS NULL THEN
    private_mobile := regexp_replace(COALESCE(current_setting('shiloh.private_naomi_mobile', TRUE), ''), '\D', '', 'g');
    IF private_mobile !~ '^27[678][0-9]{8}$' THEN
      RAISE EXCEPTION 'Naomi canonical principal bootstrap requires the controlled private mobile session setting';
    END IF;
    INSERT INTO staff_admin_accounts
      (staff_id,display_name,role,whatsapp_number,normalized_whatsapp,active,permissions,business_role,calendar_scope,service_scope)
    VALUES
      (NULL,'Naomi','receptionist','+' || private_mobile,private_mobile,TRUE,'{}'::jsonb,'booking_operator','all_business','all_services')
    RETURNING id INTO naomi_admin_id;
  END IF;

  IF (SELECT COUNT(*) FROM staff_admin_accounts WHERE staff_id=ilince_staff_id) > 1 THEN
    RAISE EXCEPTION 'ILince canonical approval principal is ambiguous';
  END IF;
  SELECT id INTO ilince_admin_id
    FROM staff_admin_accounts
   WHERE staff_id=ilince_staff_id;
  IF ilince_admin_id IS NULL THEN
    private_mobile := regexp_replace(COALESCE(current_setting('shiloh.private_ilince_mobile', TRUE), ''), '\D', '', 'g');
    IF private_mobile !~ '^27[678][0-9]{8}$' THEN
      RAISE EXCEPTION 'ILince canonical approval principal bootstrap requires the controlled private mobile session setting';
    END IF;
    INSERT INTO staff_admin_accounts
      (staff_id,display_name,role,whatsapp_number,normalized_whatsapp,active,permissions,business_role,calendar_scope,service_scope)
    VALUES
      (ilince_staff_id,'ILince','practitioner','+' || private_mobile,private_mobile,TRUE,'{}'::jsonb,'employee_practitioner','own_appointments','own_services')
    RETURNING id INTO ilince_admin_id;
  END IF;

  assignment_ids := ARRAY[christel_admin_id,marietjie_admin_id,naomi_admin_id,jp_admin_id];

  -- Only canonical capability assignment data chooses Calendar booking editors.
  UPDATE staff_admin_accounts
     SET permissions = COALESCE(permissions,'{}'::jsonb)
                       - 'appointment:create'
                       - 'calendar:booking:reschedule'
                       - 'calendar:booking:cancel'
                       - 'calendar:booking:reassign'
                       - 'schedule:manage',
         updated_at=NOW()
   WHERE NOT (id=ANY(assignment_ids));

  UPDATE staff_admin_accounts
     SET permissions = COALESCE(permissions,'{}'::jsonb) ||
       '{"appointment:view":true,"appointment:create":true,"client:lookup":true,"calendar:booking:reschedule":true,"calendar:booking:cancel":true,"calendar:booking:reassign":true,"schedule:manage":true}'::jsonb,
         updated_at=NOW()
   WHERE id=ANY(ARRAY[christel_admin_id,marietjie_admin_id,jp_admin_id]);

  UPDATE staff_admin_accounts
     SET role='receptionist',
         business_role='booking_operator',
         calendar_scope='all_business',
         service_scope='all_services',
         active=TRUE,
         permissions='{"appointment:view":true,"appointment:create":true,"client:lookup":true,"calendar:booking:reschedule":true,"calendar:booking:cancel":true,"calendar:booking:reassign":true}'::jsonb,
         updated_at=NOW()
   WHERE id=naomi_admin_id;

  -- Abigail remains an active practitioner/viewer but is not a Calendar editor.
  UPDATE staff_admin_accounts
     SET permissions = COALESCE(permissions,'{}'::jsonb)
                       - 'appointment:create'
                       - 'calendar:booking:reschedule'
                       - 'calendar:booking:cancel'
                       - 'calendar:booking:reassign'
                       - 'schedule:manage',
         updated_at=NOW()
   WHERE id=abigail_admin_id;

  -- Pieter and Savanna remain internal-only; all three practitioners inherit clinic hours.
  UPDATE staff
     SET status='active', scheduling_type='regular', client_bookable=FALSE, updated_at=NOW()
   WHERE id=ANY(ARRAY[pieter_staff_id,savanna_staff_id]);

  UPDATE staff
     SET display_name='ILince', status='active', scheduling_type='regular',
         client_bookable=TRUE, updated_at=NOW()
   WHERE id=ilince_staff_id;

  DELETE FROM staff_services
   WHERE staff_id=ilince_staff_id
     AND service_id<>swedish_service_id;
  INSERT INTO staff_services(staff_id,service_id)
  VALUES(ilince_staff_id,swedish_service_id)
  ON CONFLICT(staff_id,service_id) DO NOTHING;

  -- Approval/notification needs one active linked contact principal, not editor authority.
  UPDATE staff_admin_accounts
     SET display_name='ILince', role='practitioner', business_role='employee_practitioner',
         calendar_scope='own_appointments', service_scope='own_services', active=TRUE,
         permissions=COALESCE(permissions,'{}'::jsonb)
                     - 'appointment:create'
                     - 'calendar:booking:reschedule'
                     - 'calendar:booking:cancel'
                     - 'calendar:booking:reassign'
                     - 'schedule:manage',
         updated_at=NOW()
   WHERE id=ilince_admin_id;

  IF (SELECT COUNT(*) FROM staff_admin_accounts WHERE id=ANY(assignment_ids) AND active=TRUE) <> 4 THEN
    RAISE EXCEPTION 'Calendar editor assignments did not resolve to four active canonical principals';
  END IF;
  IF (SELECT COUNT(*) FROM staff_services WHERE staff_id=ilince_staff_id) <> 1
     OR NOT EXISTS (SELECT 1 FROM staff_services WHERE staff_id=ilince_staff_id AND service_id=swedish_service_id) THEN
    RAISE EXCEPTION 'ILince must have exactly one Full Body Swedish service mapping';
  END IF;
  IF EXISTS (
    SELECT 1 FROM staff_admin_accounts
     WHERE id=ANY(ARRAY[abigail_admin_id,ilince_admin_id])
       AND (permissions ? 'appointment:create'
            OR permissions ? 'calendar:booking:reschedule'
            OR permissions ? 'calendar:booking:cancel'
            OR permissions ? 'calendar:booking:reassign'
            OR permissions ? 'schedule:manage')
  ) THEN
    RAISE EXCEPTION 'Non-editor practitioner retained a Calendar mutation capability';
  END IF;
END $$;
