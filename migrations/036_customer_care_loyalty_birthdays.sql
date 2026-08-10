CREATE TABLE IF NOT EXISTS client_customer_care_preferences (
  client_id BIGINT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  birthday_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_visits (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  qualified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_visits_client
  ON loyalty_visits (client_id, qualified_at);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  milestone_visit_count INTEGER NOT NULL,
  reward_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  status TEXT NOT NULL DEFAULT 'available',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  appointment_id_redeemed BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  UNIQUE (client_id, milestone_visit_count)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_client_status
  ON loyalty_rewards (client_id, status, issued_at DESC);

CREATE TABLE IF NOT EXISTS birthday_message_deliveries (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  birthday_year INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, birthday_year)
);
