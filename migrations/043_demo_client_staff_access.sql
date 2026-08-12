-- Extend controlled client-demo access to the three named Shiloh practitioners only.
-- The application independently enforces each practitioner's demo booking scope.

UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"demo:client":true}'::jsonb,
    updated_at = NOW()
WHERE active = TRUE
  AND (
    (LOWER(display_name) = 'christel' AND business_role = 'owner')
    OR (LOWER(display_name) = 'abigail' AND business_role = 'employee_practitioner')
    OR (LOWER(display_name) = 'marietjie' AND business_role = 'tenant_practitioner')
  );

-- Fail closed if the permission was ever copied to another account by mistake.
UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb) - 'demo:client',
    updated_at = NOW()
WHERE active = TRUE
  AND permissions ? 'demo:client'
  AND NOT (
    (LOWER(display_name) = 'christel' AND business_role = 'owner')
    OR (LOWER(display_name) = 'abigail' AND business_role = 'employee_practitioner')
    OR (LOWER(display_name) = 'marietjie' AND business_role = 'tenant_practitioner')
  );
