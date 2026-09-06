const { pool } = require('../db/pool');
const { normalizeRegistrationMobile } = require('./clientIdentityOnboarding');
const {
  WorkspaceStaffError,
  positiveId,
  permissionSet,
  requireRequestId,
  requireExpectedRevision,
  staffRevision,
} = require('./workspaceStaff');
const {
  createWorkspaceStaffAccessService,
  accessProjection,
} = require('./workspaceStaffAccess');

const LEGACY_COMPLETION_CAPABILITY = 'appointment:view';

function enabledCapabilities(permissions) {
  return Object.keys(permissionSet(permissions)).filter(key => permissions[key] === true).sort();
}

function isCompatibleLegacyPractitionerAccess(row, normalizedWhatsapp) {
  if (!row || row.active !== true) return false;
  return String(row.normalized_whatsapp || '') === normalizedWhatsapp
    && row.business_role === 'employee_practitioner'
    && row.calendar_scope === 'own_appointments'
    && row.service_scope === 'own_services'
    && enabledCapabilities(row.permissions).length === 0;
}

function createWorkspaceStaffAccessCompletionService({ db = pool } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Workspace Staff Access completion database is required');
  const accessAuthority = createWorkspaceStaffAccessService({ db });

  async function completeWorkspaceAccess({
    adminId,
    staffId,
    expectedRevision,
    requestId: rawRequestId,
    whatsappNumber,
    identityConfirmed,
  } = {}) {
    if (typeof db.connect !== 'function') throw new Error('Workspace Staff Access completion requires a transactional database.');
    const id = positiveId(staffId);
    if (!id) throw new WorkspaceStaffError('WORKSPACE_STAFF_INVALID_ID', 'Staff reference is invalid.', 400);
    const requestId = requireRequestId(rawRequestId);
    const expected = requireExpectedRevision(expectedRevision);
    const normalizedWhatsapp = normalizeRegistrationMobile(whatsappNumber);
    if (!normalizedWhatsapp) {
      throw new WorkspaceStaffError(
        'WORKSPACE_STAFF_ACCESS_INVALID_WHATSAPP',
        'Enter a valid South African WhatsApp mobile number.',
        400
      );
    }
    if (identityConfirmed !== true) {
      throw new WorkspaceStaffError(
        'WORKSPACE_STAFF_ACCESS_IDENTITY_UNCONFIRMED',
        'Confirm that you verified this staff member’s current WhatsApp number before completing access.',
        400
      );
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const operator = await accessAuthority.requireManageAccess(adminId, client);
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [731000000000 + id]);

      const staffResult = await client.query(
        `/* workspaceStaffAccessCompletion:target */
         SELECT id, display_name, resource_type, status, scheduling_type, client_bookable,
                business_role, calendar_scope
           FROM staff
          WHERE id=$1
          FOR UPDATE`,
        [id]
      );
      const staff = staffResult.rows[0];
      if (!staff) throw new WorkspaceStaffError('WORKSPACE_STAFF_NOT_FOUND', 'Staff member was not found.', 404);
      if (staffRevision(staff) !== expected) {
        throw new WorkspaceStaffError('WORKSPACE_STAFF_STALE_REVISION', 'Staff changed since this view was loaded.', 409);
      }
      if (staff.status !== 'active') {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_INACTIVE',
          'Activate the canonical Staff profile before completing Workspace access.',
          409
        );
      }
      if (staff.resource_type !== 'practitioner' || staff.business_role !== 'employee_practitioner') {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_ROLE_UNSUPPORTED',
          'Legacy completion is only available to active employee practitioners.',
          409
        );
      }

      const linkedResult = await client.query(
        `/* workspaceStaffAccessCompletion:linked */
         SELECT id, staff_id, display_name, role, whatsapp_number, normalized_whatsapp,
                active, permissions, business_role, calendar_scope, service_scope
           FROM staff_admin_accounts
          WHERE staff_id=$1
          ORDER BY id
          LIMIT 3
          FOR UPDATE`,
        [id]
      );
      if (linkedResult.rows.length !== 1) {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_AMBIGUOUS',
          'Exactly one existing canonical staff access principal is required for legacy completion.',
          409
        );
      }
      const linked = linkedResult.rows[0];

      const numberResult = await client.query(
        `/* workspaceStaffAccessCompletion:number-owner */
         SELECT id, staff_id, active
           FROM staff_admin_accounts
          WHERE normalized_whatsapp=$1
          ORDER BY id
          LIMIT 2
          FOR UPDATE`,
        [normalizedWhatsapp]
      );
      if (numberResult.rows.length !== 1 || Number(numberResult.rows[0].id) !== Number(linked.id)) {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_WHATSAPP_CONFLICT',
          'That verified WhatsApp number does not uniquely belong to this canonical staff access principal.',
          409
        );
      }

      const currentCapabilities = enabledCapabilities(linked.permissions);
      if (
        linked.active === true
        && linked.business_role === 'employee_practitioner'
        && linked.calendar_scope === 'own_appointments'
        && linked.service_scope === 'own_services'
        && String(linked.normalized_whatsapp || '') === normalizedWhatsapp
        && currentCapabilities.length === 1
        && currentCapabilities[0] === LEGACY_COMPLETION_CAPABILITY
      ) {
        await client.query('COMMIT');
        return { status: 'unchanged', staffId: id, access: accessProjection() };
      }

      if (!isCompatibleLegacyPractitionerAccess(linked, normalizedWhatsapp)) {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_EXISTING_AUTHORITY',
          'Existing staff access has a different identity, scope or enabled capability and was not overwritten.',
          409
        );
      }

      const updated = await client.query(
        `UPDATE staff_admin_accounts
            SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"appointment:view":true}'::jsonb,
                updated_at = NOW()
          WHERE id=$1
            AND active=TRUE
        RETURNING id`,
        [linked.id]
      );
      if (Number(updated.rowCount ?? updated.rows.length) !== 1) {
        throw new WorkspaceStaffError(
          'WORKSPACE_STAFF_ACCESS_IDENTITY_CONFLICT',
          'Canonical staff access changed concurrently. Reload and retry.',
          409
        );
      }

      await client.query(
        `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES($1,'workspace.staff_access_completed','staff',$2,$3::jsonb)`,
        [operator.operatorAdminId, id, JSON.stringify({
          requestId,
          preset: 'employee_practitioner_view_only_v1',
          identityBinding: 'operator_attested_existing_whatsapp',
          completedCompatibleLegacyPrincipal: true,
          identityRoleScopesPreserved: true,
          credentialMaterialChanged: false,
          capabilitiesAdded: [LEGACY_COMPLETION_CAPABILITY],
        })]
      );

      await client.query('COMMIT');
      return { status: 'enabled', staffId: id, access: accessProjection() };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  return { completeWorkspaceAccess };
}

const service = createWorkspaceStaffAccessCompletionService();

module.exports = {
  LEGACY_COMPLETION_CAPABILITY,
  enabledCapabilities,
  isCompatibleLegacyPractitionerAccess,
  createWorkspaceStaffAccessCompletionService,
  ...service,
};
