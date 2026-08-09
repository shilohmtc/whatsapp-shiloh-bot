-- CRM-1: WhatsApp Admin Assistant permissions.
-- Extends existing admin accounts without modifying historical migrations.

UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb)
  || '{"admin:menu":true,"appointment:view":true}'::jsonb,
    updated_at = NOW()
WHERE active = TRUE;
