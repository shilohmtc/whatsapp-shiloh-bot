-- Client Perspective acceptance: durable progressive WhatsApp registration state.
-- The runtime path self-initializes this idempotently because Render has no pre-deploy migration hook;
-- this migration is the formal schema-convergence record.

ALTER TABLE client_onboarding_sessions
  ADD COLUMN IF NOT EXISTS pending_gender TEXT;

ALTER TABLE client_onboarding_sessions
  DROP CONSTRAINT IF EXISTS client_onboarding_state_check;

ALTER TABLE client_onboarding_sessions
  ADD CONSTRAINT client_onboarding_state_check CHECK (
    state IN ('collect_name','confirm_whatsapp','collect_contact','collect_dob','collect_gender','complete')
  );
