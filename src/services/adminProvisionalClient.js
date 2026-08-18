const { pool } = require('../db/pool');

function normalizeZaMobile(value = '') {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (/^0\d{9}$/.test(digits)) return `27${digits.slice(1)}`;
  if (/^27\d{9}$/.test(digits)) return digits;
  if (/^0027\d{9}$/.test(digits)) return digits.slice(2);
  return null;
}

function cleanName(value = '') {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!/^[A-Za-z][A-Za-z' -]{1,79}$/.test(name)) return null;
  return name;
}

async function findCanonicalByMobile(normalizedMobile, db = pool) {
  const result = await db.query(
    `SELECT DISTINCT c.id,c.display_name,c.date_of_birth,c.status,c.source
       FROM clients c
       JOIN client_contacts cc ON cc.client_id=c.id
      WHERE cc.normalized_value=$1
        AND cc.contact_type IN ('whatsapp','mobile')
        AND c.status='active'
      ORDER BY c.id`,
    [normalizedMobile]
  );
  return result.rows;
}

async function createProvisionalClient({ fullName, mobileNumber, adminId }) {
  const displayName = cleanName(fullName);
  const normalizedMobile = normalizeZaMobile(mobileNumber);
  if (!displayName) return { status: 'invalid_name' };
  if (!normalizedMobile) return { status: 'invalid_mobile' };

  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`client-mobile:${normalizedMobile}`]);

    const existing = await findCanonicalByMobile(normalizedMobile, db);
    if (existing.length > 1) {
      await db.query('ROLLBACK');
      return { status: 'ambiguous', clients: existing };
    }
    if (existing.length === 1) {
      await db.query('COMMIT');
      return { status: 'existing', client: existing[0] };
    }

    const created = await db.query(
      `INSERT INTO clients (display_name,status,source,custom_attributes)
       VALUES ($1,'active','admin_provisional_booking',jsonb_build_object(
         'registration_status','provisional',
         'profile_incomplete',true,
         'created_for_booking',true
       ))
       RETURNING id,display_name,date_of_birth,status,source`,
      [displayName]
    );
    const client = created.rows[0];

    await db.query(
      `INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary,verified_at)
       VALUES ($1,'mobile',$2,$3,TRUE,NULL)`,
      [client.id, mobileNumber, normalizedMobile]
    );

    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'client.provisional_created','client',$2,$3::jsonb)`,
      [adminId, client.id, JSON.stringify({ source: 'admin_mobile_booking', normalizedMobileLast4: normalizedMobile.slice(-4) })]
    );

    await db.query('COMMIT');
    return {
      status: 'created',
      client: {
        ...client,
        contacts: [{ contactType: 'mobile', value: mobileNumber, normalizedValue: normalizedMobile, isPrimary: true }],
      },
    };
  } catch (error) {
    await db.query('ROLLBACK');
    if (error.code === '23505') {
      const existing = await findCanonicalByMobile(normalizedMobile);
      if (existing.length === 1) return { status: 'existing', client: existing[0] };
      if (existing.length > 1) return { status: 'ambiguous', clients: existing };
    }
    throw error;
  } finally {
    db.release();
  }
}

async function cleanupUnusedProvisionalClient({ clientId, adminId, reason = 'booking_cancelled' }) {
  if (!clientId) return { status: 'skipped' };
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const clientResult = await db.query(
      `SELECT id,source FROM clients WHERE id=$1 FOR UPDATE`,
      [clientId]
    );
    const client = clientResult.rows[0];
    if (!client || client.source !== 'admin_provisional_booking') {
      await db.query('ROLLBACK');
      return { status: 'kept', reason: 'not_provisional' };
    }
    const appointmentResult = await db.query(
      `SELECT COUNT(*)::int AS count FROM appointments WHERE client_id=$1`,
      [clientId]
    );
    if ((appointmentResult.rows[0]?.count || 0) > 0) {
      await db.query('ROLLBACK');
      return { status: 'kept', reason: 'has_appointments' };
    }
    await db.query(`DELETE FROM client_contacts WHERE client_id=$1`, [clientId]);
    await db.query(`DELETE FROM clients WHERE id=$1`, [clientId]);
    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'client.provisional_removed','client',$2,$3::jsonb)`,
      [adminId || null, clientId, JSON.stringify({ source: 'admin_mobile_booking', reason })]
    );
    await db.query('COMMIT');
    return { status: 'removed' };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}

module.exports = {
  normalizeZaMobile,
  cleanName,
  findCanonicalByMobile,
  createProvisionalClient,
  cleanupUnusedProvisionalClient,
};
