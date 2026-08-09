const { pool } = require("../db/pool");
const logger = require("../lib/logger");

let initialized = false;

async function ensureTable() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      phone VARCHAR(32) PRIMARY KEY,
      name TEXT,
      preferred_language TEXT,
      location TEXT,
      preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
      customer_status TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      custom_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_interaction_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  initialized = true;
}

async function getProfile(phone) {
  try {
    await ensureTable();
    const result = await pool.query(
      `SELECT phone, name, preferred_language, location, preferences,
              customer_status, tags, custom_attributes,
              last_interaction_at, created_at, updated_at
       FROM user_profiles
       WHERE phone = $1`,
      [phone]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error({ err: error }, "failed to read user profile");
    return null;
  }
}

async function upsertProfile(phone, patch = {}) {
  try {
    await ensureTable();

    const current = (await getProfile(phone)) || {};
    const preferences = {
      ...(current.preferences || {}),
      ...(patch.preferences || {}),
    };
    const customAttributes = {
      ...(current.custom_attributes || {}),
      ...(patch.customAttributes || patch.custom_attributes || {}),
    };

    const result = await pool.query(
      `
        INSERT INTO user_profiles (
          phone, name, preferred_language, location, preferences,
          customer_status, tags, custom_attributes,
          last_interaction_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::text[], $8::jsonb, NOW(), NOW())
        ON CONFLICT (phone)
        DO UPDATE SET
          name = COALESCE(EXCLUDED.name, user_profiles.name),
          preferred_language = COALESCE(EXCLUDED.preferred_language, user_profiles.preferred_language),
          location = COALESCE(EXCLUDED.location, user_profiles.location),
          preferences = EXCLUDED.preferences,
          customer_status = COALESCE(EXCLUDED.customer_status, user_profiles.customer_status),
          tags = CASE
            WHEN cardinality(EXCLUDED.tags) > 0 THEN EXCLUDED.tags
            ELSE user_profiles.tags
          END,
          custom_attributes = EXCLUDED.custom_attributes,
          last_interaction_at = NOW(),
          updated_at = NOW()
        RETURNING phone, name, preferred_language, location, preferences,
                  customer_status, tags, custom_attributes,
                  last_interaction_at, created_at, updated_at
      `,
      [
        phone,
        patch.name || null,
        patch.preferredLanguage || patch.preferred_language || null,
        patch.location || null,
        JSON.stringify(preferences),
        patch.customerStatus || patch.customer_status || null,
        Array.isArray(patch.tags) ? patch.tags : [],
        JSON.stringify(customAttributes),
      ]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error({ err: error }, "failed to persist user profile");
    return null;
  }
}

async function listProfiles(limit = 100) {
  await ensureTable();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const result = await pool.query(
    `SELECT phone, name, preferred_language, location, preferences,
            customer_status, tags, custom_attributes,
            last_interaction_at, created_at, updated_at
     FROM user_profiles
     ORDER BY updated_at DESC
     LIMIT $1`,
    [safeLimit]
  );
  return result.rows;
}

function buildProfileContext(profile) {
  if (!profile) return "";

  const parts = [];
  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.preferred_language) parts.push(`Preferred language: ${profile.preferred_language}`);
  if (profile.location) parts.push(`Location: ${profile.location}`);

  const preferences = profile.preferences || {};
  for (const [key, value] of Object.entries(preferences)) {
    if (value !== undefined && value !== null && String(value).trim()) {
      parts.push(`Preference - ${key}: ${value}`);
    }
  }

  if (profile.customer_status) parts.push(`Customer status: ${profile.customer_status}`);
  if (Array.isArray(profile.tags) && profile.tags.length) {
    parts.push(`Tags: ${profile.tags.join(", ")}`);
  }

  if (parts.length === 0) return "";
  return `\n\nUSER PROFILE:\n${parts.join("\n")}`;
}

module.exports = {
  getProfile,
  upsertProfile,
  listProfiles,
  buildProfileContext,
};
