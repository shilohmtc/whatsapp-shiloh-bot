const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '077_goldie_targeted_sports_name_correction.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);
const EXTERNAL_ID = '2d5b6147-ee9f-4a97-8e27-6270751c2673';
const PRIOR_NAME = 'Targated Area Specific Sports Massage';
const TARGET_NAME = 'Targeted Area-Specific Sports Massage';
const APPROVED_DESCRIPTION = 'Targeted Area Specific Sports Massage uses focused sports-massage techniques on a selected body area, tailored to the client’s comfort, activity level and treatment goals.';

function checksum(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function loadTarget(client, lock = false) {
  const result = await client.query(`
    SELECT s.id,s.external_source,s.external_id,s.name,s.status,s.category_id,
           s.duration_minutes,s.processing_time_minutes,s.extra_time_minutes,
           s.variable_price,s.price,s.display_price,s.color_value,s.display_order,
           s.is_default,s.booking_note,s.customer_description,
           (s.status='active' AND EXISTS (
             SELECT 1 FROM staff_services ss JOIN staff st ON st.id=ss.staff_id
              WHERE ss.service_id=s.id AND st.status='active'
                AND st.resource_type='practitioner' AND st.client_bookable=TRUE
           )) AS public_catalogue_eligible
      FROM services s
     WHERE s.external_source='goldie' AND s.external_id=$1
     ${lock ? 'FOR UPDATE' : ''}
  `, [EXTERNAL_ID]);
  if (result.rowCount !== 1) throw new Error(`Expected exactly one Targeted Sports canonical row; found ${result.rowCount}`);
  return result.rows[0];
}

async function loadMappings(client, serviceId) {
  const result = await client.query(`
    SELECT ss.service_id,st.id AS staff_id,st.display_name,st.status,st.resource_type,st.client_bookable
      FROM staff_services ss JOIN staff st ON st.id=ss.staff_id
     WHERE ss.service_id=$1 ORDER BY st.id
  `, [serviceId]);
  return result.rows;
}

async function loadNonTargetNames(client) {
  const result = await client.query(`
    SELECT id,external_source,external_id,name
      FROM services
     WHERE NOT (external_source='goldie' AND external_id=$1)
     ORDER BY id
  `, [EXTERNAL_ID]);
  return result.rows;
}

function immutableTarget(row) {
  return {
    id: row.id,
    external_source: row.external_source,
    external_id: row.external_id,
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
    customer_description: row.customer_description,
    public_catalogue_eligible: row.public_catalogue_eligible,
  };
}

function assertTarget(row) {
  if (row.external_source !== 'goldie' || row.external_id !== EXTERNAL_ID) throw new Error('Targeted Sports canonical identity mismatch');
  if (![PRIOR_NAME, TARGET_NAME].includes(row.name)) throw new Error(`Unexpected Targeted Sports current name: ${row.name}`);
  if (row.customer_description !== APPROVED_DESCRIPTION) throw new Error('Targeted Sports Wave B description drift detected');
  if (row.status !== 'active' || row.public_catalogue_eligible !== true) throw new Error('Targeted Sports must remain active and public-catalogue eligible');
}

function assertEqual(before, after, label) {
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`${label} changed outside PR447 name-correction scope`);
}

async function ensureGoldieTargetedSportsNameCorrection() {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  if (!sql.includes(EXTERNAL_ID) || !sql.includes(PRIOR_NAME) || !sql.includes(TARGET_NAME)) throw new Error('Migration 077 exact name-correction contract drift');
  const hash = checksum(sql);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const existing = await client.query('SELECT checksum,applied_at FROM schema_migrations WHERE filename=$1 FOR UPDATE', [MIGRATION_FILENAME]);
    if (existing.rowCount > 0 && existing.rows[0].checksum !== hash) throw new Error(`Migration ${MIGRATION_FILENAME} has changed after being applied`);

    const before = await loadTarget(client, true);
    assertTarget(before);
    const immutableBefore = immutableTarget(before);
    const mappingsBefore = await loadMappings(client, before.id);
    const nonTargetNamesBefore = await loadNonTargetNames(client);

    let applied = false;
    let appliedAt = existing.rows[0]?.applied_at || null;
    if (existing.rowCount === 0) {
      await client.query("SET LOCAL shiloh.goldie_targeted_sports_name_authority = 'PR447'");
      await client.query(sql);
      const recorded = await client.query('INSERT INTO schema_migrations(filename,checksum) VALUES($1,$2) RETURNING applied_at', [MIGRATION_FILENAME, hash]);
      appliedAt = recorded.rows[0].applied_at;
      applied = true;
    }

    const after = await loadTarget(client, false);
    assertTarget(after);
    if (after.name !== TARGET_NAME) throw new Error('Targeted Sports mechanical name correction postcondition failed');
    const mappingsAfter = await loadMappings(client, after.id);
    const nonTargetNamesAfter = await loadNonTargetNames(client);
    assertEqual(immutableBefore, immutableTarget(after), 'Targeted Sports non-name metadata');
    assertEqual(mappingsBefore, mappingsAfter, 'Targeted Sports practitioner mappings');
    assertEqual(nonTargetNamesBefore, nonTargetNamesAfter, 'Non-target service names');

    await client.query('COMMIT');
    return { applied, appliedAt, checksumVerified: true, externalId: EXTERNAL_ID, targetName: TARGET_NAME, descriptionPreserved: true, mappingsPreserved: true, nonTargetNamesPreserved: true };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { MIGRATION_FILENAME, EXTERNAL_ID, PRIOR_NAME, TARGET_NAME, APPROVED_DESCRIPTION, ensureGoldieTargetedSportsNameCorrection };