-- #731: bounded Workspace Staff -> Access enablement authority.
-- Separate from staff:manage so profile lifecycle authority never implies
-- authentication/access provisioning authority.
-- This migration grants only the ability to invoke the bounded enablement
-- operation. It does not create, reactivate, or alter any staff access principal.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb)
       || '{"staff_access:manage":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner', 'business_admin')
   AND COALESCE((permissions ->> 'staff_access:manage')::boolean, FALSE) IS NOT TRUE;
