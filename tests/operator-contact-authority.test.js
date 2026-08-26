const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  AUTHORITY_VERSION,
  VERIFICATION_METHOD,
  OPERATOR_ROLES,
  operatorRoleForAdmin,
  createOperatorContactAuthorityService,
} = require('../src/services/operatorContactAuthority');
const { operatorContactAuthorityClientScript } = require('../src/presentation/operatorContactAuthorityUx');

const ROOT = path.join(__dirname, '..');
const CLIENT_ID = 101;
const CONTACT_ID = 501;
const NORMALIZED_PHONE = '27821234567';

function clone(value) {
  return structuredClone(value);
}

function adminRows() {
  return {
    1: { id: 1, display_name: 'Jean-Pierre', role: 'admin', business_role: 'business_admin', admin_active: true, staff_id: null, staff_status: null },
    2: { id: 2, display_name: 'Christel', role: 'manager', business_role: 'owner', admin_active: true, staff_id: 9, staff_status: 'active' },
    3: { id: 3, display_name: 'Read only', role: 'read_only', business_role: 'employee_practitioner', admin_active: true, staff_id: 10, staff_status: 'active' },
    4: { id: 4, display_name: 'Practitioner', role: 'practitioner', business_role: 'employee_practitioner', admin_active: true, staff_id: 11, staff_status: 'active' },
  };
}

function memoryAuthorityDb({
  client = {},
  contact = {},
  verifications = [],
  nameAuthority = null,
  duplicateOwner = false,
  failOnAudit = false,
} = {}) {
  const state = {
    admins: adminRows(),
    client: {
      id: CLIENT_ID,
      display_name: 'Imported Jane',
      status: 'active',
      source: 'goldie_import',
      has_appointment_history: true,
      ...client,
    },
    contacts: [{
      id: CONTACT_ID,
      client_id: CLIENT_ID,
      contact_type: 'whatsapp',
      value: '+27 82 123 4567',
      normalized_value: NORMALIZED_PHONE,
      is_primary: true,
      verified_at: null,
      ...contact,
    }],
    verifications: clone(verifications),
    nameAuthority: nameAuthority ? clone(nameAuthority) : null,
    audits: [],
    calls: [],
    snapshot: null,
    duplicateOwner,
    failOnAudit,
  };

  function activeVerification(contactId, method = null) {
    return state.verifications
      .filter((item) => item.status === 'active'
        && Number(item.client_id) === Number(state.client.id)
        && Number(item.client_contact_id) === Number(contactId)
        && (!method || item.verification_method === method))
      .sort((left, right) => {
        const preferred = Number(right.verification_method === VERIFICATION_METHOD) - Number(left.verification_method === VERIFICATION_METHOD);
        return preferred || Number(right.id) - Number(left.id);
      })[0] || null;
  }

  async function query(sql, params = []) {
    const q = String(sql).replace(/\s+/g, ' ').trim();
    state.calls.push({ sql: q, params: clone(params) });
    if (q === 'BEGIN ISOLATION LEVEL SERIALIZABLE') {
      state.snapshot = clone({
        client: state.client,
        contacts: state.contacts,
        verifications: state.verifications,
        nameAuthority: state.nameAuthority,
        audits: state.audits,
      });
      return { rows: [], rowCount: 0 };
    }
    if (q === 'COMMIT') { state.snapshot = null; return { rows: [], rowCount: 0 }; }
    if (q === 'ROLLBACK') {
      if (state.snapshot) {
        state.client = state.snapshot.client;
        state.contacts = state.snapshot.contacts;
        state.verifications = state.snapshot.verifications;
        state.nameAuthority = state.snapshot.nameAuthority;
        state.audits = state.snapshot.audits;
      }
      state.snapshot = null;
      return { rows: [], rowCount: 0 };
    }
    if (q.includes('FROM staff_admin_accounts a')) {
      const admin = state.admins[Number(params[0])] || null;
      return { rows: admin ? [clone(admin)] : [], rowCount: admin ? 1 : 0 };
    }
    if (q.startsWith('SELECT c.id,c.display_name,c.status,c.source')) {
      if (Number(params[0]) !== Number(state.client.id)) return { rows: [], rowCount: 0 };
      return {
        rows: [{
          ...clone(state.client),
          name_authority_id: state.nameAuthority?.id || null,
          authoritative_name: state.nameAuthority?.current_name || null,
          name_evidence_type: state.nameAuthority?.evidence_type || null,
          name_promoted_at: state.nameAuthority?.promoted_at || null,
        }],
        rowCount: 1,
      };
    }
    if (q.startsWith('SELECT cc.id,cc.client_id,cc.contact_type,cc.value,cc.normalized_value')) {
      const contacts = state.contacts.filter((item) => Number(item.client_id) === Number(params[0])).map((item) => {
        const verification = activeVerification(item.id);
        return {
          ...clone(item),
          identity_verification_id: verification?.id || null,
          verification_method: verification?.verification_method || null,
          identity_verified_at: verification?.verified_at || null,
        };
      });
      return { rows: contacts, rowCount: contacts.length };
    }
    if (q.startsWith('SELECT id,status FROM clients')) {
      return Number(params[0]) === Number(state.client.id)
        ? { rows: [{ id: state.client.id, status: state.client.status }], rowCount: 1 }
        : { rows: [], rowCount: 0 };
    }
    if (q.startsWith('SELECT id,client_id,contact_type,value,normalized_value,verified_at FROM client_contacts')) {
      const found = state.contacts.find((item) => Number(item.id) === Number(params[0]));
      return { rows: found ? [clone(found)] : [], rowCount: found ? 1 : 0 };
    }
    if (q.startsWith('SELECT pg_advisory_xact_lock')) return { rows: [{}], rowCount: 1 };
    if (q.startsWith('SELECT id,verified_at,evidence_reference FROM client_identity_verifications')) {
      const found = activeVerification(params[1], params[2]);
      return { rows: found ? [clone(found)] : [], rowCount: found ? 1 : 0 };
    }
    if (q.startsWith('UPDATE client_contacts SET verified_at=COALESCE')) {
      const found = state.contacts.find((item) => Number(item.id) === Number(params[0]) && Number(item.client_id) === Number(params[1]));
      if (!found) return { rows: [], rowCount: 0 };
      if (!found.verified_at) found.verified_at = '2026-08-26T12:00:00Z';
      return { rows: [], rowCount: 1 };
    }
    if (q.startsWith('INSERT INTO client_identity_verifications')) {
      const existing = activeVerification(params[1], params[2]);
      if (existing) return { rows: [], rowCount: 0 };
      const row = {
        id: 700 + state.verifications.length + 1,
        client_id: Number(params[0]),
        client_contact_id: Number(params[1]),
        verification_method: params[2],
        status: 'active',
        verified_at: '2026-08-26T12:00:00Z',
        evidence_reference: JSON.parse(params[3]),
      };
      state.verifications.push(row);
      return { rows: [clone(row)], rowCount: 1 };
    }
    if (q.startsWith('SELECT id,verification_method,verified_at FROM client_identity_verifications')) {
      const found = activeVerification(params[1]);
      return { rows: found ? [clone(found)] : [], rowCount: found ? 1 : 0 };
    }
    if (q.startsWith('INSERT INTO crm_audit_events')) {
      if (state.failOnAudit) throw new Error('audit unavailable');
      const staticNameAudit = q.includes("'client.facing_name_explicitly_confirmed_by_operator'");
      const event = staticNameAudit
        ? { actorAdminId: Number(params[0]), action: 'client.facing_name_explicitly_confirmed_by_operator', clientId: Number(params[1]), metadata: JSON.parse(params[2]) }
        : { actorAdminId: Number(params[0]), action: params[1], clientId: Number(params[2]), metadata: JSON.parse(params[3]) };
      state.audits.push(event);
      return { rows: [], rowCount: 1 };
    }
    throw new Error(`Unhandled operator authority test SQL: ${q}`);
  }

  const db = {
    state,
    query,
    async connect() { return { query, release() {} }; },
  };
  const phoneCandidateResolver = async (phone) => {
    if (phone !== state.contacts[0]?.normalized_value || state.client.status !== 'active') return [];
    const owner = { id: state.client.id, contact_id: state.contacts[0].id, contact_ids: [state.contacts[0].id] };
    return state.duplicateOwner ? [owner, { id: 202, contact_id: 999, contact_ids: [999] }] : [owner];
  };
  const namePromoter = async (_queryable, input) => {
    const previous = state.nameAuthority;
    if (previous) previous.revoked_at = '2026-08-26T12:10:00Z';
    state.nameAuthority = {
      id: previous ? Number(previous.id) + 1 : 801,
      client_id: Number(input.clientId),
      current_name: input.name,
      evidence_type: input.evidenceType,
      evidence_reference: clone(input.evidenceReference),
      actor_type: input.actorType,
      actor_reference: input.actorReference,
      promoted_at: '2026-08-26T12:10:00Z',
    };
    return { authorityId: state.nameAuthority.id, name: input.name, evidenceType: input.evidenceType };
  };
  return { db, phoneCandidateResolver, namePromoter };
}

function serviceFor(memory, options = {}) {
  return createOperatorContactAuthorityService({
    db: memory.db,
    phoneCandidateResolver: memory.phoneCandidateResolver,
    namePromoter: memory.namePromoter,
    clientFinder: options.clientFinder || (async () => ({ clients: [] })),
  });
}

function pr500ConsumerEligible(state) {
  if (state.client.status !== 'active' || !state.nameAuthority || state.nameAuthority.revoked_at) return false;
  return state.contacts.some((contact) => contact.verified_at && state.verifications.some((verification) => (
    verification.status === 'active'
      && Number(verification.client_id) === Number(state.client.id)
      && Number(verification.client_contact_id) === Number(contact.id)
  )));
}

test('current JP and Christel authority maps exactly to super_admin and operations_admin', () => {
  assert.equal(operatorRoleForAdmin(adminRows()[1]), OPERATOR_ROLES.SUPER_ADMIN);
  assert.equal(operatorRoleForAdmin(adminRows()[2]), OPERATOR_ROLES.OPERATIONS_ADMIN);
  assert.equal(operatorRoleForAdmin({ role: 'super_admin', business_role: 'business_admin' }), 'super_admin');
  assert.equal(operatorRoleForAdmin({ role: 'operations_admin', business_role: 'owner' }), 'operations_admin');
});

test('read-only, practitioner and inactive-linked staff authority is rejected', async () => {
  const memory = memoryAuthorityDb();
  memory.db.state.admins[5] = { id: 5, role: 'admin', business_role: 'business_admin', admin_active: true, staff_id: 12, staff_status: 'inactive' };
  const service = serviceFor(memory);
  for (const adminId of [3, 4, 5]) {
    await assert.rejects(
      service.resolveAuthorizedOperator(adminId),
      (error) => error?.code === 'OPERATOR_AUTHORITY_FORBIDDEN'
    );
  }
});

test('operator search is bounded, requires explicit selection and never exposes a raw number', async () => {
  const memory = memoryAuthorityDb();
  const finderCalls = [];
  const service = serviceFor(memory, { clientFinder: async (...args) => {
    finderCalls.push(args);
    return { clients: [{
      id: CLIENT_ID,
      display_name: 'Imported Jane',
      status: 'active',
      source: 'goldie_import',
      contacts: [{ isPrimary: true, value: '+27 82 123 4567', normalizedValue: NORMALIZED_PHONE }],
    }] };
  } });
  const result = await service.searchClients({ actorAdminId: 2, query: '  Jane   Doe  ' });
  assert.deepEqual(finderCalls, [['Jane Doe', 10]]);
  assert.equal(result.requiresExplicitSelection, true);
  assert.equal(result.clients[0].contactHint, 'ending in 4567');
  assert.equal(JSON.stringify(result).includes(NORMALIZED_PHONE), false);
});

test('Goldie provenance and appointment history alone remain unverified and name-unconfirmed', async () => {
  const memory = memoryAuthorityDb();
  const state = await serviceFor(memory).loadClientAuthorityState({ actorAdminId: 2, clientId: CLIENT_ID });
  assert.equal(state.client.source, 'goldie_import');
  assert.equal(memory.db.state.client.has_appointment_history, true);
  assert.equal(state.contacts[0].authorityStatus, 'unverified');
  assert.equal(state.nameAuthority.status, 'unconfirmed');
  assert.equal(state.confirmationSafe, false);
});

test('verified_at without exact durable contact-bound verification remains incomplete authority', async () => {
  const memory = memoryAuthorityDb({ contact: { verified_at: '2026-08-25T10:00:00Z' } });
  const state = await serviceFor(memory).loadClientAuthorityState({ actorAdminId: 2, clientId: CLIENT_ID });
  assert.equal(state.contacts[0].verifiedAt != null, true);
  assert.equal(state.contacts[0].identityVerificationId, null);
  assert.equal(state.contacts[0].authorityStatus, 'unverified');
  assert.equal(state.confirmationSafe, false);
});

test('exact active canonical client/contact confirmation creates contact-bound operator_confirmed authority atomically', async () => {
  const memory = memoryAuthorityDb();
  const result = await serviceFor(memory).confirmContact({
    actorAdminId: 2,
    clientId: CLIENT_ID,
    contactId: CONTACT_ID,
    confirmedValue: '082 123 4567',
  });
  assert.equal(result.status, 'confirmed');
  assert.equal(result.verificationMethod, 'operator_confirmed');
  assert.equal(memory.db.state.contacts[0].verified_at != null, true);
  const verification = memory.db.state.verifications.find((item) => item.verification_method === 'operator_confirmed');
  assert.equal(verification.client_id, CLIENT_ID);
  assert.equal(verification.client_contact_id, CONTACT_ID);
  assert.deepEqual(verification.evidence_reference, {
    authorityVersion: AUTHORITY_VERSION,
    confirmationMode: 'live_operator_client_interaction',
    actorAdminId: 2,
    clientId: CLIENT_ID,
    clientContactId: CONTACT_ID,
  });
  assert.equal(JSON.stringify(verification.evidence_reference).includes(NORMALIZED_PHONE), false);
  assert.equal(result.authority.stage, 'contact_verified_name_unconfirmed');
  assert.equal(result.authority.confirmationSafe, false);
});

test('super_admin may execute the same exact deliberate contact confirmation', async () => {
  const memory = memoryAuthorityDb();
  const result = await serviceFor(memory).confirmContact({ actorAdminId: 1, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  assert.equal(result.operatorRole, 'super_admin');
  assert.equal(memory.db.state.audits[0].actorAdminId, 1);
});

test('normalized value mismatch, moved contact and changed contact fail closed before authority write', async () => {
  for (const fixture of [
    { confirmedValue: '0829999999', expected: 'OPERATOR_AUTHORITY_CONTACT_VALUE_MISMATCH' },
    { contact: { client_id: 202 }, confirmedValue: NORMALIZED_PHONE, expected: 'OPERATOR_AUTHORITY_CONTACT_OWNER_MISMATCH' },
    { contact: { normalized_value: '27829999999' }, confirmedValue: NORMALIZED_PHONE, expected: 'OPERATOR_AUTHORITY_CONTACT_VALUE_MISMATCH' },
  ]) {
    const memory = memoryAuthorityDb({ contact: fixture.contact || {} });
    await assert.rejects(
      serviceFor(memory).confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: fixture.confirmedValue }),
      (error) => error?.code === fixture.expected
    );
    assert.equal(memory.db.state.verifications.length, 0);
    assert.equal(memory.db.state.audits.length, 0);
  }
});

test('duplicate active phone ownership fails closed and is visible as ambiguous', async () => {
  const memory = memoryAuthorityDb({ duplicateOwner: true });
  const service = serviceFor(memory);
  const state = await service.loadClientAuthorityState({ actorAdminId: 2, clientId: CLIENT_ID });
  assert.equal(state.contacts[0].authorityStatus, 'ambiguous');
  assert.equal(state.stage, 'ambiguous_contact');
  await assert.rejects(
    service.confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE }),
    (error) => error?.code === 'OPERATOR_AUTHORITY_CONTACT_AMBIGUOUS'
  );
  assert.equal(memory.db.state.verifications.length, 0);
});

test('repeat contact confirmation is idempotent and preserves the original verification row', async () => {
  const memory = memoryAuthorityDb();
  const service = serviceFor(memory);
  const first = await service.confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  const second = await service.confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  assert.equal(first.status, 'confirmed');
  assert.equal(second.status, 'already_confirmed');
  assert.equal(first.verificationId, second.verificationId);
  assert.equal(memory.db.state.verifications.filter((item) => item.verification_method === 'operator_confirmed').length, 1);
  assert.deepEqual(memory.db.state.audits.map((event) => event.action), [
    'client.contact_operator_confirmed',
    'client.contact_operator_confirmation_reaffirmed',
  ]);
});

test('existing wa_identity_binding_v1 authority is preserved while operator evidence is added', async () => {
  const memory = memoryAuthorityDb({
    contact: { verified_at: '2026-08-25T08:00:00Z' },
    verifications: [{
      id: 601,
      client_id: CLIENT_ID,
      client_contact_id: CONTACT_ID,
      verification_method: 'wa_identity_binding_v1',
      status: 'active',
      verified_at: '2026-08-25T08:00:00Z',
      evidence_reference: { authorityVersion: 'wa_identity_binding_v1' },
    }],
  });
  await serviceFor(memory).confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  assert.deepEqual(memory.db.state.verifications.map((item) => item.verification_method).sort(), ['operator_confirmed', 'wa_identity_binding_v1']);
  assert.equal(memory.db.state.verifications.find((item) => item.id === 601).status, 'active');
});

test('phone confirmation alone never creates name authority', async () => {
  const memory = memoryAuthorityDb();
  const result = await serviceFor(memory).confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  assert.equal(memory.db.state.nameAuthority, null);
  assert.equal(result.authority.nameAuthority.status, 'unconfirmed');
  assert.equal(result.authority.confirmationSafe, false);
});

test('name confirmation requires a distinct explicit affirmation and prior durable contact authority', async () => {
  const memory = memoryAuthorityDb();
  const service = serviceFor(memory);
  await assert.rejects(
    service.confirmName({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, expectedContactValue: NORMALIZED_PHONE, confirmedName: 'Jane Smith', explicitlyConfirmed: true }),
    (error) => error?.code === 'OPERATOR_AUTHORITY_CONTACT_NOT_VERIFIED'
  );
  await service.confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  await assert.rejects(
    service.confirmName({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, expectedContactValue: NORMALIZED_PHONE, confirmedName: 'Jane Smith', explicitlyConfirmed: false }),
    (error) => error?.code === 'OPERATOR_AUTHORITY_NAME_AFFIRMATION_REQUIRED'
  );
  assert.equal(memory.db.state.nameAuthority, null);
});

test('separate name affirmation invokes existing authority semantics with explicit_client_confirmation and attributed staff actor', async () => {
  const memory = memoryAuthorityDb();
  const promoterCalls = [];
  const originalPromoter = memory.namePromoter;
  memory.namePromoter = async (...args) => { promoterCalls.push(args[1]); return originalPromoter(...args); };
  const service = serviceFor(memory);
  await service.confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  const result = await service.confirmName({
    actorAdminId: 2,
    clientId: CLIENT_ID,
    contactId: CONTACT_ID,
    expectedContactValue: NORMALIZED_PHONE,
    confirmedName: '  Jane   Smith ',
    explicitlyConfirmed: true,
  });
  assert.equal(result.evidenceType, 'explicit_client_confirmation');
  assert.equal(promoterCalls[0].name, 'Jane Smith');
  assert.equal(promoterCalls[0].evidenceType, 'explicit_client_confirmation');
  assert.equal(promoterCalls[0].actorType, 'staff');
  assert.equal(promoterCalls[0].actorReference, 'staff_admin:2');
  assert.equal(promoterCalls[0].evidenceReference.actorAdminId, 2);
  assert.equal(JSON.stringify(promoterCalls[0].evidenceReference).includes('Jane Smith'), false);
  assert.equal(memory.db.state.audits.at(-1).action, 'client.facing_name_explicitly_confirmed_by_operator');
  assert.equal(memory.db.state.audits.at(-1).actorAdminId, 2);
  assert.equal(result.authority.confirmationSafe, true);
  assert.equal(result.authority.stage, 'confirmation_safe');
});

test('existing name authority is superseded through the existing service boundary without destructive history rewrite', async () => {
  const prior = { id: 800, current_name: 'Prior Name', evidence_type: 'verified_registration_intake', promoted_at: '2026-08-25T08:00:00Z' };
  const memory = memoryAuthorityDb({
    contact: { verified_at: '2026-08-25T08:00:00Z' },
    verifications: [{ id: 701, client_id: CLIENT_ID, client_contact_id: CONTACT_ID, verification_method: 'operator_confirmed', status: 'active', verified_at: '2026-08-25T08:00:00Z', evidence_reference: {} }],
    nameAuthority: prior,
  });
  const result = await serviceFor(memory).confirmName({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, expectedContactValue: NORMALIZED_PHONE, confirmedName: 'Current Name', explicitlyConfirmed: true });
  assert.equal(prior.revoked_at, undefined);
  assert.equal(memory.db.state.nameAuthority.id, 801);
  assert.equal(memory.db.state.nameAuthority.current_name, 'Current Name');
  assert.equal(result.nameAuthorityId, 801);
});

test('failure after authority writes rolls the entire contact operation back', async () => {
  const memory = memoryAuthorityDb({ failOnAudit: true });
  await assert.rejects(
    serviceFor(memory).confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE }),
    /audit unavailable/
  );
  assert.equal(memory.db.state.contacts[0].verified_at, null);
  assert.equal(memory.db.state.verifications.length, 0);
  assert.equal(memory.db.state.audits.length, 0);
  assert.equal(memory.db.state.calls.some((call) => call.sql === 'ROLLBACK'), true);
});

test('failure after name promotion rolls name authority and its attributable audit back', async () => {
  const memory = memoryAuthorityDb({
    contact: { verified_at: '2026-08-25T08:00:00Z' },
    verifications: [{ id: 701, client_id: CLIENT_ID, client_contact_id: CONTACT_ID, verification_method: 'operator_confirmed', status: 'active', verified_at: '2026-08-25T08:00:00Z', evidence_reference: {} }],
    failOnAudit: true,
  });
  await assert.rejects(
    serviceFor(memory).confirmName({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, expectedContactValue: NORMALIZED_PHONE, confirmedName: 'Jane Smith', explicitlyConfirmed: true }),
    /audit unavailable/
  );
  assert.equal(memory.db.state.nameAuthority, null);
  assert.equal(memory.db.state.audits.length, 0);
});

test('PR #500 fail-closed consumer boundary becomes eligible only after exact contact and separate name authority', async () => {
  const memory = memoryAuthorityDb();
  const service = serviceFor(memory);
  assert.equal(pr500ConsumerEligible(memory.db.state), false);
  await service.confirmContact({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, confirmedValue: NORMALIZED_PHONE });
  assert.equal(pr500ConsumerEligible(memory.db.state), false);
  await service.confirmName({ actorAdminId: 2, clientId: CLIENT_ID, contactId: CONTACT_ID, expectedContactValue: NORMALIZED_PHONE, confirmedName: 'Jane Smith', explicitlyConfirmed: true });
  assert.equal(pr500ConsumerEligible(memory.db.state), true);

  const unverified = memoryAuthorityDb({ nameAuthority: { id: 801, current_name: 'Jane Smith', evidence_type: 'explicit_client_confirmation', promoted_at: '2026-08-26T12:00:00Z' } });
  assert.equal(pr500ConsumerEligible(unverified.db.state), false);
});

test('authority establishment contains no client message, provider call, schema mutation or second identity system', () => {
  const serviceSource = fs.readFileSync(path.join(ROOT, 'src/services/operatorContactAuthority.js'), 'utf8');
  const routeSource = fs.readFileSync(path.join(ROOT, 'src/routes/operatorContactAuthority.js'), 'utf8');
  const calendarRoute = fs.readFileSync(path.join(ROOT, 'src/routes/calendar.js'), 'utf8');
  assert.doesNotMatch(serviceSource, /sendWhatsApp|sendMessage|sendTemplate|provider|Meta|WABA/);
  assert.doesNotMatch(serviceSource, /CREATE TABLE|ALTER TABLE|DROP TABLE/);
  assert.match(serviceSource, /client_contacts/);
  assert.match(serviceSource, /client_identity_verifications/);
  assert.match(serviceSource, /client_facing_name_authorities/);
  assert.match(serviceSource, /crm_audit_events/);
  assert.match(serviceSource, /promoteClientFacingNameInTransaction/);
  assert.match(serviceSource, /exactPhoneCandidates/);
  assert.match(calendarRoute, /router\.use\('\/client-authority'/);
  assert.match(routeSource, /router\.post\('\/contact-confirm', sameOrigin, requireSession, requireCsrf/);
  assert.match(routeSource, /router\.post\('\/name-confirm', sameOrigin, requireSession, requireCsrf/);
  assert.doesNotMatch(routeSource, /req\.body\?\.(actorAdminId|adminId|role|businessRole)/);
});

test('operator UX visibly separates unverified, ambiguous, contact-confirmed, name-unconfirmed and fully safe states', () => {
  const ux = fs.readFileSync(path.join(ROOT, 'src/presentation/operatorContactAuthorityUx.js'), 'utf8');
  for (const phrase of [
    'Contact unverified',
    'Ambiguous/conflicting contact',
    'Contact confirmed — name still unconfirmed',
    'Fully confirmation-safe',
    'Confirm exact contact',
    'Separate client-name affirmation',
    'separately and explicitly confirmed',
  ]) assert.match(ux, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotThrow(() => new vm.Script(operatorContactAuthorityClientScript()));
});
