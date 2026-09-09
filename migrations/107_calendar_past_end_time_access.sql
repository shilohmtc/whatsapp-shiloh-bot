-- #769 owner-authorized operational access adjustment.
-- Canonical IDs are durable production authority from #753 terminal reconciliation:
-- admin 1 (Marietjie / owner), admin 2 (Christel), admin 4 (JP).
-- Existing role/calendar/service scopes remain unchanged. This migration only:
--   * enables ordinary appointment:record_past for the three explicitly authorized operators,
--   * removes any retired controlled-demo client restriction for that operator set,
--   * enables appointment:adjust_end for exactly that same bounded operator set.
-- Other existing retrospective grants remain unchanged; future grants use canonical Staff → Access.
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
   AND id IN (1, 2, 4);
