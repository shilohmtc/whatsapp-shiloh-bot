const { pool } = require('../db/pool');

let ready = false;

async function ensureBookingApprovalInfrastructure(db = pool) {
  if (ready && db === pool) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS appointment_booking_approvals (
      appointment_id BIGINT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
      approver_staff_id BIGINT NOT NULL REFERENCES staff(id),
      observer_staff_id BIGINT REFERENCES staff(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approver_notified_at TIMESTAMPTZ,
      observer_notified_at TIMESTAMPTZ,
      decided_at TIMESTAMPTZ,
      decided_by_admin_id BIGINT,
      decision_note TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_status ON appointment_booking_approvals(status, requested_at)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_appointment_booking_approvals_approver ON appointment_booking_approvals(approver_staff_id, status)`);

  await db.query(`
    CREATE OR REPLACE FUNCTION create_client_booking_approval_hold()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    DECLARE
      booking_source TEXT;
      booking_client_name TEXT;
      observer_id BIGINT;
      required_approver_id BIGINT;
      dummy_count INTEGER;
      jp_count INTEGER;
    BEGIN
      SELECT a.source, c.display_name
        INTO booking_source, booking_client_name
        FROM appointments a
        JOIN clients c ON c.id = a.client_id
       WHERE a.id = NEW.appointment_id;

      IF booking_source IS DISTINCT FROM 'shiloh_client_whatsapp' OR NEW.position <> 1 THEN
        RETURN NEW;
      END IF;

      observer_id := NULL;
      required_approver_id := NEW.staff_id;

      IF LOWER(TRIM(COALESCE(booking_client_name, ''))) = 'dummy test' THEN
        SELECT COUNT(*)::int
          INTO dummy_count
          FROM clients c
         WHERE LOWER(TRIM(c.display_name)) = 'dummy test'
           AND c.status = 'active';

        IF dummy_count <> 1 THEN
          RAISE EXCEPTION 'Dummy Test approval blocked: expected exactly one active CRM Dummy Test profile';
        END IF;

        SELECT COUNT(DISTINCT saa.staff_id)::int, MIN(saa.staff_id)
          INTO jp_count, required_approver_id
          FROM staff_admin_accounts saa
          JOIN staff st ON st.id = saa.staff_id
         WHERE LOWER(TRIM(saa.display_name)) = 'jean-pierre'
           AND saa.active = TRUE
           AND saa.business_role = 'business_admin'
           AND saa.calendar_scope = 'all_business'
           AND saa.service_scope = 'all_services'
           AND st.status = 'active';

        IF jp_count <> 1 OR required_approver_id IS NULL THEN
          RAISE EXCEPTION 'Dummy Test approval blocked: expected exactly one active Jean-Pierre business_admin binding with all_business/all_services scope';
        END IF;
      ELSIF LOWER(COALESCE(NEW.staff_name_snapshot, '')) = 'abigail' THEN
        SELECT id INTO observer_id
          FROM staff
         WHERE LOWER(display_name) = 'christel'
           AND status = 'active'
         ORDER BY id
         LIMIT 1;
      END IF;

      INSERT INTO appointment_booking_approvals
        (appointment_id, approver_staff_id, observer_staff_id, status)
      VALUES (NEW.appointment_id, required_approver_id, observer_id, 'pending')
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
