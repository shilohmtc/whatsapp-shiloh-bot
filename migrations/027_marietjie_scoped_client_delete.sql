-- CRM-4: Marietjie may archive/delete only clients proven to be exclusively within her staff/service scope.
-- Enforcement is performed by adminClientDeletion.js; this migration grants the command permission only.

UPDATE staff_admin_accounts
   SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"client:delete":true}'::jsonb,
       updated_at = NOW()
 WHERE LOWER(display_name) = 'marietjie'
   AND active = TRUE;
