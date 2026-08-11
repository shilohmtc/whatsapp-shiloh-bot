-- P3: controlled loyalty reward redemption lifecycle.
-- Redemption is operational entitlement tracking only; it does not mark payments paid
-- and does not alter appointment pricing or payment truth.

ALTER TABLE loyalty_rewards
  ADD CONSTRAINT loyalty_rewards_status_check
  CHECK (status IN ('available','reserved','redeemed')) NOT VALID;

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  reward_id BIGINT NOT NULL REFERENCES loyalty_rewards(id) ON DELETE RESTRICT,
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','committed','cancelled','failed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  prepared_by_admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE RESTRICT,
  committed_by_admin_id BIGINT REFERENCES staff_admin_accounts(id) ON DELETE RESTRICT,
  cancelled_by_admin_id BIGINT REFERENCES staff_admin_accounts(id) ON DELETE RESTRICT,
  failure_reason TEXT,
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  committed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reward_id, appointment_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_loyalty_redemptions_one_pending_per_reward
  ON loyalty_redemptions (reward_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS uq_loyalty_redemptions_one_committed_per_appointment
  ON loyalty_redemptions (appointment_id)
  WHERE status = 'committed';

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_client_status
  ON loyalty_redemptions (client_id, status, prepared_at DESC);

CREATE TABLE IF NOT EXISTS loyalty_redemption_events (
  id BIGSERIAL PRIMARY KEY,
  redemption_id BIGINT NOT NULL REFERENCES loyalty_redemptions(id) ON DELETE RESTRICT,
  actor_admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('prepared','committed','cancelled','failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemption_events_redemption
  ON loyalty_redemption_events (redemption_id, created_at, id);

-- Explicit permission only for all-business owner/business-admin accounts.
UPDATE staff_admin_accounts
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"loyalty:redeem":true}'::jsonb,
    updated_at = NOW()
WHERE active = TRUE
  AND service_scope = 'all_services'
  AND business_role IN ('owner','business_admin');
