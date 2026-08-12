-- Retire the temporary Jean-Pierre Client Test Mode and hide Demo Client from production Admin UX.
-- Preserve Jean-Pierre as business_admin/all_business.

UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb) - 'client:test_mode' - 'demo:client',
    updated_at = NOW()
WHERE permissions ? 'client:test_mode' OR permissions ? 'demo:client';

DROP TABLE IF EXISTS admin_client_test_sessions;
