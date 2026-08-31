-- #624: enable bounded Workspace Staff lifecycle mutation authority for the
-- explicitly authorized senior business-admin cohort only.
--
-- This grants only the narrow staff:manage capability to currently active
-- owner/business_admin principals. It does not infer authority from another
-- scope, create generic RBAC, modify credentials, or mutate staff/business data.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"staff:manage":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner', 'business_admin')
   AND COALESCE((permissions ->> 'staff:manage')::boolean, FALSE) IS NOT TRUE;
