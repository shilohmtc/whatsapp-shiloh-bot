-- #765: Workspace owns client booking-request resolution.
-- Production evidence at authorization: zero pending approval rows, so unresolved
-- backfill is vacuous. Historical approved/declined rows remain valid evidence.

ALTER TABLE appointment_booking_approvals
  ADD COLUMN IF NOT EXISTS requested_client_id BIGINT REFERENCES clients(id),
  ADD COLUMN IF NOT EXISTS requested_crm_v2_client_id BIGINT REFERENCES crm_v2_clients(id),
  ADD COLUMN IF NOT EXISTS requested_client_phone TEXT,
  ADD COLUMN IF NOT EXISTS requested_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS requested_staff_id BIGINT REFERENCES staff(id),
  ADD COLUMN IF NOT EXISTS requested_staff_ids BIGINT[],
  ADD COLUMN IF NOT EXISTS requested_service_id BIGINT REFERENCES services(id),
  ADD COLUMN IF NOT EXISTS requested_service_ids BIGINT[],
  ADD COLUMN IF NOT EXISTS requested_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_revision TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposed_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS proposed_staff_id BIGINT REFERENCES staff(id),
  ADD COLUMN IF NOT EXISTS proposed_staff_ids BIGINT[],
  ADD COLUMN IF NOT EXISTS proposed_service_id BIGINT REFERENCES services(id),
  ADD COLUMN IF NOT EXISTS proposed_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposed_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposal_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proposal_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposed_by_admin_id BIGINT REFERENCES staff_admin_accounts(id),
  ADD COLUMN IF NOT EXISTS client_responded_at TIMESTAMPTZ;

ALTER TABLE appointment_booking_approvals
  DROP CONSTRAINT IF EXISTS appointment_booking_approvals_status_check;
ALTER TABLE appointment_booking_approvals
  ADD CONSTRAINT appointment_booking_approvals_status_check
  CHECK (status IN ('pending','awaiting_client_confirmation','approved','declined'));

ALTER TABLE appointment_booking_approvals
  DROP CONSTRAINT IF EXISTS appointment_booking_approvals_requested_identity_check;
ALTER TABLE appointment_booking_approvals
  ADD CONSTRAINT appointment_booking_approvals_requested_identity_check
  CHECK (num_nonnulls(requested_client_id, requested_crm_v2_client_id) <= 1);

ALTER TABLE appointment_booking_approvals
  DROP CONSTRAINT IF EXISTS appointment_booking_approvals_active_snapshot_check;
ALTER TABLE appointment_booking_approvals
  ADD CONSTRAINT appointment_booking_approvals_active_snapshot_check CHECK (
    status NOT IN ('pending','awaiting_client_confirmation')
    OR (
      num_nonnulls(requested_client_id, requested_crm_v2_client_id) = 1
      AND requested_location_id IS NOT NULL
      AND requested_staff_id IS NOT NULL
      AND cardinality(requested_staff_ids) > 0
      AND requested_service_id IS NOT NULL
      AND cardinality(requested_service_ids) > 0
      AND requested_starts_at IS NOT NULL
      AND requested_ends_at IS NOT NULL
      AND requested_revision IS NOT NULL
      AND requested_ends_at > requested_starts_at
    )
  );

ALTER TABLE appointment_booking_approvals
  DROP CONSTRAINT IF EXISTS appointment_booking_approvals_proposal_check;
ALTER TABLE appointment_booking_approvals
  ADD CONSTRAINT appointment_booking_approvals_proposal_check CHECK (
    status <> 'awaiting_client_confirmation'
    OR (
      proposal_version > 0
      AND proposal_expires_at IS NOT NULL
      AND proposed_location_id IS NOT NULL
      AND proposed_staff_id IS NOT NULL
      AND cardinality(proposed_staff_ids) > 0
      AND proposed_service_id IS NOT NULL
      AND proposed_starts_at IS NOT NULL
      AND proposed_ends_at IS NOT NULL
      AND proposed_ends_at > proposed_starts_at
    )
  );

CREATE INDEX IF NOT EXISTS idx_booking_approval_proposal_holds
  ON appointment_booking_approvals(proposed_staff_id, proposed_starts_at, proposed_ends_at)
  WHERE status='awaiting_client_confirmation';
CREATE INDEX IF NOT EXISTS idx_booking_approval_proposal_staff_ids
  ON appointment_booking_approvals USING GIN(proposed_staff_ids)
  WHERE status='awaiting_client_confirmation';

-- Historical terminal rows receive best-effort snapshots for inspection only.
-- The production gate proved there are no unresolved rows to reinterpret.
UPDATE appointment_booking_approvals aba
   SET requested_client_id = COALESCE(aba.requested_client_id, a.client_id),
       requested_crm_v2_client_id = COALESCE(aba.requested_crm_v2_client_id, a.crm_v2_client_id),
       requested_location_id = COALESCE(aba.requested_location_id, a.location_id),
       requested_staff_id = COALESCE(aba.requested_staff_id, ast.staff_id),
       requested_staff_ids = COALESCE(aba.requested_staff_ids, staff_snapshot.ids),
       requested_service_id = COALESCE(aba.requested_service_id, aps.service_id),
       requested_service_ids = COALESCE(aba.requested_service_ids, service_snapshot.ids),
       requested_starts_at = COALESCE(aba.requested_starts_at, a.starts_at),
       requested_ends_at = COALESCE(aba.requested_ends_at, a.ends_at),
       requested_revision = COALESCE(aba.requested_revision, a.updated_at)
  FROM appointments a
  LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id AND ast.position=1
  LEFT JOIN appointment_services aps ON aps.appointment_id=a.id AND aps.position=1
  LEFT JOIN LATERAL (SELECT array_agg(x.staff_id ORDER BY x.position,x.id) AS ids FROM appointment_staff x WHERE x.appointment_id=a.id) staff_snapshot ON TRUE
  LEFT JOIN LATERAL (SELECT array_agg(x.service_id ORDER BY x.position,x.id) AS ids FROM appointment_services x WHERE x.appointment_id=a.id) service_snapshot ON TRUE
 WHERE aba.appointment_id=a.id
   AND aba.status IN ('approved','declined');

-- Future requests use only canonical assignment data. No person-name policy and no
-- WhatsApp admin identity are involved in request creation.
CREATE OR REPLACE FUNCTION create_client_booking_approval_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking appointments%ROWTYPE;
  primary_staff_id BIGINT;
  primary_service_id BIGINT;
  canonical_phone TEXT;
BEGIN
  SELECT * INTO booking FROM appointments WHERE id=NEW.appointment_id;
  IF booking.source IS DISTINCT FROM 'shiloh_client_whatsapp' THEN RETURN NEW; END IF;

  SELECT staff_id INTO primary_staff_id
    FROM appointment_staff
   WHERE appointment_id=NEW.appointment_id AND position=1;
  SELECT service_id INTO primary_service_id
    FROM appointment_services
   WHERE appointment_id=NEW.appointment_id AND position=1;
  IF booking.crm_v2_client_id IS NOT NULL THEN
    SELECT normalized_mobile INTO canonical_phone
      FROM crm_v2_clients WHERE id=booking.crm_v2_client_id AND status='active';
  ELSE
    SELECT normalized_value INTO canonical_phone
      FROM client_contacts
     WHERE client_id=booking.client_id
       AND LOWER(contact_type) IN ('whatsapp','mobile','phone','telephone')
       AND normalized_value IS NOT NULL
     ORDER BY is_primary DESC,id LIMIT 1;
  END IF;

  INSERT INTO appointment_booking_approvals (
    appointment_id,approver_staff_id,status,approval_mode,
    requested_client_id,requested_crm_v2_client_id,requested_client_phone,
    requested_location_id,requested_staff_id,requested_staff_ids,requested_service_id,requested_service_ids,
    requested_starts_at,requested_ends_at,requested_revision
  ) VALUES (
    NEW.appointment_id,primary_staff_id,'pending','standard',
    booking.client_id,booking.crm_v2_client_id,canonical_phone,
    booking.location_id,primary_staff_id,
    (SELECT array_agg(x.staff_id ORDER BY x.position,x.id) FROM appointment_staff x WHERE x.appointment_id=NEW.appointment_id),
    primary_service_id,
    (SELECT array_agg(x.service_id ORDER BY x.position,x.id) FROM appointment_services x WHERE x.appointment_id=NEW.appointment_id),
    booking.starts_at,booking.ends_at,booking.updated_at
  ) ON CONFLICT (appointment_id) DO UPDATE SET
    approver_staff_id=EXCLUDED.approver_staff_id,
    requested_staff_id=EXCLUDED.requested_staff_id,
    requested_staff_ids=EXCLUDED.requested_staff_ids,
    requested_service_id=EXCLUDED.requested_service_id,
    requested_service_ids=EXCLUDED.requested_service_ids
  WHERE appointment_booking_approvals.status='pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_booking_approval_hold ON appointment_staff;
CREATE TRIGGER trg_client_booking_approval_hold
AFTER INSERT ON appointment_staff
FOR EACH ROW EXECUTE FUNCTION create_client_booking_approval_hold();
