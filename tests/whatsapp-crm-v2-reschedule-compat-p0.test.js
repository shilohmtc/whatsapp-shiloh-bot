const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

const {
  resolveRescheduleRequestIdentity,
  insertPendingRescheduleRequest,
  canonicalStillMatchesRequest,
} = require('../src/services/clientRescheduleApproval');
const {
  canonicalIdentityContinuity,
  canonicalOutcomeState,
} = require('../src/services/clientRescheduleApprovedNotification');

function repositoryRow(id = '912', overrides = {}) {
  return {
    id,
    name: 'Server Canonical V2 Name',
    normalized_mobile: '27821234567',
    date_of_birth: null,
    gender: null,
    profile_status: 'minimal',
    mobile_verified_at: new Date('2026-08-28T10:00:00.000Z'),
    source: 'staff',
    status: 'active',
    provenance: { fixture: true },
    created_at: new Date('2026-08-28T09:00:00.000Z'),
    updated_at: new Date('2026-08-28T09:00:00.000Z'),
    ...overrides,
  };
}

function syntheticDb(rows = [repositoryRow()]) {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params });
      if (/pg_advisory_xact_lock\(hashtext/.test(sql)) return { rows: [], rowCount: 1 };
      if (/FROM crm_v2_clients/.test(sql)) return { rows, rowCount: rows.length };
      if (/INSERT INTO appointment_reschedule_requests/.test(sql)) {
        return {
          rows: [{ id: 7002, appointment_id: params[0], client_id: params[1], crm_v2_client_id: params[2], status: 'pending' }],
          rowCount: 1,
        };
      }
      throw new Error(`Unexpected synthetic query: ${sql}`);
    },
  };
}

function appointment(overrides = {}) {
  return {
    id: 7001,
    client_id: null,
    crm_v2_client_id: 912,
    client_name: 'Carried Name Must Not Win',
    service_id: 31,
    staff_id: 14,
    starts_at: new Date('2026-09-15T08:00:00.000Z'),
    ends_at: new Date('2026-09-15T09:00:00.000Z'),
    ...overrides,
  };
}

test('migration 087 is additive XOR identity schema with no retained-row conversion', () => {
  const migration = read('migrations/087_whatsapp_crm_v2_reschedule_compat.sql');
  assert.match(migration, /ALTER COLUMN client_id DROP NOT NULL/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS crm_v2_client_id BIGINT/);
  assert.match(migration, /REFERENCES crm_v2_clients\(id\)[\s\S]*ON DELETE RESTRICT/);
  assert.match(migration, /CHECK \(num_nonnulls\(client_id, crm_v2_client_id\) = 1\)/);
  assert.match(migration, /NOT VALID[\s\S]*VALIDATE CONSTRAINT/);
  assert.doesNotMatch(migration, /(?:^|\n)\s*(?:INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM)\b/i);
  assert.doesNotMatch(migration, /identity_model/i);
});

test('synthetic CRM V2 request revalidates exact mobile and persists only the canonical V2 id', async () => {
  const db = syntheticDb();
  const target = appointment();
  const authority = await resolveRescheduleRequestIdentity({ db, phone: '082 123 4567', appointment: target });
  assert.equal(authority.status, 'ready');
  assert.equal(authority.clientId, null);
  assert.equal(authority.crmV2ClientId, '912');
  assert.equal(authority.clientName, 'Server Canonical V2 Name');
  assert.equal(authority.clientPhone, '27821234567');
  assert.match(authority.audit.identityResolution, /crm_v2_final_exact_mobile_locked/);

  const inserted = await insertPendingRescheduleRequest(db, {
    appointment: target,
    authority,
    requestedByPhone: authority.clientPhone,
    proposedStartsAt: new Date('2026-09-16T08:00:00.000Z'),
    proposedEndsAt: new Date('2026-09-16T09:00:00.000Z'),
  });
  assert.deepEqual(inserted.rows[0], {
    id: 7002,
    appointment_id: 7001,
    client_id: null,
    crm_v2_client_id: '912',
    status: 'pending',
  });
  const requestInsert = db.queries.find(({ sql }) => /INSERT INTO appointment_reschedule_requests/.test(sql));
  assert.deepEqual(requestInsert.params.slice(0, 3), [7001, null, '912']);
  assert.equal(db.queries.some(({ sql }) => /INSERT INTO (?:clients|client_contacts|crm_v2_clients)/i.test(sql)), false);
});

test('missing, ambiguous and different-owner V2 authority fail before request insertion', async () => {
  for (const rows of [
    [],
    [repositoryRow('913')],
    [repositoryRow('912'), repositoryRow('913')],
  ]) {
    const db = syntheticDb(rows);
    const authority = await resolveRescheduleRequestIdentity({ db, phone: '27821234567', appointment: appointment() });
    assert.notEqual(authority.status, 'ready');
    assert.equal(db.queries.some(({ sql }) => /INSERT INTO appointment_reschedule_requests/.test(sql)), false);
  }
});

test('retained legacy request projection remains client_id only', async () => {
  const db = syntheticDb();
  const target = appointment({ client_id: 41, crm_v2_client_id: null, client_name: 'Legacy Client' });
  const authority = await resolveRescheduleRequestIdentity({ db, phone: '27821234567', appointment: target });
  assert.equal(authority.status, 'ready');
  assert.equal(authority.clientId, '41');
  assert.equal(authority.crmV2ClientId, null);
  await insertPendingRescheduleRequest(db, {
    appointment: target,
    authority,
    requestedByPhone: authority.clientPhone,
    proposedStartsAt: new Date('2026-09-16T08:00:00.000Z'),
    proposedEndsAt: new Date('2026-09-16T09:00:00.000Z'),
  });
  const requestInsert = db.queries.find(({ sql }) => /INSERT INTO appointment_reschedule_requests/.test(sql));
  assert.deepEqual(requestInsert.params.slice(0, 3), [7001, '41', null]);
  assert.equal(db.queries.some(({ sql }) => /FROM crm_v2_clients/.test(sql)), false);
});

test('decision continuity requires request and appointment to retain the same XOR identity', () => {
  const base = {
    request_status: 'pending',
    appointment_status: 'confirmed',
    client_id: null,
    crm_v2_client_id: 912,
    appointment_client_id: null,
    appointment_crm_v2_client_id: 912,
    crm_v2_authority_id: 912,
    requested_by_phone: '27821234567',
    client_phone: '27821234567',
    staff_count: 1,
    service_count: 1,
    current_staff_id: 14,
    approver_staff_id: 14,
    current_service_id: 31,
    requested_service_id: 31,
    current_starts_at: '2026-09-15T08:00:00.000Z',
    original_starts_at: '2026-09-15T08:00:00.000Z',
    current_ends_at: '2026-09-15T09:00:00.000Z',
    original_ends_at: '2026-09-15T09:00:00.000Z',
  };
  assert.equal(canonicalStillMatchesRequest(base), true);
  assert.equal(canonicalStillMatchesRequest({ ...base, appointment_crm_v2_client_id: 913 }), false);
  assert.equal(canonicalStillMatchesRequest({ ...base, client_id: 41 }), false);
  assert.equal(canonicalStillMatchesRequest({ ...base, client_phone: '27829999999' }), false);
});

test('approved V2 notification requires preserved canonical identity and server-owned recipient', () => {
  const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const context = {
    request_status: 'approved',
    request_client_id: null,
    request_crm_v2_client_id: 912,
    appointment_client_id: null,
    appointment_crm_v2_client_id: 912,
    crm_v2_authority_id: 912,
    requested_by_phone: '27821234567',
    client_phone: '27821234567',
    client_notified_at: null,
    client_notification_suppressed_at: null,
    appointment_status: 'confirmed',
    current_starts_at: futureStart,
    proposed_starts_at: futureStart,
    current_ends_at: futureEnd,
    proposed_ends_at: futureEnd,
  };
  assert.equal(canonicalIdentityContinuity(context), true);
  assert.deepEqual(canonicalOutcomeState(context), { deliverable: true, suppress: false, reason: null });
  assert.deepEqual(
    canonicalOutcomeState({ ...context, appointment_crm_v2_client_id: 913 }),
    { deliverable: false, suppress: true, reason: 'canonical_client_identity_changed_after_approval' },
  );
});

test('creation, decision and notification queries do not use client_contacts for a V2 branch', () => {
  const approval = read('src/services/clientRescheduleApproval.js');
  const notification = read('src/services/clientRescheduleApprovedNotification.js');
  const startBoundary = read('src/bootstrap/clientRescheduleStartBoundaryPatch.js');
  assert.match(approval, /v2\.normalized_mobile=\$1/);
  assert.match(approval, /resolveFinalBookingIdentity/);
  assert.match(approval, /request\.crm_v2_client_id/);
  assert.match(notification, /THEN v2\.normalized_mobile ELSE/);
  assert.match(notification, /canonicalIdentityContinuity/);
  assert.match(startBoundary, /v2\.normalized_mobile=\$1/);
  assert.doesNotMatch(`${approval}\n${notification}\n${startBoundary}`, /INSERT INTO (?:clients|client_contacts)/i);
});

test('approval preserves appointment identity while first-decision and hold semantics remain intact', () => {
  const approval = read('src/services/clientRescheduleApproval.js');
  const holds = read('src/services/clientRescheduleHoldReconciliation.js');
  assert.match(approval, /revalidateDecisionIdentity/);
  assert.match(approval, /client_id IS NOT DISTINCT FROM \$4::bigint/);
  assert.match(approval, /crm_v2_client_id IS NOT DISTINCT FROM \$5::bigint/);
  assert.match(approval, /RETURNING client_id,crm_v2_client_id/);
  assert.match(approval, /WHERE id=\$1 AND status='pending'/);
  assert.match(holds, /appointment\.crm_v2_client_id IS NOT DISTINCT FROM request\.crm_v2_client_id/);
  assert.match(holds, /request\.proposed_starts_at<\$3/);
  assert.match(holds, /status='superseded'/);
});

test('notification retry and idempotency mechanisms are retained for both identity models', () => {
  const notification = read('src/services/clientRescheduleApprovedNotification.js');
  const customerChange = read('src/services/customerChangeNotification.js');
  assert.match(notification, /client_notification_claimed_at/);
  assert.match(notification, /client_notification_attempt_count=client_notification_attempt_count\+1/);
  assert.match(notification, /already_claimed_or_completed/);
  assert.match(notification, /idempotentDelivery: true/);
  assert.match(customerChange, /ON CONFLICT \(audit_event_id\) DO NOTHING/);
  assert.match(customerChange, /v2\.normalized_mobile/);
});

test('CRM V2 registration remains inactive and no shadow master write exists', () => {
  const onboarding = read('src/services/clientIdentityOnboarding.js');
  const approval = read('src/services/clientRescheduleApproval.js');
  const bookingIdentity = read('src/services/whatsappBookingIdentity.js');
  assert.match(onboarding, /CRM_V2_WHATSAPP_REGISTRATION_INACTIVE/);
  assert.doesNotMatch(`${onboarding}\n${approval}\n${bookingIdentity}`, /registerWhatsAppClient\s*\(/);
  assert.doesNotMatch(`${approval}\n${bookingIdentity}`, /INSERT INTO (?:clients|client_contacts|crm_v2_clients)/i);
});
