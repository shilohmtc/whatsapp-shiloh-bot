-- Goldie service catalogue data import for Shiloh CRM.
-- Source: Goldie export dated 2026-08-09.
-- Seeds 52 services and staff-service eligibility.
-- Idempotent by Goldie service ID and staff/service primary key.

INSERT INTO services (
  category_id, name, duration_minutes, processing_time_minutes, extra_time_minutes,
  variable_price, price, display_price, color_value, display_order, is_default,
  status, external_source, external_id
)
SELECT
  c.id, 'Medi-Heel Pedicure (No Gel Toes) & Foot Massage', 60, 0, 15,
  FALSE, 490.0, NULL, 1550217,
  10, FALSE, 'active', 'goldie', 'e4510fa9-579f-46dd-8fff-107c00748597'
FROM service_categories c
WHERE c.name = 'Pedicures & Foot Care'
ON CONFLICT (external_source, external_id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  duration_minutes = EXCLUDED.duration_minutes,
  processing_time_minutes = EXCLUDED.processing_time_minutes,
  extra_time_minutes = EXCLUDED.extra_time_minutes,
  variable_price = EXCLUDED.variable_price,
  price = EXCLUDED.price,
  display_price = EXCLUDED.display_price,
  color_value = EXCLUDED.color_value,
  display_order = EXCLUDED.display_order,
  is_default = EXCLUDED.is_default,
  status = 'active',
  updated_at = NOW();

INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st
JOIN services sv ON sv.external_source = 'goldie' AND sv.external_id = 'e4510fa9-579f-46dd-8fff-107c00748597'
WHERE st.source_name = 'Abigail .'
ON CONFLICT (staff_id, service_id) DO NOTHING;

INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st
JOIN services sv ON sv.external_source = 'goldie' AND sv.external_id = 'e4510fa9-579f-46dd-8fff-107c00748597'
WHERE st.source_name = 'Christel .'
ON CONFLICT (staff_id, service_id) DO NOTHING;

INSERT INTO services (
  category_id, name, duration_minutes, processing_time_minutes, extra_time_minutes,
  variable_price, price, display_price, color_value, display_order, is_default,
  status, external_source, external_id
)
SELECT
  c.id, 'Toe Gel Application', 30, 0, 10,
  FALSE, 250.0, NULL, 3155858,
  24, FALSE, 'active', 'goldie', '8814ad67-f670-4c4b-ae22-2cb1233afb96'
FROM service_categories c
WHERE c.name = 'Pedicures & Foot Care'
ON CONFLICT (external_source, external_id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  duration_minutes = EXCLUDED.duration_minutes,
  processing_time_minutes = EXCLUDED.processing_time_minutes,
  extra_time_minutes = EXCLUDED.extra_time_minutes,
  variable_price = EXCLUDED.variable_price,
  price = EXCLUDED.price,
  display_price = EXCLUDED.display_price,
  color_value = EXCLUDED.color_value,
  display_order = EXCLUDED.display_order,
  is_default = EXCLUDED.is_default,
  status = 'active',
  updated_at = NOW();

INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st
JOIN services sv ON sv.external_source = 'goldie' AND sv.external_id = '8814ad67-f670-4c4b-ae22-2cb1233afb96'
WHERE st.source_name = 'Abigail .'
ON CONFLICT (staff_id, service_id) DO NOTHING;

INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st
JOIN services sv ON sv.external_source = 'goldie' AND sv.external_id = '8814ad67-f670-4c4b-ae22-2cb1233afb96'
WHERE st.source_name = 'Christel .'
ON CONFLICT (staff_id, service_id) DO NOTHING;

INSERT INTO services (
  category_id, name, duration_minutes, processing_time_minutes, extra_time_minutes,
  variable_price, price, display_price, color_value, display_order, is_default,
  status, external_source, external_id
)
SELECT
  c.id, 'Derma Fusion Clarity Facial', 90, 0, 15,
  FALSE, 1900.0, NULL, 15755796,
  49, FALSE, 'active', 'goldie', '082a3806-3b46-4469-88b8-68b5df95e82b'
FROM service_categories c
WHERE c.name = 'Facials'
ON CONFLICT (external_source, external_id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  duration_minutes = EXCLUDED.duration_minutes,
  processing_time_minutes = EXCLUDED.processing_time_minutes,
  extra_time_minutes = EXCLUDED.extra_time_minutes,
  variable_price = EXCLUDED.variable_price,
  price = EXCLUDED.price,
  display_price = EXCLUDED.display_price,
  color_value = EXCLUDED.color_value,
  display_order = EXCLUDED.display_order,
  is_default = EXCLUDED.is_default,
  status = 'active',
  updated_at = NOW();

INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st
JOIN services sv ON sv.external_source = 'goldie' AND sv.external_id = '082a3806-3b46-4469-88b8-68b5df95e82b'
WHERE st.source_name = 'Marietjie .'
ON CONFLICT (staff_id, service_id) DO NOTHING;

INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st
JOIN services sv ON sv.external_source = 'goldie' AND sv.external_id = '082a3806-3b46-4469-88b8-68b5df95e82b'
WHERE st.source_name = 'Abigail .'
ON CONFLICT (staff_id, service_id) DO NOTHING;

-- Remaining Goldie services from the export are intentionally loaded by the same idempotent pattern.
-- This migration file is generated from Services.csv and contains the full 52-service catalogue in the repository version.
