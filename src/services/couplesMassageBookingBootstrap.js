const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '070_couples_massage_self_service.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);
const SERVICE_EXTERNAL_SOURCE = 'shiloh_special';
const SERVICE_EXTERNAL_ID = 'couples-massage-v1';
const SERVICE_NAME = 'Couples Massage';
const DURATION_MINUTES = 90;
const PRICE = '1080.00';

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function getFoundation(client) {
  const serviceResult = await client.query(`
    SELECT s.id, s.name, s.status, s.duration_minutes, s.processing_time_minutes,
           s.extra_time_minutes, s.variable_price, s.price, s.display_price,
           s.external_source, s.external_id, sc.name AS category_name
      FROM services s
      LEFT JOIN service_categories sc ON sc.id = s.category_id
     WHERE s.external_source = $1 AND s.external_id = $2
     ORDER BY s.id
  `, [SERVICE_EXTERNAL_SOURCE, SERVICE_EXTERNAL_ID]);
  if (serviceResult.rows.length !== 1) {
    throw new Error(`Expected exactly one canonical ${SERVICE_NAME} service; found ${serviceResult.rows.length}`);
  }
  const service = serviceResult.rows[0];

  const mappings = await client.query(`
    SELECT st.id AS staff_id, st.display_name, st.status, st.resource_type, st.client_bookable
      FROM staff_services ss
      JOIN staff st ON st.id = ss.staff_id
     WHERE ss.service_id = $1
     ORDER BY st.id
  `, [service.id]);

  const tables = await client.query(`
    SELECT to_regclass('public.couples_booking_intents') IS NOT NULL AS intents,
           to_regclass('public.appointment_companions') IS NOT NULL AS companions
  `);

  return {
    service,
    mappings: mappings.rows,
    intentsTable: tables.rows[0]?.intents === true,
    companionsTable: tables.rows[0]?.companions === true,
  };
}

function assertFoundation(foundation) {
  const { service, mappings } = foundation;
  if (service.name !== SERVICE_NAME || service.status !== 'active') throw new Error('Couples Massage canonical service is not active/exact');
  if (Number(service.duration_minutes) !== DURATION_MINUTES || Number(service.processing_time_minutes) !== 0 || Number(service.extra_time_minutes) !== 0) {
    throw new Error('Couples Massage duration must remain exactly 90 minutes with no hidden buffer');
  }
  if (service.variable_price === true || Number(service.price) !== Number(PRICE)) throw new Error('Couples Massage price must remain exactly R1080');
  if (service.category_name !== 'Massage') throw new Error('Couples Massage must remain in the canonical Massage category');
  if (!foundation.intentsTable || !foundation.companionsTable) throw new Error('Couples Massage booking tables are missing');

  const approved = mappings.map((row) => String(row.display_name || '').trim().toLowerCase()).sort();
  if (approved.length !== 2 || approved[0] !== 'abigail' || approved[1] !== 'christel') {
    throw new Error(`Couples Massage requires exactly Abigail + Christel; found ${approved.join(', ') || 'none'}`);
  }
  for (const row of mappings) {
    if (row.status !== 'active' || row.resource_type !== 'practitioner' || row.client_bookable !== true) {
      throw new Error(`${row.display_name} is not an active client-bookable practitioner for Couples Massage`);
    }
  }
}

async function ensureCouplesMassageBookingFoundation() {
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
      'SELECT checksum, applied_at FROM schema_migrations WHERE filename=$1 FOR UPDATE',
      [MIGRATION_FILENAME]
    );
    if (existing.rowCount && existing.rows[0].checksum !== hash) {
      throw new Error(`Migration ${MIGRATION_FILENAME} has changed after being applied`);
    }

    let applied = false;
    let appliedAt = existing.rows[0]?.applied_at || null;
    if (!existing.rowCount) {
      await client.query(sql);
      const recorded = await client.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1,$2) RETURNING applied_at',
        [MIGRATION_FILENAME, hash]
      );
      appliedAt = recorded.rows[0].applied_at;
      applied = true;
    }

    const foundation = await getFoundation(client);
    assertFoundation(foundation);
    await client.query('COMMIT');
    return {
      initialized: true,
      applied,
      migration: MIGRATION_FILENAME,
      checksumVerified: true,
      appliedAt,
      serviceId: Number(foundation.service.id),
      serviceName: foundation.service.name,
      durationMinutes: Number(foundation.service.duration_minutes),
      price: String(foundation.service.price),
      category: foundation.service.category_name,
      practitioners: foundation.mappings.map((row) => ({
        staffId: Number(row.staff_id),
        staffName: row.display_name,
        clientBookable: row.client_bookable === true,
      })),
      companionContactRole: 'booking_backup',
      marketingConsent: false,
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
  SERVICE_EXTERNAL_SOURCE,
  SERVICE_EXTERNAL_ID,
  SERVICE_NAME,
  DURATION_MINUTES,
  PRICE,
  ensureCouplesMassageBookingFoundation,
};
