-- CRM-1: add Jean-Pierre as an authenticated WhatsApp Admin Assistant account.
-- Jean-Pierre is a project administrator, not necessarily clinic staff, so staff_id may remain NULL.

INSERT INTO staff_admin_accounts (
  staff_id,
  display_name,
  role,
  whatsapp_number,
  normalized_whatsapp,
  active,
  permissions
)
VALUES (
  NULL,
  'Jean-Pierre',
  'admin',
  '+27725128605',
  '27725128605',
  TRUE,
  '{"walkin:create":true,"client:lookup":true}'::jsonb
)
ON CONFLICT (normalized_whatsapp) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  active = TRUE,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();
