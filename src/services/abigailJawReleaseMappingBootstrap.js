const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '069_remove_abigail_jaw_release_mapping.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);
const TARGET_EXTERNAL_ID = 'b5c96105-f534-406d-89ec-68e78c65cf8b';
const TARGET_NAME = 'Upper Back, Neck & Jaw Release';

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function getAbigail(client) {
  const result = await client.query(`
    SELECT id, display_name
      FROM staff
     WHERE LOWER(display_name) = 'abigail'
       AND status = 'active'
       AND resource_type = 'practitioner'
     ORDER BY id
     FOR UPDATE
  `);
  if (result.rows.length !== 1) {
    throw new Error(`Expected exactly one active Abigail practitioner; found ${result.rows.length}`);
  }
  return { id: Number(result.rows[0].id), name: result.rows[0].display_name };
}

async function getTargetService(client) {
  const result = await client.query(`
    SELECT id, name, external_source, external_id, status,
           duration_minutes, processing_time_minutes, extra_time_minutes,
           variable_price, price, display_price, customer_description, booking_note
      FROM services
     WHERE external_source = 'goldie'
       AND external_id = $1
       AND name = $2
     ORDER BY id
     FOR UPDATE
  `, [TARGET_EXTERNAL_ID, TARGET_NAME]);
  if (result.rows.length !== 1) {
    throw new Error(`Expected exactly one canonical ${TARGET_NAME} service; found ${result.rows.length}`);
  }
  return result.rows[0];
}

async function getMappings(client, serviceId) {
  const result = await client.query(`
    SELECT st.id AS staff_id, st.display_name, st.status, st.resource_type, st.client_bookable
      FROM staff_services ss
      JOIN staff st ON st.id = ss.staff_id
     WHERE ss.service_id = $1
     ORDER BY st.id
  `, [serviceId]);
  return result.rows.map((row) => ({
    staffId: Number(row.staff_id),
    staffName: row.display_name,
    staffStatus: row.status,
    resourceType: row.resource_type,
    clientBookable: row.client_bookable === true,
  }));
}

async function getAppointmentCount(client, serviceId) {
  const result = await client.query(
    'SELECT COUNT(DISTINCT appointment_id)::integer AS count FROM appointment_services WHERE service_id = $1',
    [serviceId]
  );
  return Number(result.rows[0].count);
}

function immutableService(row) {
  return {
    id: Number(row.id),
    name: row.name,
    externalSource: row.external_source,
    externalId: row.external_id,
    status: row.status,
    durationMinutes: Number(row.duration_minutes),
    processingTimeMinutes: Number(row.processing_time_minutes),
    extraTimeMinutes: Number(row.extra_time_minutes),
    variablePrice: row.variable_price === true,
    price: row.price == null ? null : String(row.price),
    displayPrice: row.display_price,
    customerDescription: row.customer_description,
    bookingNote: row.booking_note,
  };
}

function assertEqual(before, after, label) {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(`${label} changed outside the approved Abigail mapping correction`);
  }
}

async function ensureAbigailJawReleaseMappingCorrection() {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
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

    const abigail = await getAbigail(client);
    const serviceBefore = await getTargetService(client);
    if (serviceBefore.status !== 'active') throw new Error(`${TARGET_NAME} is not active`);
    const mappingsBefore = await getMappings(client, Number(serviceBefore.id));
    const appointmentCountBefore = await getAppointmentCount(client, Number(serviceBefore.id));

    let applied = false;
    let appliedAt = existing.rows[0]?.applied_at || null;
    if (existing.rowCount === 0) {
      if (sql.trim()) await client.query(sql);
      const recorded = await client.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) RETURNING applied_at',
        [MIGRATION_FILENAME, hash]
      );
      appliedAt = recorded.rows[0].applied_at;
      applied = true;
    }

    const serviceAfter = await getTargetService(client);
    const mappingsAfter = await getMappings(client, Number(serviceAfter.id));
    const appointmentCountAfter = await getAppointmentCount(client, Number(serviceAfter.id));
    const abigailMapped = mappingsAfter.some((mapping) => mapping.staffId === abigail.id);

    if (abigailMapped) throw new Error(`${TARGET_NAME} is still mapped to Abigail`);
    assertEqual(immutableService(serviceBefore), immutableService(serviceAfter), 'Canonical service');
    assertEqual(
      mappingsBefore.filter((mapping) => mapping.staffId !== abigail.id),
      mappingsAfter.filter((mapping) => mapping.staffId !== abigail.id),
      'Non-Abigail practitioner mappings'
    );
    if (appointmentCountAfter !== appointmentCountBefore) {
      throw new Error('Jaw Release appointment history changed outside the approved correction');
    }

    await client.query('COMMIT');
    return {
      initialized: true,
      applied,
      migration: MIGRATION_FILENAME,
      checksumVerified: true,
      appliedAt,
      serviceId: Number(serviceAfter.id),
      serviceName: serviceAfter.name,
      externalId: serviceAfter.external_id,
      serviceStatus: serviceAfter.status,
      abigailId: abigail.id,
      abigailName: abigail.name,
      abigailMapped: false,
      remainingMappings: mappingsAfter,
      linkedAppointmentCount: appointmentCountAfter,
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
  TARGET_EXTERNAL_ID,
  TARGET_NAME,
  ensureAbigailJawReleaseMappingCorrection,
};
