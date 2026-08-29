const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  completeCrmV2Onboarding,
} = require('../src/services/clientIdentityOnboarding');
const {
  createCrmV2ClientService,
} = require('../src/services/crmV2ClientService');
const {
  createWhatsAppCrmV2IdentityCompatService,
} = require('../src/services/whatsappCrmV2IdentityCompat');
const {
  appointmentIdentityColumns,
  bookingProfileComplete,
} = require('../src/services/whatsappBookingIdentity');

const ROOT = path.resolve(__dirname, '..');
const NOW = '2026-08-28T12:00:00.000Z';
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const clone = (value) => structuredClone(value);

class SyntheticCrmV2Repository {
  constructor(clients = []) {
    this.clients = clone(clients);
    this.nextId = this.clients.reduce((max, row) => Math.max(max, Number(row.id)), 0) + 1;
    this.calls = [];
  }

  async withTransaction(work) {
    const snapshot = clone({ clients: this.clients, nextId: this.nextId });
    try {
      return await work(this);
    } catch (error) {
      this.clients = snapshot.clients;
      this.nextId = snapshot.nextId;
      throw error;
    }
  }

  async lockNormalizedMobile(mobile) {
    this.calls.push(['lockNormalizedMobile', mobile]);
  }

  async findActiveByNormalizedMobile(mobile) {
    this.calls.push(['findActiveByNormalizedMobile', mobile]);
    return this.clients.filter((row) => row.status === 'active' && row.normalized_mobile === mobile).map(clone);
  }

  async insertClient(input) {
    this.calls.push(['insertClient', input.normalizedMobile]);
    const row = {
      id: this.nextId++,
      name: input.name,
      normalized_mobile: input.normalizedMobile,
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      profile_status: input.profileStatus,
      mobile_verified_at: input.mobileVerifiedAt,
      source: input.source,
      status: input.status,
      provenance: clone(input.provenance),
      created_at: NOW,
      updated_at: NOW,
    };
    this.clients.push(row);
    return clone(row);
  }

  async updateClient(id, patch) {
    this.calls.push(['updateClient', String(id)]);
    const row = this.clients.find((client) => String(client.id) === String(id));
    const fields = {
      name: 'name',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      profileStatus: 'profile_status',
      mobileVerifiedAt: 'mobile_verified_at',
      provenance: 'provenance',
    };
    for (const [key, value] of Object.entries(patch)) {
      if (fields[key]) row[fields[key]] = clone(value);
    }
    row.updated_at = NOW;
    return clone(row);
  }
}

function crmV2Row(id, mobile = '27821234567', profileStatus = 'registered') {
  return {
    id,
    name: 'Existing Canonical Client',
    normalized_mobile: mobile,
    date_of_birth: profileStatus === 'registered' ? '1990-05-14' : null,
    gender: profileStatus === 'registered' ? 'female' : null,
    profile_status: profileStatus,
    mobile_verified_at: NOW,
    source: 'calendar',
    status: 'active',
    provenance: { fixture: true },
    created_at: NOW,
    updated_at: NOW,
  };
}

function registrationSession(overrides = {}) {
  return {
    phone: '27821234567',
    client_id: null,
    crm_v2_client_id: null,
    identity_model: null,
    state: 'complete',
    pending_name: 'Sarah Smith',
    pending_contact: '27821234567',
    pending_date_of_birth: '1990-05-14',
    pending_gender: 'female',
    booking_requested: true,
    authority_version: 'verified_client_v3_crm_v2_fresh_registration',
    ...overrides,
  };
}

function persistenceFixture(initial) {
  let durable = clone(initial);
  const writes = [];
  return {
    writes,
    current: () => clone(durable),
    async persistSession(phone, patch) {
      writes.push({ phone, patch: clone(patch) });
      durable = {
        ...durable,
        phone,
        client_id: patch.clientId,
        crm_v2_client_id: patch.crmV2ClientId,
        identity_model: patch.identityModel,
        state: patch.state,
        authority_version: patch.authorityVersion,
      };
      return clone(durable);
    },
  };
}

function syntheticRuntime(repository) {
  const service = createCrmV2ClientService({ repository, clock: () => new Date(NOW) });
  const compat = createWhatsAppCrmV2IdentityCompatService({ resolveCrmV2ExactMobile: service.resolveExactMobile });
  return { service, compat };
}

test('new WhatsApp registration uses the canonical boundary, persists V2-only identity, then becomes booking-resumable', async () => {
  const repository = new SyntheticCrmV2Repository();
  const { service, compat } = syntheticRuntime(repository);
  const session = registrationSession();
  const persistence = persistenceFixture(session);
  const boundaryCalls = [];

  const completed = await completeCrmV2Onboarding('+27 (82) 123-4567', session, {
    registrationBoundary: async (input) => {
      boundaryCalls.push(clone(input));
      return service.registerWhatsAppClient(input);
    },
    persistSession: persistence.persistSession,
    revalidateSessionIdentity: compat.revalidateSessionIdentity,
    occurredAt: new Date(NOW),
  });

  assert.equal(boundaryCalls.length, 1);
  assert.deepEqual({
    senderMobile: boundaryCalls[0].senderMobile,
    name: boundaryCalls[0].name,
    dateOfBirth: boundaryCalls[0].dateOfBirth,
    gender: boundaryCalls[0].gender,
  }, {
    senderMobile: '+27 (82) 123-4567',
    name: 'Sarah Smith',
    dateOfBirth: '1990-05-14',
    gender: 'female',
  });
  assert.equal(repository.clients.length, 1);
  assert.deepEqual(persistence.current(), {
    ...session,
    phone: '+27 (82) 123-4567',
    client_id: null,
    crm_v2_client_id: '1',
    identity_model: 'crm_v2',
    state: 'complete',
  });
  assert.equal(completed.clientIdentity.identityModel, 'crm_v2');
  assert.equal(completed.clientIdentity.legacyClientId, null);
  assert.equal(completed.clientIdentity.crmV2ClientId, '1');
  assert.equal(completed.session.booking_requested, true);
  assert.equal(completed.identityAudit.identityModel, 'crm_v2');
  assert.equal(bookingProfileComplete(completed.clientIdentity, completed.client), true);
  assert.deepEqual(appointmentIdentityColumns(completed.clientIdentity, completed.client), {
    clientId: null,
    crmV2ClientId: '1',
    sourceClientName: 'Sarah Smith',
  });
});

test('exact-mobile registration updates the same CRM V2 client instead of duplicating it', async () => {
  const repository = new SyntheticCrmV2Repository([crmV2Row(912, '27821234567', 'minimal')]);
  const { service, compat } = syntheticRuntime(repository);
  const session = registrationSession({
    crm_v2_client_id: 912,
    identity_model: 'crm_v2',
  });
  const persistence = persistenceFixture(session);

  const completed = await completeCrmV2Onboarding('082 123 4567', session, {
    registrationBoundary: service.registerWhatsAppClient,
    persistSession: persistence.persistSession,
    revalidateSessionIdentity: compat.revalidateSessionIdentity,
    occurredAt: new Date(NOW),
  });

  assert.equal(completed.status, 'registered');
  assert.equal(completed.clientIdentity.crmV2ClientId, '912');
  assert.equal(repository.clients.length, 1);
  assert.equal(repository.clients[0].profile_status, 'registered');
  assert.equal(repository.clients[0].name, 'Sarah Smith');
});

test('server-derived exact-mobile state replaces carried registration snapshots before downstream use', async () => {
  const session = registrationSession();
  const persistence = persistenceFixture(session);
  const canonical = {
    id: '44',
    name: 'Canonical Server Name',
    normalizedMobile: '27821234567',
    profileStatus: 'registered',
    status: 'active',
  };
  const completed = await completeCrmV2Onboarding('27821234567', session, {
    registrationBoundary: async () => ({ status: 'created', client: { ...canonical, name: 'Carried Name Must Not Win' } }),
    persistSession: persistence.persistSession,
    revalidateSessionIdentity: async ({ session: durable }) => ({
      status: 'crm_v2_current',
      identity: { identityModel: 'crm_v2', crmV2ClientId: String(durable.crm_v2_client_id) },
      client: canonical,
      audit: { identityModel: 'crm_v2', resolution: 'synthetic_exact_mobile' },
    }),
    occurredAt: new Date(NOW),
  });
  assert.equal(completed.client.name, 'Canonical Server Name');
  assert.equal(completed.client.normalizedMobile, '27821234567');
});

test('ambiguous exact-mobile authority fails before durable identity persistence', async () => {
  const repository = new SyntheticCrmV2Repository([crmV2Row(912), crmV2Row(913)]);
  const { service, compat } = syntheticRuntime(repository);
  const persistence = persistenceFixture(registrationSession());
  await assert.rejects(
    () => completeCrmV2Onboarding('27821234567', registrationSession(), {
      registrationBoundary: service.registerWhatsAppClient,
      persistSession: persistence.persistSession,
      revalidateSessionIdentity: compat.revalidateSessionIdentity,
      occurredAt: new Date(NOW),
    }),
    (error) => error.code === 'CRM_V2_IDENTITY_CONFLICT'
  );
  assert.equal(persistence.writes.length, 0);
  assert.equal(repository.clients.length, 2);
});

test('missing, stale or different-owner durable authority fails closed before continuation', async () => {
  for (const status of ['crm_v2_stale', 'crm_v2_conflict']) {
    let boundaryCalls = 0;
    let persistenceCalls = 0;
    const session = registrationSession({ crm_v2_client_id: 912, identity_model: 'crm_v2' });
    await assert.rejects(
      () => completeCrmV2Onboarding('27821234567', session, {
        registrationBoundary: async () => { boundaryCalls += 1; return { status: 'updated', client: { id: '912' } }; },
        persistSession: async () => { persistenceCalls += 1; },
        revalidateSessionIdentity: async () => ({ status }),
      }),
      (error) => error.code === 'CRM_V2_AUTHORITY_STALE'
    );
    assert.equal(boundaryCalls, 0);
    assert.equal(persistenceCalls, 0);
  }

  const session = registrationSession({ crm_v2_client_id: 912, identity_model: 'crm_v2' });
  await assert.rejects(
    () => completeCrmV2Onboarding('27821234567', session, {
      registrationBoundary: async () => ({ status: 'updated', client: { id: '913' } }),
      persistSession: async () => { throw new Error('must not persist different owner'); },
      revalidateSessionIdentity: async () => ({ status: 'crm_v2_current' }),
    }),
    (error) => error.code === 'CRM_V2_AUTHORITY_STALE'
  );
});

test('booking continuation is impossible when durable V2 persistence fails', async () => {
  let postPersistenceAuthorityChecks = 0;
  await assert.rejects(
    () => completeCrmV2Onboarding('27821234567', registrationSession(), {
      registrationBoundary: async () => ({ status: 'created', client: { id: '77' } }),
      persistSession: async () => { throw new Error('synthetic persistence failure'); },
      revalidateSessionIdentity: async () => { postPersistenceAuthorityChecks += 1; return { status: 'crm_v2_current' }; },
    }),
    /synthetic persistence failure/
  );
  assert.equal(postPersistenceAuthorityChecks, 0);
});

test('activation retires the unbound legacy master write and keeps the retained legacy path explicit', () => {
  const onboarding = read('src/services/clientIdentityOnboarding.js');
  const v2Start = onboarding.indexOf('async function completeCrmV2Onboarding');
  const activeStart = onboarding.indexOf('async function processActiveSession', v2Start);
  const v2Completion = onboarding.slice(v2Start, activeStart);
  assert.match(v2Completion, /registrationBoundary = registerWhatsAppClient/);
  assert.match(v2Completion, /clientId: null/);
  assert.match(v2Completion, /identityModel: IDENTITY_MODELS\.CRM_V2/);
  assert.doesNotMatch(v2Completion, /(?:INSERT INTO|UPDATE) (?:clients|client_contacts)/i);
  assert.doesNotMatch(onboarding, /INSERT INTO clients \(date_of_birth,custom_attributes,source\)/);
  assert.match(onboarding, /completeLegacyOnboarding/);
  assert.match(onboarding, /durableIdentity\?\.identityModel !== IDENTITY_MODELS\.LEGACY/);
  assert.match(onboarding, /isVerifiedRegistration\(identity\)[\s\S]*legacy_verified_whatsapp/);
});

test('activation migration remains present and startup truth is active', () => {
  const migrations = fs.readdirSync(path.join(ROOT, 'migrations')).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  const app = read('app.js');
  assert.equal(migrations.includes('087_whatsapp_crm_v2_reschedule_compat.sql'), true);
  assert.match(app, /crmV2RegistrationActive: true/);
  assert.match(app, /registrationBoundary: 'crmV2ClientService\.registerWhatsAppClient'/);
  assert.doesNotMatch(app, /CRM_V2_REGISTRATION_(?:ENABLED|ACTIVE)|WHATSAPP_CRM_V2_(?:ENABLED|ACTIVE)/);
});

test('Couples, packages and enquiries retain their explicit CRM V2 fail-closed boundaries', () => {
  const couples = read('src/services/clientCouplesMassageBooking.js');
  const packages = read('src/services/clientDiscoveryPackages.js');
  assert.match(couples, /crm_v2_couples_legacy_boundary/);
  assert.match(packages, /crm_v2_package_legacy_boundary/);
  assert.match(packages, /crm_v2_enquiry_legacy_boundary/);
});
