-- Bind the reusable Juvan demo identity only when the exact controlled phone is attached
-- through the normal whatsapp_onboarding client path. This runs inside the same transaction
-- as client_contacts insertion, so pointer/policy/contact state commits or rolls back together.

CREATE OR REPLACE FUNCTION guard_and_rebind_controlled_demo_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_phone TEXT;
  demo_row controlled_demo_identities%ROWTYPE;
  target_client_status TEXT;
  target_client_source TEXT;
  other_binding_count INTEGER;
  policy_match_count INTEGER;
  policy_update_count INTEGER;
  previous_client_id BIGINT;
BEGIN
  IF NEW.contact_type NOT IN ('whatsapp', 'mobile') THEN
    RETURN NEW;
  END IF;

  normalized_phone := regexp_replace(COALESCE(NEW.normalized_value, NEW.value, ''), '[^0-9]', '', 'g');
  IF normalized_phone = '' THEN
    RETURN NEW;
  END IF;

  SELECT *
    INTO demo_row
    FROM controlled_demo_identities d
   WHERE d.normalized_phone = normalized_phone
     AND d.active = TRUE
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT c.status, c.source
    INTO target_client_status, target_client_source
    FROM clients c
   WHERE c.id = NEW.client_id
   FOR UPDATE;

  IF target_client_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Controlled Juvan identity binding blocked: target canonical client is not active';
  END IF;

  IF demo_row.current_client_id IS NOT NULL
     AND demo_row.current_client_id IS DISTINCT FROM NEW.client_id THEN
    RAISE EXCEPTION 'Controlled Juvan identity binding blocked: controlled phone is already bound to another canonical client';
  END IF;

  SELECT COUNT(DISTINCT cc.client_id)::int
    INTO other_binding_count
    FROM client_contacts cc
   WHERE regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g') = normalized_phone
     AND cc.contact_type IN ('whatsapp', 'mobile')
     AND cc.client_id <> NEW.client_id
     AND (TG_OP <> 'UPDATE' OR cc.id <> NEW.id);

  IF other_binding_count <> 0 THEN
    RAISE EXCEPTION 'Controlled Juvan identity binding blocked: controlled phone already has another CRM binding';
  END IF;

  IF demo_row.current_client_id IS NULL THEN
    IF target_client_source IS DISTINCT FROM 'whatsapp_onboarding' THEN
      RAISE EXCEPTION 'Controlled Juvan identity binding blocked: unbound demo identity may rebind only through normal WhatsApp onboarding';
    END IF;

    previous_client_id := demo_row.current_client_id;

    UPDATE controlled_demo_identities
       SET current_client_id = NEW.client_id,
           last_bound_at = NOW(),
           updated_at = NOW()
     WHERE demo_key = demo_row.demo_key
       AND current_client_id IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Controlled Juvan identity binding blocked: demo pointer changed concurrently';
    END IF;

    UPDATE client_booking_approval_policies
       SET client_id = NEW.client_id,
           updated_at = NOW()
     WHERE policy_key = 'juvan_botha_jp_booking_approval'
       AND active = TRUE
       AND client_id IS NULL;
    GET DIAGNOSTICS policy_update_count = ROW_COUNT;

    IF policy_update_count <> 1 THEN
      RAISE EXCEPTION 'Controlled Juvan identity binding blocked: approval policy could not be rebound atomically';
    END IF;

    INSERT INTO crm_audit_events (action, entity_type, entity_id, metadata)
    VALUES (
      'controlled_demo_identity.rebound',
      'client',
      NEW.client_id::text,
      jsonb_build_object(
        'demoKey', demo_row.demo_key,
        'previousClientId', previous_client_id,
        'currentClientId', NEW.client_id,
        'phoneSuffix', RIGHT(normalized_phone, 4),
        'source', 'whatsapp_onboarding'
      )
    );
  ELSE
    SELECT COUNT(*)::int
      INTO policy_match_count
      FROM client_booking_approval_policies p
     WHERE p.policy_key = 'juvan_botha_jp_booking_approval'
       AND p.active = TRUE
       AND p.client_id = NEW.client_id;

    IF policy_match_count <> 1 THEN
      RAISE EXCEPTION 'Controlled Juvan identity binding blocked: approval policy pointer does not match the bound demo client';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_and_rebind_controlled_demo_contact ON client_contacts;
CREATE TRIGGER trg_guard_and_rebind_controlled_demo_contact
BEFORE INSERT OR UPDATE OF client_id, contact_type, normalized_value, value
ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION guard_and_rebind_controlled_demo_contact();
