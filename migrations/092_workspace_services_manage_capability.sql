-- #613: enable bounded Workspace Services mutation authority for the explicitly
-- authorized senior business-admin cohort only.
--
-- This grants only the narrow services:manage capability to currently active
-- owner/business_admin principals. It does not infer authority from any other
-- scope, create generic RBAC, or modify service/business data.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"services:manage":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner', 'business_admin')
   AND COALESCE((permissions ->> 'services:manage')::boolean, FALSE) IS NOT TRUE;
