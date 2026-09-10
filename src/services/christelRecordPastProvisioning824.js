'use strict';

const crypto = require('node:crypto');
const { pool } = require('../db/pool');

const MODE_ENV = 'SHILOH_CHRISTEL_RECORD_PAST_824_MODE';
const RELEASE_SHA_ENV = 'SHILOH_CHRISTEL_RECORD_PAST_824_RELEASE_SHA';
const RUN_ID_ENV = 'SHILOH_CHRISTEL_RECORD_PAST_824_RUN_ID';
const AUTHORIZED_RUN_ID = 'christel-record-past-824-2026-09-10-v1';
const LOCK_KEY = 'shiloh:control:christel-record-past:824:2026-09-10:v1';
const RECORD_PAST = 'appointment:record_past';

function permissionObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function withoutRecordPast(permissions) {
  const next = { ...permissionObject(permissions) };
  delete next[RECORD_PAST];
  return canonical(next);
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

function snapshot(row) {
  const permissions = permissionObject(row?.permissions);
  return {
    adminId: Number(row?.id) || null,
    staffId: Number(row?.staff_id) || null,
    adminActive: row?.admin_active === true,
    staffStatus: row?.staff_status || null,
    businessRole: row?.business_role || null,
    calendarScope: row?.calendar_scope || null,
    serviceScope: row?.service_scope || null,
    appointmentCreate: permissions['appointment:create'] === true,
    recordPast: permissions[RECORD_PAST] === true,
    otherPermissionsDigest: digest(withoutRecordPast(permissions)),
  };
}

function validateRow(row) {
  const state = snapshot(row);
  const reasons = [];
  if (!state.adminId || !state.staffId) reasons.push('christel_principal_not_staff_linked');
  if (!state.adminActive) reasons.push('christel_admin_inactive');
  if (state.staffStatus !== 'active') reasons.push('christel_staff_inactive');
  if (!state.appointmentCreate) reasons.push('christel_missing_appointment_create');
  return { safe: reasons.length === 0, reasons, state };
}

async function readChristel(db, { forUpdate = false } = {}) {
  const result = await db.query(`
    SELECT a.id,a.staff_id,a.active AS admin_active,a.business_role,a.calendar_scope,a.service_scope,a.permissions,
           s.status AS staff_status
      FROM staff s
      JOIN staff_admin_accounts a ON a.staff_id=s.id
     WHERE s.source_name='Christel .'
     ORDER BY a.id
     ${forUpdate ? 'FOR UPDATE OF a' : ''}
  `);
  if (result.rows.length !== 1) {
    const error = new Error(`Christel canonical principal count ${result.rows.length}; expected exactly 1`);
    error.code = 'CHRISTEL_PRINCIPAL_AMBIGUOUS';
    throw error;
  }
  return result.rows[0];
}

function assertRelease(env = process.env) {
  const configured = String(env[RELEASE_SHA_ENV] || '').trim().toLowerCase();
  const actual = String(env.RENDER_GIT_COMMIT || '').trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(configured) || configured !== actual) {
    const error = new Error('Configured #824 release SHA does not match running Render commit');
    error.code = 'RELEASE_SHA_MISMATCH';
    error.details = { configured, actual };
    throw error;
  }
}

async function preflight({ dbPool = pool, env = process.env } = {}) {
  assertRelease(env);
  const db = await dbPool.connect();
  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const row = await readChristel(db);
    const validation = validateRow(row);
    await db.query('COMMIT');
    return { status: validation.safe ? (validation.state.recordPast ? 'already_complete' : 'preflight_ready') : 'refused', ...validation };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function apply({ dbPool = pool, env = process.env } = {}) {
  assertRelease(env);
  if (String(env[RUN_ID_ENV] || '') !== AUTHORIZED_RUN_ID) {
    const error = new Error('Invalid #824 authorized run id');
    error.code = 'RUN_ID_MISMATCH';
    throw error;
  }
  const db = await dbPool.connect();
  try {
    await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [LOCK_KEY]);
    const beforeRow = await readChristel(db, { forUpdate: true });
    const beforeValidation = validateRow(beforeRow);
    if (!beforeValidation.safe) {
      const error = new Error(`Unsafe #824 preflight: ${beforeValidation.reasons.join(',')}`);
      error.code = 'PREFLIGHT_REFUSED';
      error.details = beforeValidation;
      throw error;
    }
    if (beforeValidation.state.recordPast) {
      await db.query('COMMIT');
      return { status: 'already_complete', before: beforeValidation.state, after: beforeValidation.state };
    }

    await db.query(`
      UPDATE staff_admin_accounts
         SET permissions = jsonb_set(COALESCE(permissions,'{}'::jsonb), ARRAY[$2]::text[], 'true'::jsonb, true)
       WHERE id=$1
    `, [beforeValidation.state.adminId, RECORD_PAST]);

    const afterRow = await readChristel(db);
    const afterValidation = validateRow(afterRow);
    if (!afterValidation.safe || !afterValidation.state.recordPast) {
      const error = new Error('Post-write #824 validation failed');
      error.code = 'POSTWRITE_REFUSED';
      error.details = afterValidation;
      throw error;
    }
    if (beforeValidation.state.adminId !== afterValidation.state.adminId
      || beforeValidation.state.staffId !== afterValidation.state.staffId
      || beforeValidation.state.businessRole !== afterValidation.state.businessRole
      || beforeValidation.state.calendarScope !== afterValidation.state.calendarScope
      || beforeValidation.state.serviceScope !== afterValidation.state.serviceScope
      || beforeValidation.state.otherPermissionsDigest !== afterValidation.state.otherPermissionsDigest) {
      const error = new Error('Non-target #824 authority changed');
      error.code = 'NON_TARGET_AUTHORITY_CHANGED';
      error.details = { before: beforeValidation.state, after: afterValidation.state };
      throw error;
    }
    await db.query('COMMIT');
    return { status: 'complete', runId: AUTHORIZED_RUN_ID, before: beforeValidation.state, after: afterValidation.state };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function runConfigured(options = {}) {
  const env = options.env || process.env;
  const mode = String(env[MODE_ENV] || '').trim().toLowerCase();
  if (!mode || mode === 'disabled' || mode === 'off') return { status: 'disabled' };
  if (mode === 'preflight') return preflight({ ...options, env });
  if (mode === 'apply') return apply({ ...options, env });
  return { status: 'refused', safe: false, reasons: ['unsupported_mode'] };
}

module.exports = {
  MODE_ENV,
  RELEASE_SHA_ENV,
  RUN_ID_ENV,
  AUTHORIZED_RUN_ID,
  RECORD_PAST,
  withoutRecordPast,
  snapshot,
  validateRow,
  preflight,
  apply,
  runConfigured,
};
