-- #766: bounded Workspace Clients mutation authority for senior business admins.
-- This capability is independent of client:lookup and client:notify and grants only
-- add/edit/archive authority through the Workspace Clients mutation boundary.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"client:manage":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner', 'business_admin')
   AND COALESCE((permissions ->> 'client:manage')::boolean, FALSE) IS NOT TRUE;
