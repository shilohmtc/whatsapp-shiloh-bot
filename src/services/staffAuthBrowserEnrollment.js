const crypto = require('crypto');
const { normalizeWhatsapp, sha256 } = require('./staffBrowserSession');
const {
  BREAK_GLASS_TTL_MS,
  providerIndependentAuthPolicy,
  isCanonicalAuthorityActive,
  isRecentAuthentication,
  buildBreakGlassUrl,
} = require('./providerIndependentStaffAuth');

function normalizeStaffNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `27${digits.slice(1)}`;
  return normalizeWhatsapp(digits);
}

function permissionsOf(admin) {
  if (!admin || !admin.permissions) return {};
  if (typeof admin.permissions === 'object' && !Array.isArray(admin.permissions)) return admin.permissions;
  try {
    const parsed = JSON.parse(String(admin.permissions));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function createStaffAuthBrowserEnrollmentService({
  db,
  env = process.env,
  now = () => new Date(),
  randomBytes = crypto.randomBytes,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('staff auth browser enrollment db is required');

  function policy() {
    return providerIndependentAuthPolicy(env);
  }

  async function resolveAdmin(client, { adminId = null, staffNumber = null, forUpdate = false } = {}) {
    const values = [];
    let predicate;
    if (adminId != null) {
      const id = Number(adminId);
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      values.push(id);
      predicate = 'a.id = $1';
    } else {
      const normalized = normalizeStaffNumber(staffNumber);
      if (!normalized) return null;
      values.push(normalized);
      predicate = 'a.normalized_whatsapp = $1';
    }
    const result = await client.query(
      `SELECT a.id, a.staff_id, a.display_name, a.normalized_whatsapp, a.permissions,
              a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id = a.staff_id
        WHERE ${predicate}
        LIMIT 2${forUpdate ? '\n        FOR UPDATE OF a' : ''}`,
      values
    );
    if (result.rows.length !== 1 || !isCanonicalAuthorityActive(result.rows[0])) return null;
    return result.rows[0];
  }

  async function audit(client, {
    eventType,
    operatorAdminId = null,
    subjectAdminId = null,
    reason = null,
    requestFingerprintHash = null,
    metadata = {},
  }) {
    await client.query(
      `INSERT INTO staff_auth_security_events
         (event_type, operator_admin_id, subject_admin_id, auth_method, reason, request_fingerprint_hash, metadata)
       VALUES ($1, $2, $3, 'break_glass', $4, $5, $6::jsonb)`,
      [eventType, operatorAdminId, subjectAdminId, reason, requestFingerprintHash,
        JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {})]
    );
  }

  async function issue({ session, staffNumber, requestFingerprintHash = null } = {}) {
    const currentPolicy = policy();
    const current = now();
    if (!currentPolicy.enabled) return { ok: false, code: 'STAFF_TOTP_DISABLED' };
    if (!currentPolicy.operational) return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
    if (!isRecentAuthentication(session, current) || session?.recoveryRequired === true) {
      return { ok: false, code: 'STAFF_RECENT_AUTH_REQUIRED' };
    }
    const normalizedStaffNumber = normalizeStaffNumber(staffNumber);
    if (!normalizedStaffNumber) return { ok: false, code: 'STAFF_ENROLLMENT_SUBJECT_INVALID' };

    const client = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await client.query('BEGIN');
      const operator = await resolveAdmin(client, { adminId: session.adminId, forUpdate: true });
      const subject = await resolveAdmin(client, { staffNumber: normalizedStaffNumber, forUpdate: true });
      const operatorAllowed = operator && currentPolicy.pilotIds.has(Number(operator.id));
      const subjectAllowed = subject && currentPolicy.pilotIds.has(Number(subject.id));
      if (!operatorAllowed || permissionsOf(operator)['staff_auth:reset'] !== true) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_RESET_FORBIDDEN' };
      }
      if (!subjectAllowed || Number(subject.id) === Number(operator.id)) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_ENROLLMENT_SUBJECT_INVALID' };
      }

      const token = randomBytes(32).toString('base64url');
      const url = buildBreakGlassUrl(token, env);
      if (!url) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'STAFF_TOTP_UNAVAILABLE' };
      }
      const expiresAt = new Date(current.getTime() + BREAK_GLASS_TTL_MS);

      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('staff-break-glass:' || $1::text, 0))`, [subject.id]);
      await client.query(
        `UPDATE staff_auth_break_glass_bootstraps SET revoked_at = $2
          WHERE admin_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL`,
        [subject.id, current]
      );
      await client.query(
        `INSERT INTO staff_auth_break_glass_bootstraps
           (admin_id, token_hash, issued_at, expires_at, operator_reference, control_reference)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [subject.id, sha256(token), current, expiresAt, `staff-admin:${operator.id}`, '#628-browser-enrollment']
      );
      await client.query(
        `UPDATE staff_totp_credentials
            SET replacement_required_at = COALESCE(replacement_required_at, $2), updated_at = $2
          WHERE admin_id = $1`,
        [subject.id, current]
      );
      const revoked = await client.query(
        `UPDATE staff_browser_sessions
            SET revoked_at = COALESCE(revoked_at, $2),
                revoke_reason = CASE WHEN revoked_at IS NULL THEN 'break_glass' ELSE revoke_reason END
          WHERE admin_id = $1 AND revoked_at IS NULL`,
        [subject.id, current]
      );
      await audit(client, {
        eventType: 'break_glass_issued',
        operatorAdminId: operator.id,
        subjectAdminId: subject.id,
        reason: '#628-browser-enrollment',
        requestFingerprintHash,
        metadata: {
          operatorReference: `staff-admin:${operator.id}`,
          controlReference: '#628-browser-enrollment',
          browserIssued: true,
          revokedSessionCount: revoked.rowCount,
        },
      });
      await client.query('COMMIT');
      return {
        ok: true,
        url,
        expiresAt,
        subject: {
          adminId: Number(subject.id),
          displayName: subject.display_name || 'Staff member',
          staffNumber: subject.normalized_whatsapp,
        },
      };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  return { issue };
}

module.exports = {
  normalizeStaffNumber,
  createStaffAuthBrowserEnrollmentService,
};
