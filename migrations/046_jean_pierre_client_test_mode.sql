-- Jean-Pierre remains business_admin/all_business, not owner.
-- Clone Christel's production admin capabilities except Demo Client, then add explicit Client Test Mode.

CREATE TABLE IF NOT EXISTS admin_client_test_sessions (
  admin_id BIGINT PRIMARY KEY REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
  normalized_whatsapp TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE staff_admin_accounts jp
   SET role = 'admin',
       business_role = 'business_admin',
       calendar_scope = 'all_business',
       service_scope = 'all_services',
       permissions = (COALESCE(c.permissions, '{}'::jsonb) - 'demo:client') || '{"client:test_mode":true}'::jsonb,
       active = TRUE,
       updated_at = NOW()
  FROM staff_admin_accounts c
 WHERE LOWER(jp.display_name) = 'jean-pierre'
   AND LOWER(c.display_name) = 'christel'
   AND c.active = TRUE;
