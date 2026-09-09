-- #769 owner-authorized operational access adjustment.
-- Canonical IDs are durable production authority from #753 terminal reconciliation:
-- admin 1 (Marietjie), admin 2 (Christel), admin 4 (JP), admin 5 (Naomi).
-- Existing role/calendar/service scopes remain unchanged. This migration only:
--   * enables appointment:record_past for the four authorized operators,
--   * removes JP's retired controlled-demo client restriction,
--   * enables appointment:adjust_end for the same bounded operator set.
-- Runtime enforcement remains scope/capability driven; no application code branches on identity.

UPDATE staff_admin_accounts
   SET permissions = (
         COALESCE(permissions, '{}'::jsonb)
         - 'appointment:record_past:crm_v2_client_ids'
       ) || jsonb_build_object(
         'appointment:record_past', true,
         'appointment:adjust_end', true
       ),
       updated_at = NOW()
 WHERE active = TRUE
   AND id IN (1, 2, 4, 5);
