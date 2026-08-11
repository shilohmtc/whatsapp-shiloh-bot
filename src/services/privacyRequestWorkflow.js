const crypto = require('crypto');
const { pool } = require('../db/pool');
const { getClientPrivacyInventory } = require('./privacyClientInventory');
const { buildRetentionDecisionPlan } = require('./privacyRetentionPolicy');

const REQUEST_ACTIONS = new Set(['access', 'correction', 'deletion', 'deidentification', 'objection']);
const VERIFICATION_METHODS = new Set([
  'verified_whatsapp_contact',
  'in_person_identity_check',
  'document_checked_offline',
  'other_owner_attested',
]);

function validPositiveId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function ownerApprovalConfigured() {
  return Boolean(process.env.PRIVACY_OWNER_APPROVAL_KEY);
}

function ownerApprovalAuthorized(suppliedKey) {
  const configured = process.env.PRIVACY_OWNER_APPROVAL_KEY;
  return Boolean(configured) && safeEqual(suppliedKey, configured);
}

function sanitizePreview(plan) {
  return {
    policyVersion: plan.policyVersion,
    status: plan.status,
    destructiveActionAllowed: false,
    blockingReasons: plan.blockingReasons,
    summary: plan.summary || {},
  };
}

async function createPrivacyRequest({ clientId, requestedAction }, db = pool) {
  if (!validPositiveId(clientId)) return { status: 'invalid_client' };
  if (!REQUEST_ACTIONS.has(String(requestedAction || ''))) return { status: 'invalid_action' };

  const client = await db.query('SELECT id FROM clients WHERE id = $1', [clientId]);
  if (!client.rowCount) return { status: 'not_found' };

  const result = await db.query(
    `INSERT INTO privacy_requests (client_id, requested_action, status)
     VALUES ($1, $2, 'identity_pending')
     RETURNING id, client_id, requested_action, status, created_at, updated_at`,
    [clientId, requestedAction]
  );
  return { status: 'created', request: result.rows[0], destructiveActionAllowed: false };
}

async function getPrivacyRequest(requestId, db = pool) {
  if (!validPositiveId(requestId)) return { status: 'invalid_request' };
  const result = await db.query(
    `SELECT id, client_id, requested_action, status, verification_method,
            identity_verified_at, owner_authorized_at, policy_version,
            preview_summary, created_at, updated_at
       FROM privacy_requests WHERE id = $1`,
    [requestId]
  );
  if (!result.rowCount) return { status: 'not_found' };
  return { status: 'ok', request: result.rows[0], destructiveActionAllowed: false };
}

async function verifyPrivacyRequest({ requestId, verificationMethod }, db = pool) {
  if (!validPositiveId(requestId)) return { status: 'invalid_request' };
  if (!VERIFICATION_METHODS.has(String(verificationMethod || ''))) return { status: 'invalid_verification_method' };

  const result = await db.query(
    `UPDATE privacy_requests
        SET status = 'verified',
            verification_method = $2,
            identity_verified_at = NOW(),
            updated_at = NOW()
      WHERE id = $1
        AND status = 'identity_pending'
      RETURNING id, client_id, requested_action, status, verification_method,
                identity_verified_at, owner_authorized_at, created_at, updated_at`,
    [requestId, verificationMethod]
  );
  if (!result.rowCount) {
    const existing = await getPrivacyRequest(requestId, db);
    return existing.status === 'not_found' ? existing : { status: 'state_conflict', request: existing.request };
  }
  return { status: 'verified', request: result.rows[0], destructiveActionAllowed: false };
}

async function authorizePrivacyRequest({ requestId }, db = pool) {
  if (!validPositiveId(requestId)) return { status: 'invalid_request' };
  const current = await getPrivacyRequest(requestId, db);
  if (current.status !== 'ok') return current;
  if (current.request.status !== 'verified' || !current.request.identity_verified_at) {
    return { status: 'identity_not_verified', request: current.request, destructiveActionAllowed: false };
  }

  const inventory = await getClientPrivacyInventory(current.request.client_id, db);
  if (inventory.status !== 'ok') {
    return { status: 'inventory_blocked', inventoryStatus: inventory.status, destructiveActionAllowed: false };
  }
  const plan = buildRetentionDecisionPlan(inventory);
  const preview = sanitizePreview(plan);

  const result = await db.query(
    `UPDATE privacy_requests
        SET status = 'owner_authorized',
            owner_authorized_at = NOW(),
            policy_version = $2,
            preview_summary = $3::jsonb,
            updated_at = NOW()
      WHERE id = $1
        AND status = 'verified'
      RETURNING id, client_id, requested_action, status, verification_method,
                identity_verified_at, owner_authorized_at, policy_version,
                preview_summary, created_at, updated_at`,
    [requestId, plan.policyVersion, JSON.stringify(preview)]
  );
  if (!result.rowCount) return { status: 'state_conflict', destructiveActionAllowed: false };

  return {
    status: 'owner_authorized',
    request: result.rows[0],
    retentionPlan: preview,
    executionReady: false,
    destructiveActionAllowed: false,
    blockingReasons: [
      ...(preview.blockingReasons || []).filter((reason) => reason !== 'owner_authorization_not_present' && reason !== 'request_identity_not_verified_in_preview'),
      'destructive_executor_not_enabled',
    ],
  };
}

module.exports = {
  REQUEST_ACTIONS,
  VERIFICATION_METHODS,
  validPositiveId,
  ownerApprovalConfigured,
  ownerApprovalAuthorized,
  createPrivacyRequest,
  getPrivacyRequest,
  verifyPrivacyRequest,
  authorizePrivacyRequest,
};
