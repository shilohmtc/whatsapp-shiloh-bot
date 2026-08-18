const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '062_christel_service_catalogue_correction.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);

const TARGETS = Object.freeze([
  { externalSource: 'goldie', externalId: '1d734e8b-d21e-44c3-9a3f-b2a7165a7787', id: 27, status: 'inactive', totalMinutes: 90 },
  { externalSource: 'goldie', externalId: '46043512-d1df-4169-92b4-132160fca809', id: 34, status: 'active', totalMinutes: 120 },
  { externalSource: 'goldie', externalId: 'e4510fa9-579f-46dd-8fff-107c00748597', status: 'active', totalMinutes: 60 },
  { externalSource: 'goldie', externalId: '61a0a7db-426d-4ecf-94ff-9fd6855f384d', status: 'active', totalMinutes: 90 },
  { externalSource: 'goldie', externalId: 'b39dcaf1-7894-40e0-8a51-c7ab4eba553a', status: 'active', totalMinutes: 90 },
  { externalSource: 'shiloh_package', externalId: 'sports-massage-monthly-session', id: 65, status: 'active', totalMinutes: 50 },
]);

const REVIEWED_BUFFER_EXTERNAL_IDS = new Set([
  'e4510fa9-579f-46dd-8fff-107c00748597',
  '61a0a7db-426d-4ecf-94ff-9fd6855f384d',
  'b39dcaf1-7894-40e0-8a51-c7ab4eba553a',
]);

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function targetKey(row) {
  return `${row.external_source || row.externalSource}:${row.external_id || row.externalId}`;
}

function catalogueRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    externalSource: row.external_source,
    externalId: row.external_id,
    status: row.status,
    durationMinutes: Number(row.duration_minutes),
    processingTimeMinutes: Number(row.processing_time_minutes),
    extraTimeMinutes: Number(row.extra_time_minutes),
    totalMinutes: Number(row.total_minutes),
    publicCatalogueEligible: row.public_catalogue_eligible === true,
  };
}

function immutableServiceFields(row) {
  return {
    id: Number(row.id),
    name: row.name,
    externalSource: row.external_source,
    externalId: row.external_id,
    durationMinutes: Number(row.duration_minutes),
    variablePrice: row.variable_price === true,
    price: row.price == null ? null : String(row.price),
    displayPrice: row.display_price,
    customerDescription: row.customer_description,
    bookingNote: row.booking_note,
  };
}

async function getChristelId(client) {
  const result = await client.query(`
    SELECT id, display_name
      FROM staff
     WHERE LOWER(display_name) = 'christel'
       AND status = 'active'
       AND resource_type = 'practitioner'
     ORDER BY id
     FOR UPDATE
  `);
  if (result.rows.length !== 1) {
    throw new Error(`Expected exactly one active Christel practitioner; found ${result.rows.length}`);
  }
  return Number(result.rows[0].id);
}

async function getActiveChristelCatalogue(client, christelId) {
  const result = await client.query(`
    SELECT s.id, s.name, s.external_source, s.external_id, s.status,
           s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
           s.duration_minutes + s.processing_time_minutes + s.extra_time_minutes AS total_minutes,
           (s.status = 'active' AND EXISTS (
             SELECT 1
               FROM staff_services public_ss
               JOIN staff public_st ON public_st.id = public_ss.staff_id
              WHERE public_ss.service_id = s.id
                AND public_st.status = 'active'
                AND public_st.resource_type = 'practitioner'
                AND public_st.client_bookable = TRUE
           )) AS public_catalogue_eligible
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
     WHERE ss.staff_id = $1
       AND s.status = 'active'
     ORDER BY s.id
     FOR UPDATE OF s
  `, [christelId]);
  return result.rows.map(catalogueRow);
}

function assertNoUnreviewedBuffers(activeCatalogue) {
  const unexpected = activeCatalogue.filter((service) => (
    service.processingTimeMinutes !== 0 || service.extraTimeMinutes !== 0
  ) && !(
    service.externalSource === 'goldie'
    && REVIEWED_BUFFER_EXTERNAL_IDS.has(service.externalId)
  ));
  if (unexpected.length) {
    const summary = unexpected.map((service) => `#${service.id} ${service.name}`).join(', ');
    throw new Error(`Unreviewed Christel service buffer conflict: ${summary}`);
  }
}

async function getTargetRows(client) {
  const result = await client.query(`
    SELECT s.id, s.name, s.external_source, s.external_id, s.status,
           s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
           s.duration_minutes + s.processing_time_minutes + s.extra_time_minutes AS total_minutes,
           s.variable_price, s.price, s.display_price,
           s.customer_description, s.booking_note,
           (s.status = 'active' AND EXISTS (
             SELECT 1
               FROM staff_services public_ss
               JOIN staff public_st ON public_st.id = public_ss.staff_id
              WHERE public_ss.service_id = s.id
                AND public_st.status = 'active'
                AND public_st.resource_type = 'practitioner'
                AND public_st.client_bookable = TRUE
           )) AS public_catalogue_eligible
      FROM services s
     WHERE (s.external_source = 'goldie' AND s.external_id = ANY($1::text[]))
        OR (s.external_source = 'shiloh_package' AND s.external_id = 'sports-massage-monthly-session')
     ORDER BY s.id
     FOR UPDATE OF s
  `, [TARGETS.filter((target) => target.externalSource === 'goldie').map((target) => target.externalId)]);
  return result.rows;
}

async function getTargetMappings(client) {
  const result = await client.query(`
    SELECT s.id AS service_id, s.external_source, s.external_id,
           st.id AS staff_id, st.display_name, st.status,
           st.resource_type, st.client_bookable
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
      JOIN staff st ON st.id = ss.staff_id
     WHERE (s.external_source = 'goldie' AND s.external_id = ANY($1::text[]))
        OR (s.external_source = 'shiloh_package' AND s.external_id = 'sports-massage-monthly-session')
     ORDER BY s.id, st.id
  `, [TARGETS.filter((target) => target.externalSource === 'goldie').map((target) => target.externalId)]);
  return result.rows.map((row) => ({
    serviceId: Number(row.service_id),
    externalSource: row.external_source,
    externalId: row.external_id,
    staffId: Number(row.staff_id),
    staffName: row.display_name,
    staffStatus: row.status,
    resourceType: row.resource_type,
    clientBookable: row.client_bookable === true,
  }));
}

async function getHistoryCounts(client) {
  const result = await client.query(`
    SELECT s.id AS service_id, s.external_id,
           COUNT(DISTINCT aps.appointment_id)::integer AS linked_appointments
      FROM services s
      LEFT JOIN appointment_services aps ON aps.service_id = s.id
     WHERE s.id IN (27, 34)
     GROUP BY s.id, s.external_id
     ORDER BY s.id
  `);
  return result.rows.map((row) => ({
    serviceId: Number(row.service_id),
    externalId: row.external_id,
    linkedAppointments: Number(row.linked_appointments),
  }));
}

async function getPackageRule(client) {
  const result = await client.query(`
    SELECT sp.slug, sp.name, sp.family_name, sp.session_service_id,
           sp.package_price, sp.sessions_included, sp.validity_days,
           sp.cancellation_notice_hours, sp.customer_description, sp.status
      FROM service_packages sp
     WHERE sp.slug = 'sports-massage-monthly'
  `);
  if (result.rows.length !== 1) {
    throw new Error(`Expected one Sports Massage monthly package rule; found ${result.rows.length}`);
  }
  const row = result.rows[0];
  return {
    slug: row.slug,
    name: row.name,
    familyName: row.family_name,
    sessionServiceId: Number(row.session_service_id),
    packagePrice: String(row.package_price),
    sessionsIncluded: Number(row.sessions_included),
    validityDays: Number(row.validity_days),
    cancellationNoticeHours: Number(row.cancellation_notice_hours),
    customerDescription: row.customer_description,
    status: row.status,
  };
}

function assertTargetPostconditions(rows, mappings) {
  if (rows.length !== TARGETS.length) {
    throw new Error(`Expected ${TARGETS.length} controlled catalogue targets; found ${rows.length}`);
  }
  const byKey = new Map(rows.map((row) => [targetKey(row), row]));
  for (const expected of TARGETS) {
    const row = byKey.get(targetKey(expected));
    if (!row) throw new Error(`Missing controlled catalogue target ${targetKey(expected)}`);
    const total = Number(row.duration_minutes) + Number(row.processing_time_minutes) + Number(row.extra_time_minutes);
    if (expected.id != null && Number(row.id) !== expected.id) {
      throw new Error(`Controlled catalogue target ${targetKey(expected)} resolved to #${row.id}, expected #${expected.id}`);
    }
    if (row.status !== expected.status || total !== expected.totalMinutes) {
      throw new Error(`Controlled catalogue target ${targetKey(expected)} failed status/duration postconditions`);
    }
    if (Number(row.processing_time_minutes) !== 0 || Number(row.extra_time_minutes) !== 0) {
      throw new Error(`Controlled catalogue target ${targetKey(expected)} retains a processing/extra buffer`);
    }
  }

  const retired = byKey.get('goldie:1d734e8b-d21e-44c3-9a3f-b2a7165a7787');
  const retained = byKey.get('goldie:46043512-d1df-4169-92b4-132160fca809');
  if (retired.public_catalogue_eligible === true || mappings.some((mapping) => mapping.serviceId === 27)) {
    throw new Error('Retired service #27 remains eligible for a booking surface');
  }
  if (retained.public_catalogue_eligible !== true) {
    throw new Error('Distinct 120-minute Sports Massage service #34 is not publicly bookable');
  }
  for (const externalId of REVIEWED_BUFFER_EXTERNAL_IDS) {
    const corrected = byKey.get(`goldie:${externalId}`);
    if (corrected.public_catalogue_eligible !== true) {
      throw new Error(`Corrected Christel service ${externalId} is not publicly bookable`);
    }
  }
}

function assertEqualEvidence(before, after, label) {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(`${label} changed outside the approved correction scope`);
  }
}

async function ensureChristelServiceCatalogueCorrection() {
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

    const christelId = await getChristelId(client);
    const activeCatalogueBefore = await getActiveChristelCatalogue(client, christelId);
    assertNoUnreviewedBuffers(activeCatalogueBefore);
    const targetRowsBefore = await getTargetRows(client);
    const targetMappingsBefore = await getTargetMappings(client);
    const historyBefore = await getHistoryCounts(client);
    const packageRuleBefore = await getPackageRule(client);

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

    const activeCatalogueAfter = await getActiveChristelCatalogue(client, christelId);
    assertNoUnreviewedBuffers(activeCatalogueAfter);
    const targetRowsAfter = await getTargetRows(client);
    const targetMappingsAfter = await getTargetMappings(client);
    const historyAfter = await getHistoryCounts(client);
    const packageRuleAfter = await getPackageRule(client);

    assertTargetPostconditions(targetRowsAfter, targetMappingsAfter);
    assertEqualEvidence(historyBefore, historyAfter, 'Linked appointment history');
    assertEqualEvidence(packageRuleBefore, packageRuleAfter, 'Sports Massage package rule');
    assertEqualEvidence(
      targetRowsBefore.map(immutableServiceFields),
      targetRowsAfter.map(immutableServiceFields),
      'Target service names/prices/descriptions/base durations'
    );
    assertEqualEvidence(
      targetMappingsBefore.filter((mapping) => mapping.serviceId !== 27),
      targetMappingsAfter.filter((mapping) => mapping.serviceId !== 27),
      'Non-retired practitioner mappings'
    );

    await client.query('COMMIT');
    return {
      initialized: true,
      applied,
      migration: MIGRATION_FILENAME,
      checksumVerified: true,
      appliedAt,
      christelId,
      activeChristelServiceCountBefore: activeCatalogueBefore.length,
      activeChristelCatalogueBefore: activeCatalogueBefore,
      activeChristelServiceCountAfter: activeCatalogueAfter.length,
      activeChristelCatalogueAfter: activeCatalogueAfter,
      targetServices: targetRowsAfter.map(catalogueRow),
      targetMappings: targetMappingsAfter,
      appointmentHistoryBefore: historyBefore,
      appointmentHistoryAfter: historyAfter,
      packageRule: packageRuleAfter,
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
  REVIEWED_BUFFER_EXTERNAL_IDS,
  TARGETS,
  ensureChristelServiceCatalogueCorrection,
};
