const { pool } = require('../db/pool');

let ready = false;

async function ensureBookingApprovalInfrastructure(db = pool) {
  if (ready && db === pool) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS appointment_booking_approvals (
      appointment_id BIGINT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
      approver_staff_id BIGINT REFERENCES staff(id),
      approver_admin_id BIGINT REFERENCES staff_admin_accounts(id),
      observer_staff_id BIGINT REFERENCES staff(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
      approval_mode TEXT NOT NULL DEFAULT 'standard',
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approver_notified_at TIMESTAMPTZ,
      backup_notified_at TIMESTAMPTZ,
      observer_notified_at TIMESTAMPTZ,
      decided_at TIMESTAMPTZ,
      decided_by_admin_id BIGINT,
      decision_note TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approver_admin_id BIGINT REFERENCES staff_admin_accounts(id)`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS approval_mode TEXT NOT NULL DEFAULT 'standard'`);
  await db.query(`ALTER TABLE appointment_booking_approvals ADD COLUMN IF NOT EXISTS backup_notified_at TIMESTAMPTZ`);
  await db.query(`ALTER TABLE appointment_booking_approvals ALTER COLUMN approver_staff_id DROP NOT NULL`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_status ON appointment_booking_approvals(status, requested_at)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_approver ON appointment_booking_approvals(approver_staff_id, status)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_admin_approver ON appointment_booking_approvals(approver_admin_id, status)`);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid='appointment_booking_approvals'::regclass
           AND conname='appointment_booking_approvals_mode_check'
      ) THEN
        ALTER TABLE appointment_booking_approvals
          ADD CONSTRAINT appointment_booking_approvals_mode_check
          CHECK (approval_mode IN ('standard','controlled_juvan_primary_backup'));
      END IF;
    END;
    $$
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS client_booking_approval_policies (
      policy_key TEXT PRIMARY KEY,
      client_id BIGINT UNIQUE REFERENCES clients(id) ON DELETE RESTRICT,
      approver_admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE RESTRICT,
      expected_display_name TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`ALTER TABLE client_booking_approval_policies ALTER COLUMN client_id DROP NOT NULL`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_client_booking_approval_policies_active_client ON client_booking_approval_policies(client_id, active)`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS controlled_demo_identities (
      demo_key TEXT PRIMARY KEY,
      normalized_phone TEXT NOT NULL UNIQUE,
      current_client_id BIGINT REFERENCES clients(id) ON DELETE RESTRICT,
      expected_display_name TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      last_bound_at TIMESTAMPTZ,
      last_unbound_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE OR REPLACE FUNCTION create_client_booking_approval_hold()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    DECLARE
      booking_source TEXT;
      booking_client_id BIGINT;
      booking_client_name TEXT;
      booking_client_status TEXT;
      observer_id BIGINT;
      required_approver_id BIGINT;
      required_approver_admin_id BIGINT;
      required_approval_mode TEXT;
      controlled_client_id BIGINT;
      controlled_phone TEXT;
      policy_client_id BIGINT;
      targeted_policy_admin_id BIGINT;
      anchored_contact_count INTEGER;
      shared_active_contact_count INTEGER;
      primary_admin_count INTEGER;
      dummy_count INTEGER;
      jp_count INTEGER;
    BEGIN
      SELECT a.source, a.client_id, c.display_name, c.status
        INTO booking_source, booking_client_id, booking_client_name, booking_client_status
        FROM appointments a
        JOIN clients c ON c.id = a.client_id
       WHERE a.id = NEW.appointment_id;

      IF booking_source IS DISTINCT FROM 'shiloh_client_whatsapp' OR NEW.position <> 1 THEN
        RETURN NEW;
      END IF;

      observer_id := NULL;
      required_approver_id := NEW.staff_id;
      required_approver_admin_id := NULL;
      required_approval_mode := 'standard';
      controlled_client_id := NULL;
      controlled_phone := NULL;
      policy_client_id := NULL;
      targeted_policy_admin_id := NULL;

      SELECT d.current_client_id, d.normalized_phone
        INTO controlled_client_id, controlled_phone
        FROM controlled_demo_identities d
       WHERE d.demo_key = 'juvan_botha'
         AND d.active = TRUE
       LIMIT 1;

      IF controlled_client_id IS NOT NULL AND booking_client_id = controlled_client_id THEN
        SELECT p.client_id, p.approver_admin_id
          INTO policy_client_id, targeted_policy_admin_id
          FROM client_booking_approval_policies p
         WHERE p.policy_key = 'juvan_botha_jp_booking_approval'
           AND p.active = TRUE
         LIMIT 1;

        IF targeted_policy_admin_id IS NULL OR policy_client_id IS DISTINCT FROM controlled_client_id THEN
          RAISE EXCEPTION 'Controlled Juvan booking approval blocked: policy pointer does not match the current demo client';
        END IF;
        IF booking_client_status IS DISTINCT FROM 'active' THEN
          RAISE EXCEPTION 'Controlled Juvan booking approval blocked: current demo client is not active';
        END IF;

        SELECT COUNT(*)::int
          INTO anchored_contact_count
          FROM client_contacts cc
         WHERE cc.client_id = booking_client_id
           AND cc.contact_type IN ('whatsapp','mobile')
           AND regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g') = controlled_phone;
        IF anchored_contact_count < 1 THEN
          RAISE EXCEPTION 'Controlled Juvan booking approval blocked: exact demo phone is not attached to the current canonical client';
        END IF;

        SELECT COUNT(DISTINCT other.id)::int
          INTO shared_active_contact_count
          FROM client_contacts other_cc
          JOIN clients other ON other.id = other_cc.client_id AND other.status = 'active'
         WHERE regexp_replace(COALESCE(other_cc.normalized_value, other_cc.value, ''), '[^0-9]', '', 'g') = controlled_phone
           AND other_cc.contact_type IN ('whatsapp','mobile')
           AND other.id <> booking_client_id;
        IF shared_active_contact_count <> 0 THEN
          RAISE EXCEPTION 'Controlled Juvan booking approval blocked: exact demo phone is shared with another active CRM client';
        END IF;

        SELECT COUNT(*)::int
          INTO jp_count
          FROM staff_admin_accounts saa
         WHERE saa.id = targeted_policy_admin_id
           AND LOWER(TRIM(saa.display_name)) = 'jean-pierre'
           AND saa.active = TRUE
           AND saa.business_role = 'business_admin'
           AND saa.calendar_scope = 'all_business'
           AND saa.service_scope = 'all_services'
           AND saa.normalized_whatsapp IS NOT NULL;
        IF jp_count <> 1 THEN
          RAISE EXCEPTION 'Controlled Juvan booking approval blocked: Jean-Pierre backup approver no longer satisfies the guarded admin contract';
        END IF;

        SELECT COUNT(*)::int
          INTO primary_admin_count
          FROM staff_admin_accounts saa
         WHERE saa.staff_id = NEW.staff_id
           AND saa.active = TRUE
           AND saa.normalized_whatsapp IS NOT NULL;
        IF primary_admin_count < 1 THEN
          RAISE EXCEPTION 'Controlled Juvan booking approval blocked: assigned Primary practitioner has no active Admin WhatsApp identity';
        END IF;

        required_approver_id := NEW.staff_id;
        required_approver_admin_id := targeted_policy_admin_id;
        required_approval_mode := 'controlled_juvan_primary_backup';
      ELSIF LOWER(TRIM(COALESCE(booking_client_name, ''))) = 'dummy test' THEN
        SELECT COUNT(*)::int INTO dummy_count
          FROM clients c
         WHERE LOWER(TRIM(c.display_name)) = 'dummy test' AND c.status = 'active';
        IF dummy_count <> 1 THEN
          RAISE EXCEPTION 'Dummy Test approval blocked: expected exactly one active CRM Dummy Test profile';
        END IF;

        SELECT COUNT(*)::int, MIN(saa.id)
          INTO jp_count, required_approver_admin_id
          FROM staff_admin_accounts saa
         WHERE LOWER(TRIM(saa.display_name)) = 'jean-pierre'
           AND saa.active = TRUE
           AND saa.business_role = 'business_admin'
           AND saa.calendar_scope = 'all_business'
           AND saa.service_scope = 'all_services'
           AND saa.normalized_whatsapp IS NOT NULL;
        IF jp_count <> 1 OR required_approver_admin_id IS NULL THEN
          RAISE EXCEPTION 'Dummy Test approval blocked: expected exactly one active Jean-Pierre business_admin account with all_business/all_services scope and WhatsApp identity';
        END IF;
        required_approver_id := NULL;
      ELSIF LOWER(COALESCE(NEW.staff_name_snapshot, '')) = 'abigail' THEN
        SELECT id INTO observer_id
          FROM staff
         WHERE LOWER(display_name) = 'christel' AND status = 'active'
         ORDER BY id LIMIT 1;
      END IF;

      INSERT INTO appointment_booking_approvals
        (appointment_id, approver_staff_id, approver_admin_id, observer_staff_id, status, approval_mode)
      VALUES
        (NEW.appointment_id, required_approver_id, required_approver_admin_id, observer_id, 'pending', required_approval_mode)
      ON CONFLICT (appointment_id) DO NOTHING;
      RETURN NEW;
    END;
    $$
  `);
  await db.query(`DROP TRIGGER IF EXISTS trg_client_booking_approval_hold ON appointment_staff`);
  await db.query(`
    CREATE TRIGGER trg_client_booking_approval_hold
    AFTER INSERT ON appointment_staff
    FOR EACH ROW
    EXECUTE FUNCTION create_client_booking_approval_hold()
  `);

  if (db === pool) ready = true;
}

module.exports = { ensureBookingApprovalInfrastructure };
