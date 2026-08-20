-- Route only the authoritatively resolved canonical Juvan Botha client to Jean-Pierre
-- for client-booking approval. The name is used only to resolve/verify one canonical
-- client at migration time and as a fail-closed drift backstop. Runtime routing is
-- keyed by the persisted canonical client_id.

CREATE TABLE IF NOT EXISTS client_booking_approval_policies (
  policy_key TEXT PRIMARY KEY,
  client_id BIGINT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE RESTRICT,
  approver_admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE RESTRICT,
  expected_display_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_booking_approval_policies_active_client
  ON client_booking_approval_policies(client_id, active);

DO $$
DECLARE
  target_count INTEGER;
  target_client_id BIGINT;
  target_contact_count INTEGER;
  shared_active_contact_count INTEGER;
  jp_count INTEGER;
  jp_admin_id BIGINT;
BEGIN
  SELECT COUNT(*)::int, MIN(id)
    INTO target_count, target_client_id
    FROM clients
   WHERE status = 'active'
     AND LOWER(TRIM(display_name)) = 'juvan botha';

  IF target_count <> 1 OR target_client_id IS NULL THEN
    RAISE EXCEPTION 'Juvan Botha approval blocked: expected exactly one active canonical CRM Juvan Botha client';
  END IF;

  SELECT COUNT(DISTINCT cc.normalized_value)::int
    INTO target_contact_count
    FROM client_contacts cc
   WHERE cc.client_id = target_client_id
     AND cc.contact_type IN ('whatsapp', 'mobile')
     AND NULLIF(TRIM(cc.normalized_value), '') IS NOT NULL;

  IF target_contact_count < 1 THEN
    RAISE EXCEPTION 'Juvan Botha approval blocked: canonical client has no WhatsApp/mobile identity';
  END IF;

  SELECT COUNT(DISTINCT other.id)::int
    INTO shared_active_contact_count
    FROM client_contacts target_cc
    JOIN client_contacts other_cc
      ON other_cc.normalized_value = target_cc.normalized_value
     AND other_cc.contact_type IN ('whatsapp', 'mobile')
    JOIN clients other
      ON other.id = other_cc.client_id
     AND other.status = 'active'
   WHERE target_cc.client_id = target_client_id
     AND target_cc.contact_type IN ('whatsapp', 'mobile')
     AND NULLIF(TRIM(target_cc.normalized_value), '') IS NOT NULL
     AND other.id <> target_client_id;

  IF shared_active_contact_count <> 0 THEN
    RAISE EXCEPTION 'Juvan Botha approval blocked: canonical WhatsApp/mobile identity is shared with another active client';
  END IF;

  SELECT COUNT(*)::int, MIN(saa.id)
    INTO jp_count, jp_admin_id
    FROM staff_admin_accounts saa
   WHERE LOWER(TRIM(saa.display_name)) = 'jean-pierre'
     AND saa.active = TRUE
     AND saa.business_role = 'business_admin'
     AND saa.calendar_scope = 'all_business'
     AND saa.service_scope = 'all_services'
     AND saa.normalized_whatsapp IS NOT NULL;

  IF jp_count <> 1 OR jp_admin_id IS NULL THEN
    RAISE EXCEPTION 'Juvan Botha approval blocked: expected exactly one active Jean-Pierre business_admin account with all_business/all_services scope and WhatsApp identity';
  END IF;

  INSERT INTO client_booking_approval_policies
    (policy_key, client_id, approver_admin_id, expected_display_name, active, updated_at)
  VALUES
    ('juvan_botha_jp_booking_approval', target_client_id, jp_admin_id, 'Juvan Botha', TRUE, NOW())
  ON CONFLICT (policy_key) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    approver_admin_id = EXCLUDED.approver_admin_id,
    expected_display_name = EXCLUDED.expected_display_name,
    active = TRUE,
    updated_at = NOW();
END;
$$;

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
  targeted_policy_admin_id BIGINT;
  active_target_count INTEGER;
  target_contact_count INTEGER;
  shared_active_contact_count INTEGER;
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
  targeted_policy_admin_id := NULL;

  SELECT p.approver_admin_id
    INTO targeted_policy_admin_id
    FROM client_booking_approval_policies p
   WHERE p.policy_key = 'juvan_botha_jp_booking_approval'
     AND p.client_id = booking_client_id
     AND p.active = TRUE
   LIMIT 1;

  IF targeted_policy_admin_id IS NOT NULL THEN
    IF booking_client_status IS DISTINCT FROM 'active'
       OR LOWER(TRIM(COALESCE(booking_client_name, ''))) <> 'juvan botha' THEN
      RAISE EXCEPTION 'Juvan Botha approval blocked: persisted canonical client identity drifted';
    END IF;

    SELECT COUNT(*)::int
      INTO active_target_count
      FROM clients c
     WHERE c.status = 'active'
       AND LOWER(TRIM(c.display_name)) = 'juvan botha';

    IF active_target_count <> 1 THEN
      RAISE EXCEPTION 'Juvan Botha approval blocked: canonical CRM identity is no longer unique';
    END IF;

    SELECT COUNT(DISTINCT cc.normalized_value)::int
      INTO target_contact_count
      FROM client_contacts cc
     WHERE cc.client_id = booking_client_id
       AND cc.contact_type IN ('whatsapp', 'mobile')
       AND NULLIF(TRIM(cc.normalized_value), '') IS NOT NULL;

    IF target_contact_count < 1 THEN
      RAISE EXCEPTION 'Juvan Botha approval blocked: canonical client has no WhatsApp/mobile identity';
    END IF;

    SELECT COUNT(DISTINCT other.id)::int
      INTO shared_active_contact_count
      FROM client_contacts target_cc
      JOIN client_contacts other_cc
        ON other_cc.normalized_value = target_cc.normalized_value
       AND other_cc.contact_type IN ('whatsapp', 'mobile')
      JOIN clients other
        ON other.id = other_cc.client_id
       AND other.status = 'active'
     WHERE target_cc.client_id = booking_client_id
       AND target_cc.contact_type IN ('whatsapp', 'mobile')
       AND NULLIF(TRIM(target_cc.normalized_value), '') IS NOT NULL
       AND other.id <> booking_client_id;

    IF shared_active_contact_count <> 0 THEN
      RAISE EXCEPTION 'Juvan Botha approval blocked: canonical WhatsApp/mobile identity is shared with another active client';
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
      RAISE EXCEPTION 'Juvan Botha approval blocked: persisted Jean-Pierre approver no longer satisfies the guarded admin contract';
    END IF;

    required_approver_id := NULL;
    required_approver_admin_id := targeted_policy_admin_id;
  ELSIF LOWER(TRIM(COALESCE(booking_client_name, ''))) = 'juvan botha' THEN
    RAISE EXCEPTION 'Juvan Botha approval blocked: canonical client policy is missing';
  ELSIF LOWER(TRIM(COALESCE(booking_client_name, ''))) = 'dummy test' THEN
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
