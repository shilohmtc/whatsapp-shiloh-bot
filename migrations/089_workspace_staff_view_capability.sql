-- #598: make Workspace Staff visibility capability-driven without broadening
-- mutation authority. This is an additive permission-expression migration only.
-- Existing owner/business_admin principals are the senior business-admin boundary;
-- runtime Staff access subsequently requires staff:view explicitly.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"staff:view":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner', 'business_admin')
   AND COALESCE((permissions ->> 'staff:view')::boolean, FALSE) IS NOT TRUE;
