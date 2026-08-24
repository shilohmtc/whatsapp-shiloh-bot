const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '076_goldie_wave_b_customer_descriptions.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);
const SOURCE_EXPORT_SHA256 = 'fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16';

const TARGET_IDS = Object.freeze([
  'e4510fa9-579f-46dd-8fff-107c00748597',
  '8814ad67-f670-4c4b-ae22-2cb1233afb96',
  'b534a8e5-3fe1-46e9-9ca0-bba116e6bf53',
  '074c7773-2e78-4761-a9c6-c72dc02f7994',
  '9726c400-234d-489a-9e5c-d247c21e4a85',
  '49730b6c-133d-4e60-b98c-d33a1091d02d',
  '8d5ee63d-8caa-45aa-b2d3-2a91d2478672',
  'c830d602-0e71-499e-9348-114584c8a985',
  '46043512-d1df-4169-92b4-132160fca809',
  'e8c5bf09-c583-4bcc-9da9-a560180cf776',
  '69805dfe-8238-47d2-8b1d-f154f0033e27',
  '61a0a7db-426d-4ecf-94ff-9fd6855f384d',
  '2d5b6147-ee9f-4a97-8e27-6270751c2673',
  '406d85e9-4d36-42d3-9611-ab1834038662',
  '409ef0e8-2063-47b2-86db-ca0af30787de',
]);

const RETAINED_INACTIVE_IDS = new Set([
  '8814ad67-f670-4c4b-ae22-2cb1233afb96',
  '49730b6c-133d-4e60-b98c-d33a1091d02d',
]);

const EXPECTED_NAMES = Object.freeze({
  'e4510fa9-579f-46dd-8fff-107c00748597': ['Medi-Heel Pedicure (No Gel Toes) & Foot Massage'],
  '8814ad67-f670-4c4b-ae22-2cb1233afb96': ['Toe Gel Application'],
  'b534a8e5-3fe1-46e9-9ca0-bba116e6bf53': ['Medi-Heel Pedicure (With Gel Toes) & Foot Massage'],
  '074c7773-2e78-4761-a9c6-c72dc02f7994': ['Profosma Jet Plasma'],
  '9726c400-234d-489a-9e5c-d247c21e4a85': ['Plasma Fybroblast'],
  '49730b6c-133d-4e60-b98c-d33a1091d02d': ['Pressotherapy Single Session'],
  '8d5ee63d-8caa-45aa-b2d3-2a91d2478672': ['Ozone & Far Infrared Therapy'],
  'c830d602-0e71-499e-9348-114584c8a985': ['1. SQT Anti-Aging Rejuvenation BioMicroneedling + SQT Revitalizing Beauty BioMicroneedling'],
  '46043512-d1df-4169-92b4-132160fca809': ['Sports Massage Full Body'],
  'e8c5bf09-c583-4bcc-9da9-a560180cf776': ['Stretch Mark Microneedling Consultation', '⁠Stretch Mark Microneedling Consultation'],
  '69805dfe-8238-47d2-8b1d-f154f0033e27': ['HIFU (High-Intensity Focused Ultrasound)', 'HIFU (High Intensity Focused Ultrasound'],
  '61a0a7db-426d-4ecf-94ff-9fd6855f384d': ['Full Body Swedish'],
  '2d5b6147-ee9f-4a97-8e27-6270751c2673': ['Targeted Area-Specific Sports Massage', 'Targated Area Specific Sports Massage'],
  '406d85e9-4d36-42d3-9611-ab1834038662': ['Soothing & Restorative Pregnancy Massage'],
  '409ef0e8-2063-47b2-86db-ca0af30787de': ['Cupping Area Specific'],
});

const EXPECTED_PRIOR = Object.freeze({
  'e4510fa9-579f-46dd-8fff-107c00748597': ['A restorative foot-care treatment combining Medi-Heel pedicure care with a relaxing foot massage, without gel polish application.'],
  '8814ad67-f670-4c4b-ae22-2cb1233afb96': [],
  'b534a8e5-3fe1-46e9-9ca0-bba116e6bf53': ['A complete Medi-Heel foot-care treatment with gel polish application and a relaxing foot massage for a polished finish.'],
  '074c7773-2e78-4761-a9c6-c72dc02f7994': ['An advanced plasma-based aesthetic treatment with the treatment plan and pricing determined by the selected area, goals and suitability assessment.'],
  '9726c400-234d-489a-9e5c-d247c21e4a85': ['A consultation for plasma fibroblast treatment to discuss the area of concern, suitability, treatment planning, pricing and aftercare.'],
  '49730b6c-133d-4e60-b98c-d33a1091d02d': [],
  '8d5ee63d-8caa-45aa-b2d3-2a91d2478672': ['A wellness treatment combining ozone and far-infrared therapy in a relaxing clinic setting, with the session selected according to the client’s needs and suitability.'],
  'c830d602-0e71-499e-9348-114584c8a985': ['An SQT BioMicroneedling option focused on rejuvenation and revitalising skincare goals, selected according to the client’s skin assessment and suitability.'],
  '46043512-d1df-4169-92b4-132160fca809': ['A longer full-body sports massage using focused massage techniques for clients wanting attention across multiple muscle groups.'],
  'e8c5bf09-c583-4bcc-9da9-a560180cf776': ['A consultation to assess stretch-mark concerns, discuss microneedling suitability, treatment planning, pricing and aftercare.'],
  '69805dfe-8238-47d2-8b1d-f154f0033e27': ['An advanced HIFU aesthetic treatment with the treatment area and plan selected according to the client’s goals, assessment and suitability.'],
  '61a0a7db-426d-4ecf-94ff-9fd6855f384d': ['A classic full-body relaxation massage using flowing techniques to encourage comfort, relaxation and an overall sense of wellbeing.'],
  '2d5b6147-ee9f-4a97-8e27-6270751c2673': ['A focused sports massage for a selected body area, using targeted techniques according to the client’s comfort and treatment goals.'],
  '406d85e9-4d36-42d3-9611-ab1834038662': ['A supportive pregnancy massage adapted for comfort, positioning and relaxation during pregnancy.'],
  '409ef0e8-2063-47b2-86db-ca0af30787de': ['A targeted treatment using massage cupping on a selected area as part of a focused bodywork session.'],
});

const BLANK_PRESTATE_ALLOWED = new Set(RETAINED_INACTIVE_IDS);

function checksum(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseApprovedTargets(sql) {
  const approved = new Map();
  const pattern = /\('([0-9a-f-]{36})',\s*\$desc\$([\s\S]*?)\$desc\$\)/g;
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    if (approved.has(match[1]) && approved.get(match[1]) !== match[2]) {
      throw new Error(`Migration target ${match[1]} has inconsistent duplicate descriptions`);
    }
    approved.set(match[1], match[2]);
  }
  if (approved.size !== TARGET_IDS.length) {
    throw new Error(`Expected exactly ${TARGET_IDS.length} Wave B migration targets; found ${approved.size}`);
  }
  for (const id of approved.keys()) {
    if (!TARGET_IDS.includes(id)) throw new Error(`Migration contains unauthorized Wave B target ${id}`);
  }
  for (const id of TARGET_IDS) {
    if (!approved.has(id)) throw new Error(`Migration is missing approved Wave B target ${id}`);
  }
  return approved;
}

async function getTargetRows(client, lock = false) {
  const result = await client.query(`
    SELECT s.id,s.external_id,s.external_source,s.name,s.status,s.category_id,
           s.duration_minutes,s.processing_time_minutes,s.extra_time_minutes,
           s.variable_price,s.price,s.display_price,s.color_value,s.display_order,
           s.is_default,s.booking_note,s.customer_description,
           EXISTS (
             SELECT 1
               FROM staff_services ss
               JOIN staff st ON st.id=ss.staff_id
              WHERE ss.service_id=s.id
                AND st.status='active'
                AND st.resource_type='practitioner'
                AND st.client_bookable=TRUE
           ) AS has_active_client_bookable_practitioner,
           (s.status='active' AND EXISTS (
             SELECT 1
               FROM staff_services ss
               JOIN staff st ON st.id=ss.staff_id
              WHERE ss.service_id=s.id
                AND st.status='active'
                AND st.resource_type='practitioner'
                AND st.client_bookable=TRUE
           )) AS public_catalogue_eligible
      FROM services s
     WHERE s.external_source='goldie'
       AND s.external_id = ANY($1::text[])
     ORDER BY s.external_id
     ${lock ? 'FOR UPDATE' : ''}
  `, [TARGET_IDS]);
  return result.rows;
}

async function getTargetMappings(client, rows) {
  const serviceIds = rows.map((row) => row.id);
  if (!serviceIds.length) return [];
  const result = await client.query(`
    SELECT ss.service_id,st.id AS staff_id,st.display_name,st.status,st.resource_type,st.client_bookable
      FROM staff_services ss
      JOIN staff st ON st.id=ss.staff_id
     WHERE ss.service_id = ANY($1::bigint[])
     ORDER BY ss.service_id,st.id
  `, [serviceIds]);
  return result.rows;
}

async function getNonTargetDescriptionSnapshot(client) {
  const result = await client.query(`
    SELECT id,external_source,external_id,customer_description
      FROM services
     WHERE NOT (external_source='goldie' AND external_id = ANY($1::text[]))
     ORDER BY id
  `, [TARGET_IDS]);
  return result.rows;
}

function immutableService(row) {
  return {
    id: row.id,
    external_id: row.external_id,
    external_source: row.external_source,
    name: row.name,
    status: row.status,
    category_id: row.category_id,
    duration_minutes: row.duration_minutes,
    processing_time_minutes: row.processing_time_minutes,
    extra_time_minutes: row.extra_time_minutes,
    variable_price: row.variable_price,
    price: row.price,
    display_price: row.display_price,
    color_value: row.color_value,
    display_order: row.display_order,
    is_default: row.is_default,
    booking_note: row.booking_note,
  };
}

function assertExactTargetRows(rows, approvedDescriptions) {
  if (rows.length !== TARGET_IDS.length) {
    throw new Error(`Expected exactly 15 canonical Wave B service rows; found ${rows.length}`);
  }
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.external_id)) throw new Error(`Duplicate canonical Wave B service mapping detected for ${row.external_id}`);
    seen.add(row.external_id);
    if (!TARGET_IDS.includes(row.external_id) || row.external_source !== 'goldie') {
      throw new Error(`Unexpected canonical Wave B service mapping ${row.external_id}`);
    }
    if (!approvedDescriptions.has(row.external_id)) throw new Error(`Wave B target ${row.external_id} has no approved description`);
    const allowedNames = EXPECTED_NAMES[row.external_id] || [];
    if (!allowedNames.includes(row.name)) throw new Error(`Wave B canonical service name mismatch for ${row.external_id}`);
    if (RETAINED_INACTIVE_IDS.has(row.external_id)) {
      if (row.status !== 'inactive' || row.public_catalogue_eligible === true || row.has_active_client_bookable_practitioner === true) {
        throw new Error(`Retained inactive Wave B service ${row.external_id} must remain inactive, unmapped and non-bookable`);
      }
    } else if (row.status !== 'active' || row.public_catalogue_eligible !== true) {
      throw new Error(`Approved active Wave B service ${row.external_id} is not public-catalogue eligible`);
    }
  }
  for (const id of TARGET_IDS) if (!seen.has(id)) throw new Error(`Missing canonical Wave B service mapping for ${id}`);
}

function assertSpecialMappings(rows, mappings) {
  const byService = new Map(rows.map((row) => [String(row.id), row]));
  const mappingByService = new Map();
  for (const mapping of mappings) {
    const key = String(mapping.service_id);
    if (!mappingByService.has(key)) mappingByService.set(key, []);
    mappingByService.get(key).push(mapping);
  }
  for (const row of rows) {
    const serviceMappings = mappingByService.get(String(row.id)) || [];
    if (RETAINED_INACTIVE_IDS.has(row.external_id) && serviceMappings.length !== 0) {
      throw new Error(`Retained inactive Wave B service ${row.external_id} unexpectedly has practitioner mappings`);
    }
    if (['e4510fa9-579f-46dd-8fff-107c00748597','b534a8e5-3fe1-46e9-9ca0-bba116e6bf53'].includes(row.external_id)) {
      if (serviceMappings.length !== 1 || String(serviceMappings[0].display_name).toLowerCase() !== 'christel' || serviceMappings[0].status !== 'active' || serviceMappings[0].resource_type !== 'practitioner' || serviceMappings[0].client_bookable !== true) {
        throw new Error(`MediHeel Wave B mapping ${row.external_id} must remain Christel-only and client-bookable`);
      }
    }
  }
  for (const mapping of mappings) {
    if (!byService.has(String(mapping.service_id))) throw new Error('Unexpected Wave B practitioner mapping outside target set');
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
    throw new Error(`Unexpected current customer description for Wave B target ${row.external_id}`);
  }
}

function assertPostDescriptions(rows, approvedDescriptions) {
  for (const row of rows) {
    if (row.customer_description !== approvedDescriptions.get(row.external_id)) {
      throw new Error(`Wave B publication postcondition failed for ${row.external_id}`);
    }
  }
}

function assertEqual(before, after, label) {
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`${label} changed outside approved Wave B scope`);
}

async function ensureGoldieWaveBPublication() {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  if (!sql.includes(SOURCE_EXPORT_SHA256)) throw new Error('Wave B migration source SHA does not match retained Goldie authority');
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
    assertSpecialMappings(beforeRows, beforeMappings);
    const nonTargetBefore = await getNonTargetDescriptionSnapshot(client);
    const immutableBefore = beforeRows.map(immutableService);

    let applied = false;
    let appliedAt = existing.rows[0]?.applied_at || null;
    if (existing.rowCount === 0) {
      await client.query("SET LOCAL shiloh.goldie_wave_b_authority = 'PR447'");
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
    assertSpecialMappings(afterRows, afterMappings);
    const nonTargetAfter = await getNonTargetDescriptionSnapshot(client);

    assertEqual(immutableBefore, afterRows.map(immutableService), 'Wave B target service metadata');
    assertEqual(beforeMappings, afterMappings, 'Wave B practitioner mappings');
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
      retainedInactiveUnmappedTargetCount: afterRows.filter((row) => RETAINED_INACTIVE_IDS.has(row.external_id) && row.has_active_client_bookable_practitioner !== true).length,
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
  RETAINED_INACTIVE_IDS,
  EXPECTED_NAMES,
  EXPECTED_PRIOR,
  BLANK_PRESTATE_ALLOWED,
  parseApprovedTargets,
  ensureGoldieWaveBPublication,
};