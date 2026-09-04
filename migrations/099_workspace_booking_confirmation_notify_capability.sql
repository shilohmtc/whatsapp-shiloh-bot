-- #700: activate least-privilege Workspace booking-confirmation recovery authority.
-- This capability is intentionally separate from client:lookup and Calendar mutation authority.
-- V1 is limited to all-business operational roles because the current notification action is
-- appointment-wide; tenant practitioners remain ungranted until a practitioner-scoped rule exists.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"client:notify":true}'::jsonb,
       updated_at = NOW()
 WHERE active = TRUE
   AND business_role IN ('owner','business_admin','booking_operator')
   AND COALESCE((permissions ->> 'client:notify')::boolean, FALSE) IS NOT TRUE;
