-- #603: make Workspace Services visibility capability-driven without broadening
-- mutation authority. This is an additive permission-expression migration only.
-- Existing owner/business_admin principals are the senior business-admin boundary;
-- runtime Services access subsequently requires services:view explicitly.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"services:view":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner', 'business_admin')
   AND COALESCE((permissions ->> 'services:view')::boolean, FALSE) IS NOT TRUE;
