-- Establish one durable reusable demo identity for the business-controlled Juvan WhatsApp number.
-- The exact normalized phone is the durable identity anchor. current_client_id is intentionally nullable:
-- reset leaves the demo UNBOUND, and normal WhatsApp registration binds the newly created canonical client.

ALTER TABLE client_booking_approval_policies
  ALTER COLUMN client_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS controlled_demo_identities (
  demo_key TEXT PRIMARY KEY,
  normalized_phone TEXT NOT NULL UNIQUE,
  current_client_id BIGINT REFERENCES clients(id) ON DELETE RESTRICT,
  expected_display_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_bound_at TIMESTAMPTZ,
  last_unbound_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT controlled_demo_identity_phone_check CHECK (normalized_phone ~ '^[0-9]+$')
);

CREATE INDEX IF NOT EXISTS idx_controlled_demo_identities_current_client
  ON controlled_demo_identities(current_client_id)
  WHERE active = TRUE AND current_client_id IS NOT NULL;

DO $$
DECLARE
  policy_count INTEGER;
  current_client_id BIGINT;
  current_client_name TEXT;
  current_client_status TEXT;
  phone_count INTEGER;
  controlled_phone TEXT;
  shared_active_contact_count INTEGER;
BEGIN
  SELECT COUNT(*)::int, MIN(p.client_id)
    INTO policy_count, current_client_id
    FROM client_booking_approval_policies p
   WHERE p.policy_key = 'juvan_botha_jp_booking_approval'
     AND p.active = TRUE;

  IF policy_count <> 1 OR current_client_id IS NULL THEN
    RAISE EXCEPTION 'Controlled Juvan demo identity bootstrap blocked: expected one bound active Juvan approval policy';
  END IF;

  SELECT c.display_name, c.status
    INTO current_client_name, current_client_status
    FROM clients c
   WHERE c.id = current_client_id;

  IF current_client_status IS DISTINCT FROM 'active'
     OR LOWER(TRIM(COALESCE(current_client_name, ''))) <> 'juvan botha' THEN
    RAISE EXCEPTION 'Controlled Juvan demo identity bootstrap blocked: persisted canonical client is not the verified active Juvan Botha profile';
  END IF;

  SELECT COUNT(DISTINCT regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g'))::int,
         MIN(regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g'))
    INTO phone_count, controlled_phone
    FROM client_contacts cc
   WHERE cc.client_id = current_client_id
     AND cc.contact_type IN ('whatsapp', 'mobile')
     AND regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g') <> '';

  IF phone_count <> 1 OR controlled_phone IS NULL OR controlled_phone = '' THEN
    RAISE EXCEPTION 'Controlled Juvan demo identity bootstrap blocked: expected exactly one canonical WhatsApp/mobile phone identity';
  END IF;

  SELECT COUNT(DISTINCT other.id)::int
    INTO shared_active_contact_count
    FROM client_contacts other_cc
    JOIN clients other
      ON other.id = other_cc.client_id
     AND other.status = 'active'
   WHERE regexp_replace(COALESCE(other_cc.normalized_value, other_cc.value, ''), '[^0-9]', '', 'g') = controlled_phone
     AND other_cc.contact_type IN ('whatsapp', 'mobile')
     AND other.id <> current_client_id;

  IF shared_active_contact_count <> 0 THEN
    RAISE EXCEPTION 'Controlled Juvan demo identity bootstrap blocked: Juvan phone is shared with another active CRM client';
  END IF;

  INSERT INTO controlled_demo_identities
    (demo_key, normalized_phone, current_client_id, expected_display_name, active, last_bound_at, updated_at)
  VALUES
    ('juvan_botha', controlled_phone, current_client_id, 'Juvan Botha', TRUE, NOW(), NOW())
  ON CONFLICT (demo_key) DO UPDATE SET
    normalized_phone = EXCLUDED.normalized_phone,
    current_client_id = EXCLUDED.current_client_id,
    expected_display_name = EXCLUDED.expected_display_name,
    active = TRUE,
    last_bound_at = COALESCE(controlled_demo_identities.last_bound_at, NOW()),
    updated_at = NOW();
END;
$$;

-- Preserve the current JP-sole-approver booking behavior for the controlled Juvan client.
-- Only the identity source changes here: runtime routing follows the durable controlled-demo current_client_id,
-- never a display-name search. Booking & Admin UX owns the later Primary/Backup approval redesign.
CREATE OR REPLACE FUNCTION create_client_booking_approval_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_source TEXT;
  booking_client_id BIGINT;
  booking_client_status TEXT;
  observer_id BIGINT;
  required_approver_id BIGINT;
  required_approver_admin_id BIGINT;
  controlled_client_id BIGINT;
  controlled_phone TEXT;
  policy_client_id BIGINT;
  targeted_policy_admin_id BIGINT;
  anchored_contact_count INTEGER;
  shared_active_contact_count INTEGER;
  dummy_count INTEGER;
  jp_count INTEGER;
  booking_client_name TEXT;
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
       AND cc.contact_type IN ('whatsapp', 'mobile')
       AND regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g') = controlled_phone;

    IF anchored_contact_count < 1 THEN
      RAISE EXCEPTION 'Controlled Juvan booking approval blocked: exact demo phone is not attached to the current canonical client';
    END IF;

    SELECT COUNT(DISTINCT other.id)::int
      INTO shared_active_contact_count
      FROM client_contacts other_cc
      JOIN clients other
        ON other.id = other_cc.client_id
       AND other.status = 'active'
     WHERE regexp_replace(COALESCE(other_cc.normalized_value, other_cc.value, ''), '[^0-9]', '', 'g') = controlled_phone
       AND other_cc.contact_type IN ('whatsapp', 'mobile')
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
      RAISE EXCEPTION 'Controlled Juvan booking approval blocked: Jean-Pierre approver no longer satisfies the guarded admin contract';
    END IF;

    required_approver_id := NULL;
    required_approver_admin_id := targeted_policy_admin_id;
  ELSIF LOWER(TRIM(COALESCE(booking_client_name, ''))) = 'dummy test' THEN
    -- Preserve the existing inactive/historical Dummy Test approval branch until Booking & Admin UX
    -- deliberately supersedes approval behavior. Dummy Test is no longer a reusable reset identity.
    SELECT COUNT(*)::int
      INTO dummy_count
      FROM clients c
     WHERE LOWER(TRIM(c.display_name)) = 'dummy test'
       AND c.status = 'active';

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
     WHERE LOWER(display_name) = 'christel'
       AND status = 'active'
     ORDER BY id
     LIMIT 1;
  END IF;

  INSERT INTO appointment_booking_approvals
    (appointment_id, approver_staff_id, approver_admin_id, observer_staff_id, status)
  VALUES
    (NEW.appointment_id, required_approver_id, required_approver_admin_id, observer_id, 'pending')
  ON CONFLICT (appointment_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_booking_approval_hold ON appointment_staff;
CREATE TRIGGER trg_client_booking_approval_hold
AFTER INSERT ON appointment_staff
FOR EACH ROW
EXECUTE FUNCTION create_client_booking_approval_hold();
