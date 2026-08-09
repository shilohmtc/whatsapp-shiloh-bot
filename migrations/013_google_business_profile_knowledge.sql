CREATE TABLE IF NOT EXISTS clinic_business_profile (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'google_business_profile',
  external_location_name TEXT NOT NULL UNIQUE,
  title TEXT,
  website_uri TEXT,
  primary_phone TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  regular_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  special_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  last_status TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clinic_business_profile_provider_idx
  ON clinic_business_profile(provider);
