-- #694: narrow canonical service-creation authority.
-- Creation is distinct from the broader services:manage edit/status/assignment authority.
-- Owner/business-admin, booking-operator and tenant-practitioner roles are explicitly
-- authorized by the owner for service creation; runtime still requires the capability.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"services:create":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner','business_admin','booking_operator','tenant_practitioner')
   AND COALESCE((permissions ->> 'services:create')::boolean, FALSE) IS NOT TRUE;
