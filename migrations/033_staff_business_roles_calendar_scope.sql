-- CRM-5: explicit business-role and calendar-scope model.
-- Christel is Shiloh business owner; Jean-Pierre is full business admin.
-- Marietjie is an independent/tenant practitioner scoped to her own services/clients.
-- Abigail is an employee practitioner. Savanna/Pieter remain internal overflow freelancers.

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS business_role TEXT NOT NULL DEFAULT 'employee_practitioner',
  ADD COLUMN IF NOT EXISTS calendar_scope TEXT NOT NULL DEFAULT 'own_appointments';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='staff_business_role_check') THEN
    ALTER TABLE staff ADD CONSTRAINT staff_business_role_check
      CHECK (business_role IN ('owner','tenant_practitioner','employee_practitioner','freelance','business_resource'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='staff_calendar_scope_check') THEN
    ALTER TABLE staff ADD CONSTRAINT staff_calendar_scope_check
      CHECK (calendar_scope IN ('all_business','own_services','own_appointments','none'));
  END IF;
END $$;

UPDATE staff SET business_role='owner', calendar_scope='all_business', updated_at=NOW()
 WHERE LOWER(display_name)='christel';
UPDATE staff SET business_role='tenant_practitioner', calendar_scope='own_services', updated_at=NOW()
 WHERE LOWER(display_name)='marietjie';
UPDATE staff SET business_role='employee_practitioner', calendar_scope='own_appointments', updated_at=NOW()
 WHERE LOWER(display_name)='abigail';
UPDATE staff SET business_role='freelance', calendar_scope='none', updated_at=NOW()
 WHERE LOWER(display_name) IN ('pieter','savanna massage practitioner');
UPDATE staff SET business_role='business_resource', calendar_scope='none', updated_at=NOW()
 WHERE resource_type='business_resource';

ALTER TABLE staff_admin_accounts
  ADD COLUMN IF NOT EXISTS business_role TEXT NOT NULL DEFAULT 'employee_practitioner',
  ADD COLUMN IF NOT EXISTS calendar_scope TEXT NOT NULL DEFAULT 'own_appointments';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='staff_admin_business_role_check') THEN
    ALTER TABLE staff_admin_accounts ADD CONSTRAINT staff_admin_business_role_check
      CHECK (business_role IN ('owner','business_admin','tenant_practitioner','employee_practitioner'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='staff_admin_calendar_scope_check') THEN
    ALTER TABLE staff_admin_accounts ADD CONSTRAINT staff_admin_calendar_scope_check
      CHECK (calendar_scope IN ('all_business','own_services','own_appointments','none'));
  END IF;
END $$;

UPDATE staff_admin_accounts
   SET business_role='business_admin', calendar_scope='all_business', service_scope='all_services', updated_at=NOW()
 WHERE LOWER(display_name)='jean-pierre';
UPDATE staff_admin_accounts
   SET business_role='owner', calendar_scope='all_business', service_scope='all_services', updated_at=NOW()
 WHERE LOWER(display_name)='christel';
UPDATE staff_admin_accounts
   SET business_role='tenant_practitioner', calendar_scope='own_services', service_scope='own_services', updated_at=NOW()
 WHERE LOWER(display_name)='marietjie';
UPDATE staff_admin_accounts
   SET business_role='employee_practitioner', calendar_scope='own_appointments', service_scope='own_services', updated_at=NOW()
 WHERE LOWER(display_name)='abigail';
