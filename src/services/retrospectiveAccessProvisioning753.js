'use strict';

const { pool } = require('../db/pool');

const MODE_ENV = 'SHILOH_RETROSPECTIVE_ACCESS_753_MODE';
const RELEASE_SHA_ENV = 'SHILOH_RETROSPECTIVE_ACCESS_753_RELEASE_SHA';
const RUN_ID_ENV = 'SHILOH_RETROSPECTIVE_ACCESS_753_RUN_ID';
const NAOMI_ID_ENV = 'SHILOH_RETROSPECTIVE_ACCESS_753_NAOMI_ADMIN_ID';
const MARIETJIE_ID_ENV = 'SHILOH_RETROSPECTIVE_ACCESS_753_MARIETJIE_ADMIN_ID';
const JP_ID_ENV = 'SHILOH_RETROSPECTIVE_ACCESS_753_JP_ADMIN_ID';
const DEMO_CLIENT_ID_ENV = 'SHILOH_RETROSPECTIVE_ACCESS_753_DEMO_CRM_V2_CLIENT_ID';

const AUTHORIZED_RUN_ID = 'retrospective-access-753-2026-09-07-v1';
const AUDIT_ACTION = 'control.retrospective_access_753_provisioned';
const LOCK_KEY = 'shiloh:control:retrospective-access:753:2026-09-07:v1';
const RECORD_PAST = 'appointment:record_past';
const RECORD_PAST_CLIENT_IDS = 'appointment:record_past:crm_v2_client_ids';

// #579 Stage B was already LIVE at the lower bound. Its terminal acceptance comment
// was posted at the upper bound after the one controlled CRM V2 retry succeeded.
// The selector also requires canonical registration provenance and a completed
// CRM V2 onboarding session; ambiguity always fails closed.
const DEMO_ACCEPTANCE_WINDOW_START = '2026-08-30T09:34:35.000Z';
const DEMO_ACCEPTANCE_WINDOW_END = '2026-08-30T09:37:46.000Z';

class RetrospectiveAccessProvisioningError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RetrospectiveAccessProvisioningError';
    this.code = code;
    this.details = details;
  }
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validSha(value) {
  return /^[0-9a-f]{40}$/.test(String(value || '').trim().toLowerCase());
}

function currentRenderSha(env = process.env) {
  return String(env.RENDER_GIT_COMMIT || '').trim().toLowerCase();
}

function configuredReleaseSha(env = process.env) {
  return String(env[RELEASE_SHA_ENV] || '').trim().toLowerCase();
}

function permissionObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function conditionIds(permissions) {
  const value = permissionObject(permissions)[RECORD_PAST_CLIENT_IDS];
  if (value === undefined) return null;
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(positiveId).filter(Boolean))].sort((a, b) => a - b);
}

function policyState(row) {
  const permissions = permissionObject(row?.permissions);
  return {
    id: positiveId(row?.id),
    recordPast: permissions[RECORD_PAST] === true,
    retrospectiveClientIds: conditionIds(permissions),
  };
}

function one(rows, label, reasons) {
  if (!Array.isArray(rows) || rows.length !== 1) {
    reasons.push(`${label}_candidate_count_${Array.isArray(rows) ? rows.length : 0}`);
    return null;
  }
  return rows[0];
}

function principalMatches(row, expected) {
  if (!row || positiveId(row.id) == null || row.admin_active !== true) return false;
  const permissions = permissionObject(row.permissions);
  if (permissions['appointment:create'] !== true) return false;
  if (String(row.business_role || '') !== expected.businessRole) return false;
  if (String(row.calendar_scope || '') !== expected.calendarScope) return false;
  if (String(row.service_scope || '') !== expected.serviceScope) return false;
  if (expected.staffLinked === false && positiveId(row.staff_id) != null) return false;
  if (expected.staffLinked === true && (positiveId(row.staff_id) == null || row.staff_status !== 'active')) return false;
  return true;
}

function validateSnapshot(snapshot, { expectedIds = null, requireFinalState = false } = {}) {
  const reasons = [];
  const naomi = one(snapshot.naomi, 'naomi', reasons);
  const marietjie = one(snapshot.marietjie, 'marietjie', reasons);
  const jp = one(snapshot.jp, 'jp', reasons);
  const christel = one(snapshot.christel, 'christel', reasons);
  const demoClient = one(snapshot.demoClient, 'demo_client', reasons);

  if (naomi && !principalMatches(naomi, {
    businessRole: 'booking_operator', calendarScope: 'all_business', serviceScope: 'all_services', staffLinked: false,
  })) reasons.push('naomi_authority_drift');
  if (marietjie && !principalMatches(marietjie, {
    businessRole: 'tenant_practitioner', calendarScope: 'own_services', serviceScope: 'own_services', staffLinked: true,
  })) reasons.push('marietjie_authority_drift');
  if (jp && !principalMatches(jp, {
    businessRole: 'business_admin', calendarScope: 'all_business', serviceScope: 'all_services', staffLinked: false,
  })) reasons.push('jp_authority_drift');
  if (christel && (christel.admin_active !== true || positiveId(christel.id) == null || christel.staff_status !== 'active')) {
    reasons.push('christel_authority_drift');
  }

  const demoClientId = positiveId(demoClient?.id);
  if (!demoClientId) reasons.push('demo_client_invalid_id');

  const ids = {
    naomiAdminId: positiveId(naomi?.id),
    marietjieAdminId: positiveId(marietjie?.id),
    jpAdminId: positiveId(jp?.id),
    christelAdminId: positiveId(christel?.id),
    demoCrmV2ClientId: demoClientId,
  };

  const targetIds = new Set([ids.naomiAdminId, ids.marietjieAdminId, ids.jpAdminId].filter(Boolean));
  const unexpectedHolders = (snapshot.holders || [])
    .map((row) => positiveId(row.id))
    .filter((id) => id && !targetIds.has(id));
  if (unexpectedHolders.length) reasons.push('unexpected_existing_record_past_holder');
  if (christel && policyState(christel).recordPast) reasons.push('christel_must_remain_ungranted');

  if (expectedIds) {
    for (const [key, value] of Object.entries(expectedIds)) {
      if (ids[key] !== positiveId(value)) reasons.push(`${key}_changed_since_preflight`);
    }
  }

  if (requireFinalState && naomi && marietjie && jp && demoClientId) {
    const naomiState = policyState(naomi);
    const marietjieState = policyState(marietjie);
    const jpState = policyState(jp);
    if (!naomiState.recordPast || naomiState.retrospectiveClientIds !== null) reasons.push('naomi_final_policy_mismatch');
    if (!marietjieState.recordPast || marietjieState.retrospectiveClientIds !== null) reasons.push('marietjie_final_policy_mismatch');
    if (!jpState.recordPast || JSON.stringify(jpState.retrospectiveClientIds) !== JSON.stringify([demoClientId])) {
      reasons.push('jp_final_policy_mismatch');
    }
    const holderIds = (snapshot.holders || []).map((row) => positiveId(row.id)).filter(Boolean).sort((a, b) => a - b);
    const expectedHolderIds = [...targetIds].sort((a, b) => a - b);
    if (JSON.stringify(holderIds) !== JSON.stringify(expectedHolderIds)) reasons.push('final_holder_set_mismatch');
  }

  return {
    safe: reasons.length === 0,
    reasons,
    ids,
    current: {
      naomi: policyState(naomi),
      marietjie: policyState(marietjie),
      jp: policyState(jp),
      christel: policyState(christel),
      existingHolderIds: (snapshot.holders || []).map((row) => positiveId(row.id)).filter(Boolean).sort((a, b) => a - b),
    },
  };
}

async function readSnapshot(db) {
  const naomi = await db.query(`
    /* retrospectiveAccess753:naomi */
    SELECT a.id,a.staff_id,a.active AS admin_active,a.business_role,a.calendar_scope,a.service_scope,a.permissions,
           s.status AS staff_status
      FROM staff_admin_accounts a
      LEFT JOIN staff s ON s.id=a.staff_id
     WHERE LOWER(TRIM(a.display_name))='naomi'
       AND a.staff_id IS NULL
     ORDER BY a.id
  `);
  const jp = await db.query(`
    /* retrospectiveAccess753:jp */
    SELECT a.id,a.staff_id,a.active AS admin_active,a.business_role,a.calendar_scope,a.service_scope,a.permissions,
           s.status AS staff_status
      FROM staff_admin_accounts a
      LEFT JOIN staff s ON s.id=a.staff_id
     WHERE LOWER(TRIM(a.display_name))='jean-pierre'
       AND a.staff_id IS NULL
     ORDER BY a.id
  `);
  const marietjie = await db.query(`
    /* retrospectiveAccess753:marietjie */
    SELECT a.id,a.staff_id,a.active AS admin_active,a.business_role,a.calendar_scope,a.service_scope,a.permissions,
           s.status AS staff_status
      FROM staff s
      JOIN staff_admin_accounts a ON a.staff_id=s.id
     WHERE s.source_name='Marietjie .'
     ORDER BY a.id
  `);
  const christel = await db.query(`
    /* retrospectiveAccess753:christel */
    SELECT a.id,a.staff_id,a.active AS admin_active,a.business_role,a.calendar_scope,a.service_scope,a.permissions,
           s.status AS staff_status
      FROM staff s
      JOIN staff_admin_accounts a ON a.staff_id=s.id
     WHERE s.source_name='Christel .'
     ORDER BY a.id
  `);
  const demoClient = await db.query(`
    /* retrospectiveAccess753:demo-client */
    SELECT c.id
      FROM crm_v2_clients c
     WHERE c.status='active'
       AND c.profile_status='registered'
       AND c.provenance #>> '{registrationCompleted,via}' = 'whatsapp'
       AND c.provenance #>> '{registrationCompleted,at}' >= $1
       AND c.provenance #>> '{registrationCompleted,at}' < $2
       AND EXISTS (
         SELECT 1
           FROM client_onboarding_sessions s
          WHERE s.crm_v2_client_id=c.id
            AND s.identity_model='crm_v2'
            AND s.state='complete'
       )
     ORDER BY c.id
  `, [DEMO_ACCEPTANCE_WINDOW_START, DEMO_ACCEPTANCE_WINDOW_END]);
  const holders = await db.query(`
    /* retrospectiveAccess753:holders */
    SELECT id
      FROM staff_admin_accounts
     WHERE active=TRUE
       AND COALESCE(permissions,'{}'::jsonb) @> '{"appointment:record_past":true}'::jsonb
     ORDER BY id
  `);

  return {
    naomi: naomi.rows,
    marietjie: marietjie.rows,
    jp: jp.rows,
    christel: christel.rows,
    demoClient: demoClient.rows,
    holders: holders.rows,
  };
}

async function preflight({ dbPool = pool } = {}) {
  const db = await dbPool.connect();
  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const snapshot = await readSnapshot(db);
    const validation = validateSnapshot(snapshot);
    await db.query('COMMIT');
    return {
      status: validation.safe ? 'preflight_ready' : 'preflight_blocked',
      ...validation,
      demoAcceptanceWindow: [DEMO_ACCEPTANCE_WINDOW_START, DEMO_ACCEPTANCE_WINDOW_END],
    };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

function expectedIdsFromEnv(env) {
  return {
    naomiAdminId: positiveId(env[NAOMI_ID_ENV]),
    marietjieAdminId: positiveId(env[MARIETJIE_ID_ENV]),
    jpAdminId: positiveId(env[JP_ID_ENV]),
    demoCrmV2ClientId: positiveId(env[DEMO_CLIENT_ID_ENV]),
  };
}

function expectedIdsComplete(expectedIds) {
  return Object.values(expectedIds).every((value) => positiveId(value) != null);
}

async function verifyFinalState({ dbPool = pool, expectedIds }) {
  const db = await dbPool.connect();
  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const snapshot = await readSnapshot(db);
    const validation = validateSnapshot(snapshot, { expectedIds, requireFinalState: true });
    if (!validation.safe) {
      throw new RetrospectiveAccessProvisioningError(
        'RETROSPECTIVE_ACCESS_753_POSTCOMMIT_FAILED',
        'Retrospective access provisioning postcommit verification failed.',
        { reasons: validation.reasons }
      );
    }
    await db.query('COMMIT');
    return validation;
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function execute({ dbPool = pool, runId, expectedIds }) {
  if (runId !== AUTHORIZED_RUN_ID) {
    return { status: 'refused', reason: 'run_id_mismatch' };
  }
  if (!expectedIdsComplete(expectedIds || {})) {
    return { status: 'refused', reason: 'expected_ids_incomplete' };
  }

  const db = await dbPool.connect();
  let before;
  try {
    await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    await db.query(`SET LOCAL statement_timeout = '60s'`);
    await db.query(`SET LOCAL lock_timeout = '5s'`);
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [LOCK_KEY]);

    const replay = await db.query(`
      /* retrospectiveAccess753:replay */
      SELECT 1
        FROM crm_audit_events
       WHERE action=$1 AND metadata->>'runId'=$2
       ORDER BY id
       LIMIT 1
    `, [AUDIT_ACTION, runId]);
    if (replay.rowCount) {
      await db.query('COMMIT');
      const final = await verifyFinalState({ dbPool, expectedIds });
      return { status: 'already_executed', runId, ids: final.ids, current: final.current };
    }

    before = validateSnapshot(await readSnapshot(db), { expectedIds });
    if (!before.safe) {
      throw new RetrospectiveAccessProvisioningError(
        'RETROSPECTIVE_ACCESS_753_PREFLIGHT_DRIFT',
        'Retrospective access provisioning refused because production authority drifted.',
        { reasons: before.reasons }
      );
    }

    const targetIds = [expectedIds.naomiAdminId, expectedIds.marietjieAdminId, expectedIds.jpAdminId];
    const locked = await db.query(`
      /* retrospectiveAccess753:lock-principals */
      SELECT id FROM staff_admin_accounts WHERE id=ANY($1::bigint[]) ORDER BY id FOR UPDATE
    `, [targetIds]);
    if (locked.rowCount !== 3) {
      throw new RetrospectiveAccessProvisioningError(
        'RETROSPECTIVE_ACCESS_753_PRINCIPAL_LOCK_FAILED',
        'Retrospective access provisioning could not lock all target principals.'
      );
    }
    const lockedDemo = await db.query(`
      /* retrospectiveAccess753:lock-demo-client */
      SELECT id FROM crm_v2_clients WHERE id=$1 FOR UPDATE
    `, [expectedIds.demoCrmV2ClientId]);
    if (lockedDemo.rowCount !== 1) {
      throw new RetrospectiveAccessProvisioningError(
        'RETROSPECTIVE_ACCESS_753_DEMO_LOCK_FAILED',
        'Retrospective access provisioning could not lock the controlled-demo client.'
      );
    }

    const ordinaryPatch = JSON.stringify({ [RECORD_PAST]: true });
    for (const adminId of [expectedIds.naomiAdminId, expectedIds.marietjieAdminId]) {
      const result = await db.query(`
        /* retrospectiveAccess753:grant-ordinary */
        UPDATE staff_admin_accounts
           SET permissions=(COALESCE(permissions,'{}'::jsonb) || $2::jsonb) - $3,
               updated_at=NOW()
         WHERE id=$1
         RETURNING id
      `, [adminId, ordinaryPatch, RECORD_PAST_CLIENT_IDS]);
      if (result.rowCount !== 1) {
        throw new RetrospectiveAccessProvisioningError(
          'RETROSPECTIVE_ACCESS_753_ORDINARY_GRANT_FAILED',
          'Retrospective access provisioning failed to update an ordinary recipient.',
          { adminId }
        );
      }
    }

    const jpPatch = JSON.stringify({
      [RECORD_PAST]: true,
      [RECORD_PAST_CLIENT_IDS]: [expectedIds.demoCrmV2ClientId],
    });
    const jpUpdate = await db.query(`
      /* retrospectiveAccess753:grant-jp */
      UPDATE staff_admin_accounts
         SET permissions=COALESCE(permissions,'{}'::jsonb) || $2::jsonb,
             updated_at=NOW()
       WHERE id=$1
       RETURNING id
    `, [expectedIds.jpAdminId, jpPatch]);
    if (jpUpdate.rowCount !== 1) {
      throw new RetrospectiveAccessProvisioningError(
        'RETROSPECTIVE_ACCESS_753_JP_GRANT_FAILED',
        'Retrospective access provisioning failed to update the controlled-demo recipient.'
      );
    }

    const afterSnapshot = await readSnapshot(db);
    const after = validateSnapshot(afterSnapshot, { expectedIds, requireFinalState: true });
    if (!after.safe) {
      throw new RetrospectiveAccessProvisioningError(
        'RETROSPECTIVE_ACCESS_753_TRANSACTION_POSTCONDITION_FAILED',
        'Retrospective access provisioning transaction postconditions failed.',
        { reasons: after.reasons }
      );
    }

    await db.query(`
      INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
      VALUES($1,$2,'staff_access_policy',NULL,$3::jsonb)
    `, [expectedIds.jpAdminId, AUDIT_ACTION, JSON.stringify({
      runId,
      issue: 753,
      recipientAdminIds: [expectedIds.naomiAdminId, expectedIds.marietjieAdminId, expectedIds.jpAdminId],
      controlledDemoCrmV2ClientId: expectedIds.demoCrmV2ClientId,
      before: before.current,
      after: after.current,
      christelGranted: false,
      outboundMessages: 0,
      providerMutations: 0,
      credentialMutations: 0,
    })]);

    await db.query('COMMIT');
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }

  const verified = await verifyFinalState({ dbPool, expectedIds });
  return { status: 'complete', runId, ids: verified.ids, current: verified.current };
}

async function runConfigured({ env = process.env, dbPool = pool } = {}) {
  const mode = String(env[MODE_ENV] || '').trim().toLowerCase();
  if (!mode) return { status: 'disabled' };
  if (!['preflight', 'execute'].includes(mode)) return { status: 'refused', reason: 'invalid_mode' };

  const expectedReleaseSha = configuredReleaseSha(env);
  const deployedSha = currentRenderSha(env);
  if (!validSha(expectedReleaseSha) || !validSha(deployedSha) || expectedReleaseSha !== deployedSha) {
    return { status: 'refused', reason: 'release_sha_mismatch' };
  }

  if (mode === 'preflight') return preflight({ dbPool });

  const runId = String(env[RUN_ID_ENV] || '').trim();
  return execute({ dbPool, runId, expectedIds: expectedIdsFromEnv(env) });
}

module.exports = {
  MODE_ENV,
  RELEASE_SHA_ENV,
  RUN_ID_ENV,
  NAOMI_ID_ENV,
  MARIETJIE_ID_ENV,
  JP_ID_ENV,
  DEMO_CLIENT_ID_ENV,
  AUTHORIZED_RUN_ID,
  AUDIT_ACTION,
  RECORD_PAST,
  RECORD_PAST_CLIENT_IDS,
  DEMO_ACCEPTANCE_WINDOW_START,
  DEMO_ACCEPTANCE_WINDOW_END,
  RetrospectiveAccessProvisioningError,
  positiveId,
  policyState,
  validateSnapshot,
  readSnapshot,
  preflight,
  verifyFinalState,
  execute,
  runConfigured,
};
