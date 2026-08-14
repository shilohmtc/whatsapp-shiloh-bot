const { pool } = require('../db/pool');

function pedicureServiceFilterSql(alias = 's', categoryAlias = 'sc') {
  return `(
    LOWER(COALESCE(${categoryAlias}.name, '')) = 'pedicures & foot care'
    OR LOWER(${alias}.name) LIKE '%pedicur%'
    OR LOWER(${alias}.name) LIKE '%medi-heel%'
    OR LOWER(${alias}.name) LIKE '%mediheel%'
    OR LOWER(${alias}.name) LIKE '%elim%'
  )`;
}

async function ensureMarietjiePedicureOwnership() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const marietjieResult = await client.query(`
      SELECT id, display_name
        FROM staff
       WHERE LOWER(display_name) = 'marietjie'
         AND status = 'active'
         AND resource_type = 'practitioner'
       ORDER BY id
       FOR UPDATE
    `);
    if (marietjieResult.rows.length !== 1) {
      throw new Error(`Expected exactly one active Marietjie practitioner; found ${marietjieResult.rows.length}`);
    }
    const marietjieId = Number(marietjieResult.rows[0].id);

    const servicesResult = await client.query(`
      SELECT s.id
        FROM services s
        LEFT JOIN service_categories sc ON sc.id = s.category_id
       WHERE s.status = 'active'
         AND ${pedicureServiceFilterSql('s', 'sc')}
       ORDER BY s.id
       FOR UPDATE OF s
    `);
    const serviceIds = servicesResult.rows.map((row) => Number(row.id)).filter(Number.isFinite);

    if (!serviceIds.length) {
      await client.query('COMMIT');
      return { repaired: false, serviceCount: 0, marietjieId };
    }

    await client.query(`
      DELETE FROM staff_services
       WHERE service_id = ANY($1::bigint[])
         AND staff_id <> $2
    `, [serviceIds, marietjieId]);

    await client.query(`
      INSERT INTO staff_services (staff_id, service_id)
      SELECT $1, service_id
        FROM UNNEST($2::bigint[]) AS service_id
      ON CONFLICT (staff_id, service_id) DO NOTHING
    `, [marietjieId, serviceIds]);

    await client.query('COMMIT');
    return { repaired: true, serviceCount: serviceIds.length, marietjieId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { ensureMarietjiePedicureOwnership, pedicureServiceFilterSql };
