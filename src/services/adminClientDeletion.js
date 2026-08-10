const { pool } = require('../db/pool');

async function clientDeletionScope(admin, clientId, db = pool) {
  if (!admin?.staff_id || admin?.service_scope !== 'own_services') {
    return { allowed: false, reason: 'scope_unavailable' };
  }

  const evidence = await db.query(
    `SELECT
       COUNT(DISTINCT a.id)::int AS appointment_count,
       COUNT(DISTINCT a.id) FILTER (
         WHERE EXISTS (
           SELECT 1 FROM appointment_staff ast
            WHERE ast.appointment_id = a.id AND ast.staff_id = $2
         )
         AND EXISTS (
           SELECT 1
             FROM appointment_services aps
             JOIN staff_services ss
               ON ss.service_id = aps.service_id
              AND ss.staff_id = $2
            WHERE aps.appointment_id = a.id
         )
         AND NOT EXISTS (
           SELECT 1 FROM appointment_staff ast_other
            WHERE ast_other.appointment_id = a.id
              AND ast_other.staff_id <> $2
         )
         AND NOT EXISTS (
           SELECT 1
             FROM appointment_services aps_other
            WHERE aps_other.appointment_id = a.id
              AND NOT EXISTS (
                SELECT 1 FROM staff_services ss_other
                 WHERE ss_other.staff_id = $2
                   AND ss_other.service_id = aps_other.service_id
              )
         )
       )::int AS in_scope_count
      FROM appointments a
     WHERE a.client_id = $1
       AND a.status <> 'cancelled'`,
    [clientId, admin.staff_id]
  );

  const row = evidence.rows[0] || { appointment_count: 0, in_scope_count: 0 };
  const appointmentCount = Number(row.appointment_count || 0);
  const inScopeCount = Number(row.in_scope_count || 0);

  if (appointmentCount === 0) return { allowed: false, reason: 'no_scope_evidence' };
  if (appointmentCount !== inScopeCount) return { allowed: false, reason: 'mixed_scope' };
  return { allowed: true, appointmentCount };
}

async function archiveClientForAdmin(admin, clientId) {
  if (!/^\d+$/.test(String(clientId)) || Number(clientId) <= 0) {
    return { status: 'invalid_client', reply: 'Use: Delete client CRM_ID\nExample: Delete client 123' };
  }

  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const clientResult = await db.query(
      `SELECT id, display_name, status FROM clients WHERE id = $1 FOR UPDATE`,
      [clientId]
    );
    const client = clientResult.rows[0];
    if (!client) {
      await db.query('ROLLBACK');
      return { status: 'not_found', reply: `CRM client #${clientId} was not found.` };
    }
    if (client.status !== 'active') {
      await db.query('ROLLBACK');
      return { status: 'already_inactive', reply: `CRM client #${clientId} is already inactive.` };
    }

    if (admin?.service_scope !== 'all_services') {
      const scope = await clientDeletionScope(admin, clientId, db);
      if (!scope.allowed) {
        await db.query('ROLLBACK');
        if (scope.reason === 'mixed_scope') {
          return { status: 'scope_denied', reply: 'Deletion denied: this client has appointment history outside your assigned staff/services. A full-scope administrator must handle this client.' };
        }
        if (scope.reason === 'no_scope_evidence') {
          return { status: 'scope_denied', reply: 'Deletion denied: the CRM cannot prove that this client belongs exclusively to your assigned services.' };
        }
        return { status: 'scope_denied', reply: 'Deletion denied: your admin account is not authorized to delete this client.' };
      }
    }

    await db.query(
      `UPDATE clients
          SET status = 'inactive',
              updated_at = NOW(),
              custom_attributes = COALESCE(custom_attributes, '{}'::jsonb) || jsonb_build_object(
                'archived_by_admin_id', $2::bigint,
                'archived_at', NOW()::text,
                'archive_reason', 'admin_delete_command'
              )
        WHERE id = $1`,
      [clientId, admin.id]
    );

    await db.query(
      `INSERT INTO crm_audit_events
         (actor_admin_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'admin.client_archived', 'client', $2, $3::jsonb)`,
      [admin.id, clientId, JSON.stringify({ displayName: client.display_name || null, serviceScope: admin.service_scope, staffId: admin.staff_id || null })]
    );

    await db.query('COMMIT');
    return {
      status: 'archived',
      client,
      reply: `Client archived — ${client.display_name || 'Unnamed client'} — CRM #${client.id}.\n\nThe CRM record and appointment history were preserved for audit purposes, but the client is no longer active.`,
    };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

module.exports = { clientDeletionScope, archiveClientForAdmin };
