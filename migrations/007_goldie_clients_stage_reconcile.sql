-- Goldie client staging and deterministic reconciliation classification.
-- Source: Clients.csv from Goldie export dated 2026-08-09.
-- Preserves all 975 Goldie client UUIDs. Does not create canonical clients.
-- Automatic matches require: unique Goldie primary phone, exactly one canonical phone match,
-- and exact normalized display-name match. All other possible collisions require review.

CREATE TEMP TABLE goldie_clients_stage (
  external_client_id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  normalized_phone TEXT,
  secondary_phone TEXT,
  normalized_secondary_phone TEXT,
  address TEXT,
  notes TEXT,
  has_photo BOOLEAN,
  is_blocked BOOLEAN
) ON COMMIT DROP;

INSERT INTO goldie_clients_stage
SELECT *
FROM jsonb_to_recordset($goldie_clients$
REPLACE_PAYLOAD
$goldie_clients$::jsonb) AS x(
  external_client_id TEXT,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  normalized_phone TEXT,
  secondary_phone TEXT,
  normalized_secondary_phone TEXT,
  address TEXT,
  notes TEXT,
  has_photo BOOLEAN,
  is_blocked BOOLEAN
);
