const { pool } = require('../db/pool');

function mediHeelServiceFilterSql(alias = 's') {
  return `(
    LOWER(${alias}.name) LIKE '%medi-heel%'
    OR LOWER(${alias}.name) LIKE '%mediheel%'
    OR LOWER(${alias}.name) LIKE '%elim%'
  )`;
}

async function ensureChristelMediHeelOwnership() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const christelResult = await client.query(`
      SELECT id, display_name
        FROM staff
       WHERE LOWER(display_name) = 'christel'
         AND status = 'active'
         AND resource_type = 'practitioner'
       ORDER BY id
       FOR UPDATE
    `);
    if (christelResult.rows.length !== 1) {
      throw new Error(`Expected exactly one active Christel practitioner; found ${christelResult.rows.length}`);
    }
    const christelId = Number(christelResult.rows[0].id);

    const servicesResult = await client.query(`
      SELECT s.id
        FROM services s
       WHERE s.status = 'active'
         AND ${mediHeelServiceFilterSql('s')}
       ORDER BY s.id
       FOR UPDATE OF s
    `);
    const serviceIds = servicesResult.rows.map((row) => Number(row.id)).filter(Number.isFinite);

    if (!serviceIds.length) {
      await client.query('COMMIT');
      return { repaired: false, serviceCount: 0, christelId };
    }

    await client.query(`
      DELETE FROM staff_services
       WHERE service_id = ANY($1::bigint[])
         AND staff_id <> $2
    `, [serviceIds, christelId]);

    await client.query(`
      INSERT INTO staff_services (staff_id, service_id)
      SELECT $1, service_id
        FROM UNNEST($2::bigint[]) AS service_id
      ON CONFLICT (staff_id, service_id) DO NOTHING
    `, [christelId, serviceIds]);

    await client.query('COMMIT');
    return { repaired: true, serviceCount: serviceIds.length, christelId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { ensureChristelMediHeelOwnership, mediHeelServiceFilterSql };
