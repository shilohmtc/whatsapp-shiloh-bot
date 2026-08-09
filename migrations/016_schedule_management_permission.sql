-- CRM-2 schedule administration permission.
-- Forward-only; does not modify historical migration or reconciliation decisions.

UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"schedule:manage":true}'::jsonb,
    updated_at = NOW()
WHERE active = TRUE
  AND role IN ('manager', 'admin');
