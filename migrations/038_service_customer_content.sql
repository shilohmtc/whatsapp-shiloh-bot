-- P3 customer-facing service catalogue content foundation.
-- Presentation-only fields; no names, prices, durations, staff mappings or bookings are altered.
ALTER TABLE services ADD COLUMN IF NOT EXISTS customer_description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS booking_note TEXT;
