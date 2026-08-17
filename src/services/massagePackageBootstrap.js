const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../db/pool');

const MIGRATION_FILENAME = '061_massage_packages.sql';
const MIGRATION_PATH = path.join(__dirname, '..', '..', 'migrations', MIGRATION_FILENAME);

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function ensureApprovedLindaHistoricalPackage(client) {
  // One-time, fail-closed historical import approved on 2026-08-17 for booking #570.
  // The original package contained 4 sessions; 2 were already consumed before the
  // package ledger existed, so this imported entitlement represents the 2 remaining
  // credits only. This avoids fabricating historical appointment/redemption records.
  const context = await client.query(`
    SELECT a.id AS appointment_id, a.client_id, COALESCE(c.display_name,a.source_client_name,'') AS client_name,
           sp.id AS package_id, sp.package_price
      FROM appointments a
      LEFT JOIN clients c ON c.id=a.client_id
      CROSS JOIN service_packages sp
     WHERE a.id=570
       AND sp.slug='sports-massage-monthly'
       AND sp.status='active'
     LIMIT 1
  `);
  if (!context.rowCount) return { imported: false, reason: 'booking_or_package_not_found' };
  const row = context.rows[0];
  if (!row.client_id || !/^linda\s+dr/i.test(String(row.client_name || ''))) {
    return { imported: false, reason: 'booking_570_client_identity_mismatch' };
  }

  const existing = await client.query(`
    SELECT id,starts_at,expires_at,sessions_total,status,payment_status,notes
      FROM client_package_entitlements
     WHERE client_id=$1 AND package_id=$2
       AND status='active' AND payment_status='paid'
       AND starts_at='2026-08-01T00:00:00+02'::timestamptz
     ORDER BY id LIMIT 1
  `,[row.client_id,row.package_id]);
  if (existing.rowCount) return { imported: false, reason: 'already_imported', entitlementId: existing.rows[0].id };

  const inserted = await client.query(`
    INSERT INTO client_package_entitlements
      (client_id,package_id,payment_status,purchase_price,purchased_at,starts_at,expires_at,sessions_total,status,notes)
    VALUES ($1,$2,'paid',$3,'2026-08-01T00:00:00+02','2026-08-01T00:00:00+02','2026-08-31T00:00:00+02',2,'active',$4)
    RETURNING id,expires_at,sessions_total
  `,[row.client_id,row.package_id,row.package_price,
    'Historical administrative import approved 2026-08-17. Administrative start date 01/08/2026 (exact original purchase date unverified). Original Sports Massage Monthly Package: 4 sessions; 2 consumed before Shiloh package ledger; imported opening balance: 2 remaining credits. Valid through 30/08/2026.']);
  const entitlement = inserted.rows[0];
  await client.query(`
    INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
    VALUES ('package.historical_balance_imported','client_package_entitlement',$1,$2::jsonb)
  `,[String(entitlement.id),JSON.stringify({
    appointmentAnchorId:570, clientId:row.client_id, packageId:row.package_id,
    administrativeStartDate:'2026-08-01', validThrough:'2026-08-30',
    originalSessions:4, historicalSessionsConsumed:2, importedRemainingCredits:2,
    exactPurchaseDateVerified:false
  })]);
  return { imported: true, entitlementId: entitlement.id, remainingCredits: 2, expiresAt: entitlement.expires_at };
}

async function ensureMassagePackageSchema() {
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

    let applied = false;
    let appliedAt = existing.rows[0]?.applied_at || null;
    if (existing.rowCount > 0) {
      if (existing.rows[0].checksum !== hash) {
        throw new Error(`Migration ${MIGRATION_FILENAME} has changed after being applied`);
      }
    } else {
      if (sql.trim()) await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
        [MIGRATION_FILENAME, hash]
      );
      applied = true;
    }

    const historicalImport = await ensureApprovedLindaHistoricalPackage(client);
    await client.query('COMMIT');
    return {
      initialized: true,
      applied,
      migration: MIGRATION_FILENAME,
      checksumVerified: true,
      appliedAt,
      historicalImport,
    };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { MIGRATION_FILENAME, ensureMassagePackageSchema, ensureApprovedLindaHistoricalPackage };
