ALTER TABLE staff ADD COLUMN IF NOT EXISTS scheduling_type TEXT NOT NULL DEFAULT 'regular';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='staff_scheduling_type_check') THEN
    ALTER TABLE staff ADD CONSTRAINT staff_scheduling_type_check CHECK (scheduling_type IN ('regular','freelance','system'));
  END IF;
END $$;

UPDATE staff SET scheduling_type='freelance', updated_at=NOW() WHERE LOWER(display_name) IN ('pieter','savanna massage practitioner');
UPDATE staff SET scheduling_type='system', updated_at=NOW() WHERE resource_type='business_resource';
UPDATE staff SET scheduling_type='regular', updated_at=NOW() WHERE resource_type='practitioner' AND LOWER(display_name) NOT IN ('pieter','savanna massage practitioner');

CREATE INDEX IF NOT EXISTS idx_staff_scheduling_type ON staff(scheduling_type);
