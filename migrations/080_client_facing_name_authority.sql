-- Shiloh OS — evidence-backed client-facing name authority.
-- Control authority: PR #488 / SHILOH-CLIENT-FACING-NAME-AUTHORITY.
--
-- IMPORTANT: this migration performs ZERO current-name promotions and does not
-- mutate clients.display_name. Existing labels are preserved only as searchable
-- aliases/provenance. Imported/Goldie labels, Calendar text, WhatsApp profile
-- names, fuzzy matches and historical appointment snapshots are not promotion
-- authority.

CREATE TABLE IF NOT EXISTS client_name_aliases (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL CHECK (BTRIM(alias_name) <> ''),
  normalized_alias_name TEXT NOT NULL CHECK (BTRIM(normalized_alias_name) <> ''),
  source_type TEXT NOT NULL CHECK (BTRIM(source_type) <> ''),
  source_key TEXT NOT NULL DEFAULT '',
  source_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_name_aliases_unique_source
    UNIQUE (client_id, normalized_alias_name, source_type, source_key)
);

CREATE INDEX IF NOT EXISTS idx_client_name_aliases_client
  ON client_name_aliases(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_name_aliases_normalized
  ON client_name_aliases(normalized_alias_name, client_id);

CREATE TABLE IF NOT EXISTS client_facing_name_authorities (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  current_name TEXT NOT NULL CHECK (BTRIM(current_name) <> ''),
  normalized_name TEXT NOT NULL CHECK (BTRIM(normalized_name) <> ''),
  evidence_type TEXT NOT NULL CHECK (
    evidence_type IN (
      'explicit_client_confirmation',
      'verified_registration_intake',
      'audited_staff_correction'
    )
  ),
  evidence_reference JSONB NOT NULL CHECK (
    jsonb_typeof(evidence_reference) = 'object'
    AND evidence_reference <> '{}'::jsonb
  ),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('client','staff','system')),
  actor_reference TEXT,
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_facing_name_staff_evidence_actor_check CHECK (
    evidence_type <> 'audited_staff_correction'
    OR (actor_type = 'staff' AND BTRIM(COALESCE(actor_reference,'')) <> '')
  ),
  CONSTRAINT client_facing_name_revocation_check CHECK (
    (revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
    OR (
      revoked_at IS NOT NULL
      AND BTRIM(COALESCE(revoked_by,'')) <> ''
      AND BTRIM(COALESCE(revocation_reason,'')) <> ''
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_client_facing_name_one_active
  ON client_facing_name_authorities(client_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_facing_name_authorities_history
  ON client_facing_name_authorities(client_id, promoted_at DESC, id DESC);

-- Snapshot pre-authority compatibility labels as aliases only. This preserves
-- searchability without asserting that any existing clients.display_name is the
-- client's current authoritative name.
INSERT INTO client_name_aliases (
  client_id,
  alias_name,
  normalized_alias_name,
  source_type,
  source_key,
  source_reference
)
SELECT
  c.id,
  BTRIM(c.display_name),
  LOWER(REGEXP_REPLACE(BTRIM(c.display_name), '\s+', ' ', 'g')),
  'pre_authority_display_name',
  '',
  jsonb_build_object('clientSource', c.source)
FROM clients c
WHERE BTRIM(COALESCE(c.display_name,'')) <> ''
ON CONFLICT (client_id, normalized_alias_name, source_type, source_key) DO NOTHING;

-- Preserve explicitly reconciled Goldie labels as source-bound aliases. Only an
-- existing external-record -> canonical-client link is used; no fuzzy matching,
-- phone inference or new reconciliation is performed here.
INSERT INTO client_name_aliases (
  client_id,
  alias_name,
  normalized_alias_name,
  source_type,
  source_key,
  source_reference
)
SELECT
  er.shiloh_entity_id,
  BTRIM(ecr.display_name),
  LOWER(REGEXP_REPLACE(BTRIM(ecr.display_name), '\s+', ' ', 'g')),
  'goldie_import',
  er.external_id,
  jsonb_build_object(
    'externalRecordId', er.id,
    'externalId', er.external_id,
    'reconciliationStatus', er.reconciliation_status,
    'matchMethod', er.match_method
  )
FROM external_records er
JOIN external_client_records ecr ON ecr.external_record_id = er.id
JOIN clients c ON c.id = er.shiloh_entity_id
WHERE er.source = 'goldie'
  AND er.entity_type = 'client'
  AND er.shiloh_entity_type = 'client'
  AND er.shiloh_entity_id IS NOT NULL
  AND BTRIM(COALESCE(ecr.display_name,'')) <> ''
ON CONFLICT (client_id, normalized_alias_name, source_type, source_key) DO NOTHING;

COMMENT ON TABLE client_name_aliases IS
  'Historical/imported/search labels for a canonical client. Alias presence is provenance/search evidence only and never establishes current client-facing-name authority.';

COMMENT ON TABLE client_facing_name_authorities IS
  'Evidence-backed current client-facing-name authority. At most one active row per canonical client. Promotion is limited to Control-approved evidence types.';

COMMENT ON COLUMN clients.display_name IS
  'Compatibility/cache projection only after client-facing-name authority migration 080. Downstream client-facing communication must resolve client_facing_name_authorities instead of treating this column as independent authority.';
