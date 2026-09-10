-- #774: Booking-request team visibility + staff alert routing.
-- Runtime policy is data-configured. Person names below are bootstrap configuration only;
-- authorization code must never branch on names or WhatsApp numbers.

CREATE TABLE IF NOT EXISTS staff_operational_teams (
  id BIGSERIAL PRIMARY KEY,
  team_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_operational_team_members (
  team_id BIGINT NOT NULL REFERENCES staff_operational_teams(id) ON DELETE CASCADE,
  staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, staff_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_operational_team_active_staff
  ON staff_operational_team_members(staff_id)
  WHERE active=TRUE;

CREATE TABLE IF NOT EXISTS booking_request_coordination_scopes (
  admin_id BIGINT PRIMARY KEY REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('global','team','self')),
  team_id BIGINT REFERENCES staff_operational_teams(id),
  receive_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_request_coordination_scope_team_check CHECK (
    (scope_kind='team' AND team_id IS NOT NULL)
    OR (scope_kind<>'team' AND team_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_booking_request_coordination_team
  ON booking_request_coordination_scopes(team_id)
  WHERE active=TRUE AND scope_kind='team';

CREATE TABLE IF NOT EXISTS booking_request_staff_alerts (
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
  alert_kind TEXT NOT NULL DEFAULT 'initial' CHECK (alert_kind IN ('initial')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  provider_message_id TEXT,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (appointment_id, admin_id, alert_kind)
);
CREATE INDEX IF NOT EXISTS idx_booking_request_staff_alert_pending
  ON booking_request_staff_alerts(status, created_at)
  WHERE status IN ('pending','failed');

-- Bootstrap the two currently named operational teams without embedding names in runtime policy.
INSERT INTO staff_operational_teams(team_key, display_name)
VALUES ('christel-team','Christel team'),('marietjie-team','Marietjie team')
ON CONFLICT (team_key) DO UPDATE SET display_name=EXCLUDED.display_name,active=TRUE,updated_at=NOW();

WITH configured(team_key, staff_name) AS (
  VALUES ('christel-team','Christel'),('christel-team','Abigail'),('marietjie-team','Marietjie')
)
INSERT INTO staff_operational_team_members(team_id, staff_id)
SELECT t.id,s.id
  FROM configured c
  JOIN staff_operational_teams t ON t.team_key=c.team_key
  JOIN staff s ON LOWER(s.display_name)=LOWER(c.staff_name) AND s.status='active'
ON CONFLICT (team_id,staff_id) DO UPDATE SET active=TRUE,updated_at=NOW();

-- Team leads receive team-scoped visibility/alerts. Reception/global coordinators are
-- derived from canonical all-business booking authority at runtime, so no person row is needed.
WITH configured(team_key, staff_name) AS (
  VALUES ('christel-team','Christel'),('marietjie-team','Marietjie')
)
INSERT INTO booking_request_coordination_scopes(admin_id,scope_kind,team_id,receive_alerts)
SELECT a.id,'team',t.id,TRUE
  FROM configured c
  JOIN staff_operational_teams t ON t.team_key=c.team_key
  JOIN staff s ON LOWER(s.display_name)=LOWER(c.staff_name) AND s.status='active'
  JOIN staff_admin_accounts a ON a.staff_id=s.id AND a.active=TRUE
ON CONFLICT (admin_id) DO UPDATE SET
  scope_kind='team',team_id=EXCLUDED.team_id,receive_alerts=TRUE,active=TRUE,updated_at=NOW();
