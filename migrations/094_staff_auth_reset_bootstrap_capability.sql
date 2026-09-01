-- #628: authorize the two owner-approved bootstrap principals to issue
-- controlled staff authenticator enrollment links.
--
-- This changes only the explicit staff_auth:reset capability on the two
-- approved active canonical admin principals. It does not create accounts,
-- broaden role-derived authority, alter credentials, or change staff data.

DO $$
DECLARE
  matched_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
    INTO matched_count
    FROM staff_admin_accounts a
   WHERE a.active = TRUE
     AND md5(a.normalized_whatsapp) IN (
       'd56ddc5d031161bb338ab4499cfa2b0c',
       'e2f8ad80473976f06734c19d4a9b3a31'
     )
     AND (
       a.staff_id IS NULL
       OR EXISTS (
         SELECT 1
           FROM staff s
          WHERE s.id = a.staff_id
            AND s.status = 'active'
       )
     );

  IF matched_count <> 2 THEN
    RAISE EXCEPTION 'Expected exactly two active owner-authorized staff-auth bootstrap principals, found %', matched_count;
  END IF;

  UPDATE staff_admin_accounts a
     SET permissions = COALESCE(a.permissions, '{}'::jsonb) || '{"staff_auth:reset":true}'::jsonb,
         updated_at = NOW()
   WHERE a.active = TRUE
     AND md5(a.normalized_whatsapp) IN (
       'd56ddc5d031161bb338ab4499cfa2b0c',
       'e2f8ad80473976f06734c19d4a9b3a31'
     )
     AND (
       a.staff_id IS NULL
       OR EXISTS (
         SELECT 1
           FROM staff s
          WHERE s.id = a.staff_id
            AND s.status = 'active'
       )
     )
     AND COALESCE((a.permissions ->> 'staff_auth:reset')::boolean, FALSE) IS NOT TRUE;
END $$;
