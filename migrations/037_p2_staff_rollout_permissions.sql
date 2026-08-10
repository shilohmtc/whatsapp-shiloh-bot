-- P2: explicit production staff rollout permissions.
-- Christel: owner / all-business.
-- Jean-Pierre: business admin / all-business.
-- Marietjie: tenant business admin / own-services.
-- Abigail: employee practitioner / own-appointments.

UPDATE staff_admin_accounts
SET role='owner',
    business_role='owner',
    calendar_scope='all_business',
    service_scope='all_services',
    permissions='{"appointment:view":true,"appointment:create":true,"client:lookup":true,"client:delete":true,"walkin:create":true,"schedule:manage":true,"service:pricing":true,"staff:services:view":true,"booking:update":true}'::jsonb,
    updated_at=NOW()
WHERE LOWER(display_name)='christel';

UPDATE staff_admin_accounts
SET role='admin',
    business_role='business_admin',
    calendar_scope='all_business',
    service_scope='all_services',
    permissions='{"appointment:view":true,"appointment:create":true,"client:lookup":true,"client:delete":true,"walkin:create":true,"schedule:manage":true,"service:pricing":true,"staff:services:view":true,"booking:update":true}'::jsonb,
    updated_at=NOW()
WHERE LOWER(display_name)='jean-pierre';

UPDATE staff_admin_accounts
SET role='manager',
    business_role='tenant_practitioner',
    calendar_scope='own_services',
    service_scope='own_services',
    permissions='{"appointment:view":true,"appointment:create":true,"client:lookup":true,"client:delete":true,"walkin:create":true,"schedule:manage":true,"service:pricing":true,"staff:services:view":true,"booking:update":true}'::jsonb,
    updated_at=NOW()
WHERE LOWER(display_name)='marietjie';

UPDATE staff_admin_accounts
SET role='practitioner',
    business_role='employee_practitioner',
    calendar_scope='own_appointments',
    service_scope='own_services',
    permissions='{"appointment:view":true,"appointment:create":true,"client:lookup":true,"client:delete":false,"walkin:create":false,"schedule:manage":false,"service:pricing":false,"staff:services:view":true,"booking:update":true}'::jsonb,
    updated_at=NOW()
WHERE LOWER(display_name)='abigail';

-- Freelancers do not receive permanent admin access.
UPDATE staff_admin_accounts
SET active=FALSE, updated_at=NOW()
WHERE LOWER(display_name) IN ('savanna','savanna massage practitioner','pieter');
