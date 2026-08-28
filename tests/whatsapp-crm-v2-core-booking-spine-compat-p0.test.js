const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

const {
  createWhatsAppBookingIdentityService,
  bookingProfileComplete,
  resolveFinalBookingIdentity,
  appointmentIdentityColumns,
} = require('../src/services/whatsappBookingIdentity');
const {
  createLegacyIdentity,
  createCrmV2Identity,
} = require('../src/services/whatsappCrmV2IdentityCompat');
const { insertOrdinaryClientAppointment } = require('../src/services/clientBookingCommit');

function v2Client(id = '912', overrides = {}) {
  return {
    id,
    name: 'Synthetic V2 Client',
    normalizedMobile: '27821234567',
    dateOfBirth: null,
    gender: null,
    profileStatus: 'minimal',
    mobileVerifiedAt: '2026-08-28T10:00:00.000Z',
    source: 'staff',
    status: 'active',
    provenance: { fixture: true },
    createdAt: '2026-08-28T09:00:00.000Z',
    updatedAt: '2026-08-28T09:00:00.000Z',
    ...overrides,
  };
}

function repositoryRow(id = '912', overrides = {}) {
  return {
    id,
    name: 'Server Canonical Name',
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

function finalAuthorityDb(rows) {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params });
      if (/pg_advisory_xact_lock/.test(sql)) return { rows: [], rowCount: 1 };
      if (/FROM crm_v2_clients/.test(sql)) return { rows, rowCount: rows.length };
      if (/INSERT INTO appointments/.test(sql)) return { rows: [{ id: 7001, starts_at: params[4], ends_at: params[5], status: 'scheduled' }], rowCount: 1 };
      throw new Error(`Unexpected synthetic query: ${sql}`);
    },
  };
}

test('durable CRM V2 onboarding identity resumes only through exact-mobile revalidation', async () => {
  const service = createWhatsAppBookingIdentityService({
    queryable: { query: async () => ({ rows: [{ phone: '27821234567', client_id: null, crm_v2_client_id: 912, identity_model: 'crm_v2', state: 'complete' }] }) },
    resolveLegacyAuthority: async () => { throw new Error('legacy resolver must not run'); },
    crmV2Compat: {
      revalidateSessionIdentity: async () => ({
        status: 'crm_v2_current',
        client: v2Client(),
        audit: { identityModel: 'crm_v2', identityResolution: 'crm_v2_restart_exact_mobile' },
      }),
    },
  });
  const result = await service.resolveByPhone('082 123 4567');
  assert.equal(result.status, 'unique');
  assert.equal(result.clientIdentity.identityModel, 'crm_v2');
  assert.equal(result.clientIdentity.legacyClientId, null);
  assert.equal(result.clientIdentity.crmV2ClientId, '912');
  assert.equal(result.client.display_name, 'Synthetic V2 Client');
  assert.equal(result.client.normalized_value, '27821234567');
  assert.equal(result.bookingReady, true, 'a canonical minimal V2 client is booking-valid');
});

test('legacy identity resolution and profile completeness remain compatible', async () => {
  const legacyClient = { id: 41, display_name: 'Legacy Client', normalized_value: '27821234567', date_of_birth: '1990-01-01' };
  const service = createWhatsAppBookingIdentityService({
    queryable: { query: async () => ({ rows: [] }) },
    resolveLegacyAuthority: async () => ({ status: 'verified_client', client: legacyClient }),
  });
  const result = await service.resolveByPhone('27821234567');
  assert.equal(result.status, 'unique');
  assert.equal(result.clientIdentity.identityModel, 'legacy');
  assert.equal(result.clientIdentity.legacyClientId, '41');
  assert.equal(result.clientIdentity.crmV2ClientId, null);
  assert.equal(bookingProfileComplete(result.clientIdentity, result.client), true);
});

test('final CRM V2 authority is locked, exact-mobile resolved, and server-derived', async () => {
  const db = finalAuthorityDb([repositoryRow()]);
  const carried = createCrmV2Identity(912);
  const result = await resolveFinalBookingIdentity({ db, phone: '082 123 4567', identity: carried });
  assert.equal(result.status, 'ready');
  assert.equal(result.client.name, 'Server Canonical Name');
  assert.equal(result.client.normalizedMobile, '27821234567');
  assert.match(result.audit.identityResolution, /final_exact_mobile_locked/);
  assert.ok(db.queries.some(({ sql }) => /pg_advisory_xact_lock/.test(sql)));
  assert.ok(db.queries.some(({ sql }) => /status='active'/.test(sql) && /FOR UPDATE/.test(sql)));

  const columns = appointmentIdentityColumns(result.identity, result.client);
  assert.deepEqual(columns, { clientId: null, crmV2ClientId: '912', sourceClientName: 'Server Canonical Name' });

  const appointment = await insertOrdinaryClientAppointment(
    db,
    columns,
    3,
    new Date('2026-09-15T08:00:00.000Z'),
    new Date('2026-09-15T09:00:00.000Z'),
    'Synthetic Ordinary Massage',
    500,
  );
  assert.equal(appointment.id, 7001);
  const insert = db.queries.find(({ sql }) => /INSERT INTO appointments/.test(sql));
  assert.deepEqual(insert.params.slice(0, 3), [null, '912', 'Server Canonical Name']);
  assert.equal(db.queries.some(({ sql }) => /INSERT INTO (?:clients|client_contacts)/.test(sql)), false);
});

test('missing, stale and ambiguous final CRM V2 ownership fail before any appointment write', async () => {
  for (const [rows, expected] of [
    [[], 'crm_v2_stale'],
    [[repositoryRow('913')], 'crm_v2_stale'],
    [[repositoryRow('912'), repositoryRow('913')], 'crm_v2_conflict'],
  ]) {
    const db = finalAuthorityDb(rows);
    const result = await resolveFinalBookingIdentity({ db, phone: '27821234567', identity: createCrmV2Identity(912) });
    assert.equal(result.status, expected);
    assert.equal(db.queries.some(({ sql }) => /INSERT INTO appointments/i.test(sql)), false);
  }
});

test('appointment identity projection is XOR for both models', () => {
  assert.deepEqual(
    appointmentIdentityColumns(createLegacyIdentity(41), { display_name: 'Legacy Client' }),
    { clientId: '41', crmV2ClientId: null, sourceClientName: 'Legacy Client' },
  );
  assert.deepEqual(
    appointmentIdentityColumns(createCrmV2Identity(912), { name: 'V2 Client' }),
    { clientId: null, crmV2ClientId: '912', sourceClientName: 'V2 Client' },
  );
});

test('ordinary commit carries the discriminator and writes no shadow client/contact', () => {
  const commit = read('src/services/clientBookingCommit.js');
  assert.match(commit, /resolveWhatsAppBookingIdentity/);
  assert.match(commit, /resolveFinalBookingIdentity/);
  assert.match(commit, /appointmentIdentityColumns/);
  assert.match(commit, /\(client_id, crm_v2_client_id, source_client_name, location_id/);
  assert.match(commit, /clientId: canonical\.client_id/);
  assert.match(commit, /crmV2ClientId: canonical\.crm_v2_client_id/);
  assert.doesNotMatch(commit, /INSERT INTO (?:clients|client_contacts|crm_v2_clients)/);
});

test('practitioner approval preserves CRM V2 identity and server-owned notification snapshots', () => {
  const approval = read('src/services/clientBookingApproval.js');
  assert.match(approval, /a\.client_id,a\.crm_v2_client_id/);
  assert.match(approval, /CASE WHEN a\.crm_v2_client_id IS NOT NULL THEN 'crm_v2'/);
  assert.match(approval, /COALESCE\(v2\.name,c\.display_name,a\.source_client_name\)/);
  assert.match(approval, /v2\.normalized_mobile/);
  assert.match(approval, /sendCustomerBookingConfirmationForAppointment/);
  assert.match(approval, /crmV2ClientId: locked\.crm_v2_client_id/);
  assert.doesNotMatch(approval, /INSERT INTO (?:clients|client_contacts)/);
});

test('confirmation and lifecycle reuse live 085 CRM V2 snapshot seams', () => {
  const confirmation = read('src/services/customerBookingConfirmation.js');
  const reminderConfirmation = read('src/services/appointmentReminderConfirmation.js');
  const changeNotification = read('src/services/customerChangeNotification.js');
  assert.match(confirmation, /a\.crm_v2_client_id/);
  assert.match(confirmation, /recipient_mobile/);
  assert.match(confirmation, /client_name_snapshot/);
  assert.match(confirmation, /crmV2ClientId:authority\.crm_v2_client_id/);
  assert.match(confirmation, /enrollLifecycle/);
  assert.match(reminderConfirmation, /v2\.normalized_mobile=\$1/);
  assert.match(reminderConfirmation, /resolveFinalBookingIdentity/);
  assert.match(changeNotification, /a\.crm_v2_client_id/);
  assert.match(changeNotification, /v2\.normalized_mobile/);
});

test('appointment management supports V2 lookup and cancellation but explicitly bounds legacy-only reschedule', () => {
  const change = read('src/services/appointmentChange.js');
  const actions = read('src/services/customerAppointmentActions.js');
  const templateDelivery = read('src/services/appointmentChangeTemplateDelivery.js');
  assert.match(change, /v2\.normalized_mobile=\$1/);
  assert.match(change, /resolveFinalBookingIdentity/);
  assert.match(change, /crm_v2_reschedule_legacy_boundary/);
  assert.match(change, /CRM_V2_LEGACY_ONLY_BOUNDARY_REPLY/);
  assert.match(actions, /a\.crm_v2_client_id/);
  assert.match(actions, /v2\.normalized_mobile=\$2/);
  assert.match(templateDelivery, /v2\.normalized_mobile=\$1/);
  assert.doesNotMatch(templateDelivery, /a\.client_id IS NULL\)/);
  assert.doesNotMatch(`${change}\n${actions}\n${templateDelivery}`, /INSERT INTO (?:clients|client_contacts)/);
});

test('Couples, package entitlement and enquiry legacy-only branches fail closed for CRM V2', () => {
  const couples = read('src/services/clientCouplesMassageBooking.js');
  const packages = read('src/services/clientDiscoveryPackages.js');
  assert.match(couples, /crm_v2_couples_legacy_boundary/);
  assert.match(packages, /crm_v2_package_legacy_boundary/);
  assert.match(packages, /crm_v2_enquiry_legacy_boundary/);
  const record = packages.match(/async function recordEnquiry[\s\S]*?async function businessAdmin/)[0];
  assert.ok(record.indexOf('unsupportedIdentityModel') < record.indexOf('INSERT INTO package_enquiries'));
});

test('CRM V2 WhatsApp registration is active only in onboarding runtime', () => {
  const onboarding = read('src/services/clientIdentityOnboarding.js');
  const bookingIdentity = read('src/services/whatsappBookingIdentity.js');
  assert.match(onboarding, /registerWhatsAppClient/);
  assert.doesNotMatch(onboarding, /INSERT INTO clients \(date_of_birth,custom_attributes,source\)/);
  assert.doesNotMatch(bookingIdentity, /registerWhatsAppClient\s*\(/);
  assert.doesNotMatch(bookingIdentity, /INSERT INTO (?:clients|client_contacts|crm_v2_clients)/);
});

test('the later reschedule compatibility unit owns the next bounded migration', () => {
  const migrations = fs.readdirSync(path.join(root, 'migrations')).filter((name) => /^\d+_/.test(name)).sort();
  assert.equal(migrations.at(-1), '087_whatsapp_crm_v2_reschedule_compat.sql');
});
