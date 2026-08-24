const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '075_goldie_wave_a_customer_descriptions.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);
const SOURCE_EXPORT_SHA256 = 'fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16';

const TARGET_IDS = Object.freeze([
  '082a3806-3b46-4469-88b8-68b5df95e82b',
  '592f0d7d-5a54-4f01-a7ee-c10fb0715140',
  '1c7cdc7c-67b2-4c44-b999-1b900d27ca3c',
  '8caf9baa-c5b0-4b8a-b45e-b10ca2367c50',
  '3a5d1f78-4213-401a-b279-e674608c5c5b',
  '178ff19a-a260-4915-af76-09c4f6884c39',
  'ca73086c-7a7a-47f8-90e4-992dfc8dd040',
  'd2adf221-5d19-43ff-bd7b-281aa21b2428',
  'f87d46dc-f525-409e-beb2-784c56769ae6',
  '0dd673be-ab70-4694-8727-08debcae60b5',
  '598c88c9-af8b-47b4-a22f-b2af1a905cfd',
  '975999ce-a6cc-45c4-a0ed-9f4de0f3ec5b',
  '71d29944-2474-4034-a232-5b14503c5eda',
  'a5af84f7-e1d3-4e5f-afef-a1e7a26e4caa',
  '29a37095-3263-4ce2-a3b5-2b6525804de5',
  'f3e682e1-6a03-4623-83e6-935752b27196',
  '7537cf00-0777-44a0-a04a-ce2ff3fbf2a6',
  '175c91c9-562e-4aa7-87eb-8f918462ce7f',
  '3f92913f-e670-4a75-8f0a-fc2d9d401eb5',
  'cf51772d-9dbc-48c4-98d4-4fbc50fefbde',
]);

const EXPECTED_PRIOR = Object.freeze({
  '082a3806-3b46-4469-88b8-68b5df95e82b': ['An advanced clarity-focused facial for clients wanting a deep-cleansing, refreshed and balanced-looking complexion.'],
  '592f0d7d-5a54-4f01-a7ee-c10fb0715140': ['A targeted basic facial for congested or breakout-prone skin, focused on cleansing, balancing and appropriate supportive skincare.'],
  '1c7cdc7c-67b2-4c44-b999-1b900d27ca3c': ['A facial treatment that combines professional skincare with dermaplaning to remove surface buildup and fine facial hair for a smoother-looking finish.'],
  '8caf9baa-c5b0-4b8a-b45e-b10ca2367c50': ['A brightening facial focused on the appearance of uneven tone and pigmentation while supporting a clearer, more radiant-looking complexion.'],
  '3a5d1f78-4213-401a-b279-e674608c5c5b': ['A clarity-focused facial for congested skin, including professional cleansing and treatment tailored to visible blackheads, whiteheads and breakouts.'],
  '178ff19a-a260-4915-af76-09c4f6884c39': ['A professional facial peel focused on brightening and refreshing the appearance of dull or uneven-looking skin.'],
  'ca73086c-7a7a-47f8-90e4-992dfc8dd040': ['A soothing facial designed for skin that needs a gentler, calming and clarifying treatment approach.'],
  'd2adf221-5d19-43ff-bd7b-281aa21b2428': ['A premium facial experience focused on radiance, hydration and an refreshed-looking complexion.'],
  'f87d46dc-f525-409e-beb2-784c56769ae6': ['An advanced facial focused on contouring and firming techniques for a refreshed, lifted-looking appearance.'],
  '0dd673be-ab70-4694-8727-08debcae60b5': ['A moisture-focused facial designed to support a refreshed, supple-looking complexion with a nourishing treatment experience.'],
  '598c88c9-af8b-47b4-a22f-b2af1a905cfd': ['A deep-cleansing facial focused on congested or breakout-prone skin, with treatment choices tailored to the client’s current skin condition.'],
  '975999ce-a6cc-45c4-a0ed-9f4de0f3ec5b': ['A customised advanced facial that combines complementary treatment techniques according to the client’s skin goals and suitability.'],
  '71d29944-2474-4034-a232-5b14503c5eda': ['A premium facial treatment combining advanced skincare techniques to support a more refined, refreshed and sculpted-looking complexion.'],
  'a5af84f7-e1d3-4e5f-afef-a1e7a26e4caa': ['A premium facial treatment focused on firming, contouring and supporting a refreshed, lifted-looking appearance.'],
  '29a37095-3263-4ce2-a3b5-2b6525804de5': ['A professional peel treatment focused on improving the appearance of dullness and uneven-looking tone while supporting a refreshed complexion.'],
  'f3e682e1-6a03-4623-83e6-935752b27196': ['A permanent makeup service for cosmetic lip colour and definition, planned according to the client’s preferred result and suitability.'],
  '7537cf00-0777-44a0-a04a-ce2ff3fbf2a6': ['A specialist cosmetic pigmentation consultation/service focused on areola appearance and individual treatment planning.'],
  '175c91c9-562e-4aa7-87eb-8f918462ce7f': [],
  '3f92913f-e670-4a75-8f0a-fc2d9d401eb5': ['A permanent makeup service for cosmetic eyeliner enhancement, planned according to the client’s preferred style, features and suitability.'],
  'cf51772d-9dbc-48c4-98d4-4fbc50fefbde': ['A permanent makeup service for brow enhancement, with shape and style planned according to the client’s features and preferences.'],
});

// Rows whose Goldie names did not match migration 039's normalized name key may
// legitimately still have a blank description, or may have received the known 039 seed
// if an earlier controlled normalization had already occurred. Exact-name 039 matches
// are deliberately stricter and do not accept blank pre-state.
const BLANK_PRESTATE_ALLOWED = new Set([
  '592f0d7d-5a54-4f01-a7ee-c10fb0715140',
  '1c7cdc7c-67b2-4c44-b999-1b900d27ca3c',
  '8caf9baa-c5b0-4b8a-b45e-b10ca2367c50',
  '3a5d1f78-4213-401a-b279-e674608c5c5b',
  'ca73086c-7a7a-47f8-90e4-992dfc8dd040',
  'd2adf221-5d19-43ff-bd7b-281aa21b2428',
  '71d29944-2474-4034-a232-5b14503c5eda',
  'f3e682e1-6a03-4623-83e6-935752b27196',
  '7537cf00-0777-44a0-a04a-ce2ff3fbf2a6',
  '175c91c9-562e-4aa7-87eb-8f918462ce7f',
  '3f92913f-e670-4a75-8f0a-fc2d9d401eb5',
  'cf51772d-9dbc-48c4-98d4-4fbc50fefbde',
]);

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function parseApprovedTargets(sql) {
  const parsed = new Map();
  const pattern = /\('([0-9a-f-]{36})', \$desc\$([\s\S]*?)\$desc\$\)/g;
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    if (!parsed.has(match[1])) parsed.set(match[1], match[2]);
    else if (parsed.get(match[1]) !== match[2]) throw new Error(`Migration target ${match[1]} has inconsistent duplicate descriptions`);
  }
  if (parsed.size !== 20) throw new Error(`Expected 20 unique Wave A descriptions in migration; found ${parsed.size}`);
  for (const id of TARGET_IDS) {
    if (!parsed.has(id)) throw new Error(`Migration is missing approved Wave A target ${id}`);
  }
  for (const id of parsed.keys()) {
    if (!TARGET_IDS.includes(id)) throw new Error(`Migration contains unauthorized Wave A target ${id}`);
  }
  return parsed;
}

function immutableService(row) {
  return {
    id: Number(row.id),
    externalSource: row.external_source,
    externalId: row.external_id,
    name: row.name,
    categoryId: row.category_id == null ? null : Number(row.category_id),
    status: row.status,
    durationMinutes: Number(row.duration_minutes),
    processingTimeMinutes: Number(row.processing_time_minutes),
    extraTimeMinutes: Number(row.extra_time_minutes),
    variablePrice: row.variable_price === true,
    price: row.price == null ? null : String(row.price),
    displayPrice: row.display_price,
    displayOrder: row.display_order == null ? null : Number(row.display_order),
    bookingNote: row.booking_note,
    imageUrl: row.image_url,
  };
}

async function getTargetRows(client, lock = false) {
  const result = await client.query(`
    SELECT s.id, s.external_source, s.external_id, s.name, s.category_id, s.status,
           s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
           s.variable_price, s.price, s.display_price, s.display_order,
           s.customer_description, s.booking_note, s.image_url,
           (s.status = 'active' AND EXISTS (
             SELECT 1
               FROM staff_services ss
               JOIN staff st ON st.id = ss.staff_id
              WHERE ss.service_id = s.id
                AND st.status = 'active'
                AND st.resource_type = 'practitioner'
                AND st.client_bookable = TRUE
           )) AS public_catalogue_eligible
      FROM services s
     WHERE s.external_source = 'goldie'
       AND s.external_id = ANY($1::text[])
     ORDER BY s.external_id
     ${lock ? 'FOR UPDATE OF s' : ''}
  `, [TARGET_IDS]);
  return result.rows;
}

async function getTargetMappings(client, rows) {
  const serviceIds = rows.map((row) => Number(row.id));
  if (!serviceIds.length) return [];
  const result = await client.query(`
    SELECT ss.service_id, st.id AS staff_id, st.display_name, st.status,
           st.resource_type, st.client_bookable
      FROM staff_services ss
      JOIN staff st ON st.id = ss.staff_id
     WHERE ss.service_id = ANY($1::int[])
     ORDER BY ss.service_id, st.id
  `, [serviceIds]);
  return result.rows.map((row) => ({
    serviceId: Number(row.service_id),
    staffId: Number(row.staff_id),
    staffName: row.display_name,
    staffStatus: row.status,
    resourceType: row.resource_type,
    clientBookable: row.client_bookable === true,
  }));
}

async function getNonTargetDescriptionSnapshot(client) {
  const result = await client.query(`
    SELECT id, customer_description, updated_at
      FROM services
     WHERE NOT (external_source = 'goldie' AND external_id = ANY($1::text[]))
     ORDER BY id
  `, [TARGET_IDS]);
  return result.rows.map((row) => ({
    id: Number(row.id),
    customerDescription: row.customer_description,
    updatedAt: row.updated_at == null ? null : new Date(row.updated_at).toISOString(),
  }));
}

function assertExactTargetRows(rows, approvedDescriptions) {
  if (rows.length !== 20) throw new Error(`Expected exactly 20 canonical Wave A service rows; found ${rows.length}`);
  const ids = rows.map((row) => row.external_id);
  if (new Set(ids).size !== 20) throw new Error('Duplicate canonical Wave A service mapping detected');
  for (const id of TARGET_IDS) {
    if (!ids.includes(id)) throw new Error(`Missing canonical Wave A service mapping ${id}`);
  }
  for (const row of rows) {
    if (row.external_source !== 'goldie' || !approvedDescriptions.has(row.external_id)) {
      throw new Error(`Unexpected canonical Wave A row ${row.external_source}:${row.external_id}`);
    }
    if (row.external_id === '175c91c9-562e-4aa7-87eb-8f918462ce7f') {
      if (row.status !== 'inactive' || row.public_catalogue_eligible === true) {
        throw new Error('Historical Waxing service must remain inactive and non-bookable');
      }
    } else if (row.status !== 'active' || row.public_catalogue_eligible !== true) {
      throw new Error(`Approved active Wave A service ${row.external_id} is not public-catalogue eligible`);
    }
  }
}

function assertExpectedPreDescriptions(rows, approvedDescriptions) {
  for (const row of rows) {
    const target = approvedDescriptions.get(row.external_id);
    if (row.customer_description === target) continue;
    const expected = EXPECTED_PRIOR[row.external_id] || [];
    if (expected.includes(row.customer_description)) continue;
    const blank = row.customer_description == null || row.customer_description === '';
    if (blank && BLANK_PRESTATE_ALLOWED.has(row.external_id)) continue;
    throw new Error(`Unexpected current customer description for Wave A target ${row.external_id}`);
  }
}

function assertPostDescriptions(rows, approvedDescriptions) {
  for (const row of rows) {
    const expected = approvedDescriptions.get(row.external_id);
    if (row.customer_description !== expected) {
      throw new Error(`Wave A publication postcondition failed for ${row.external_id}`);
    }
  }
}

function assertEqual(before, after, label) {
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`${label} changed outside approved Wave A scope`);
}

async function ensureGoldieWaveAPublication() {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  if (!sql.includes(SOURCE_EXPORT_SHA256)) throw new Error('Wave A migration source SHA does not match retained Goldie authority');
  const approvedDescriptions = parseApprovedTargets(sql);
  const hash = checksum(sql);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const existing = await client.query(
      'SELECT checksum, applied_at FROM schema_migrations WHERE filename = $1 FOR UPDATE',
      [MIGRATION_FILENAME]
    );
    if (existing.rowCount > 0 && existing.rows[0].checksum !== hash) {
      throw new Error(`Migration ${MIGRATION_FILENAME} has changed after being applied`);
    }

    const beforeRows = await getTargetRows(client, true);
    assertExactTargetRows(beforeRows, approvedDescriptions);
    assertExpectedPreDescriptions(beforeRows, approvedDescriptions);
    const beforeMappings = await getTargetMappings(client, beforeRows);
    const nonTargetBefore = await getNonTargetDescriptionSnapshot(client);
    const immutableBefore = beforeRows.map(immutableService);

    let applied = false;
    let appliedAt = existing.rows[0]?.applied_at || null;
    if (existing.rowCount === 0) {
      await client.query("SET LOCAL shiloh.goldie_wave_a_authority = 'PR441'");
      await client.query(sql);
      const recorded = await client.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) RETURNING applied_at',
        [MIGRATION_FILENAME, hash]
      );
      appliedAt = recorded.rows[0].applied_at;
      applied = true;
    }

    const afterRows = await getTargetRows(client, false);
    assertExactTargetRows(afterRows, approvedDescriptions);
    assertPostDescriptions(afterRows, approvedDescriptions);
    const afterMappings = await getTargetMappings(client, afterRows);
    const nonTargetAfter = await getNonTargetDescriptionSnapshot(client);

    assertEqual(immutableBefore, afterRows.map(immutableService), 'Wave A target service metadata');
    assertEqual(beforeMappings, afterMappings, 'Wave A practitioner mappings');
    assertEqual(nonTargetBefore, nonTargetAfter, 'Non-target service descriptions');

    await client.query('COMMIT');
    return {
      initialized: true,
      applied,
      migration: MIGRATION_FILENAME,
      checksumVerified: true,
      sourceExportSha256: SOURCE_EXPORT_SHA256,
      appliedAt,
      targetCount: afterRows.length,
      exactDescriptionCount: afterRows.filter((row) => row.customer_description === approvedDescriptions.get(row.external_id)).length,
      activePublicCatalogueTargetCount: afterRows.filter((row) => row.public_catalogue_eligible === true).length,
      retainedInactiveTargetCount: afterRows.filter((row) => row.status === 'inactive').length,
      mappingsPreserved: true,
      nonTargetDescriptionsPreserved: true,
    };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  MIGRATION_FILENAME,
  SOURCE_EXPORT_SHA256,
  TARGET_IDS,
  EXPECTED_PRIOR,
  BLANK_PRESTATE_ALLOWED,
  parseApprovedTargets,
  ensureGoldieWaveAPublication,
};
