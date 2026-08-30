const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const poolModule = require('../src/db/pool');
const {
  AUTHORITY_VERSION,
  extractWhatsAppRegistration,
  normalizePersistedDateOfBirth,
  normalizeOnboardingSessionRow,
  getSession,
  saveSession,
  completeCrmV2Onboarding,
} = require('../src/services/clientIdentityOnboarding');

const PHONE = '27821234567';
const CANONICAL_DOB = '1990-05-14';
const DATE_ONLY_SQL = "TO_CHAR(pending_date_of_birth, 'YYYY-MM-DD') AS pending_date_of_birth";

test('friendly WhatsApp registration DOB remains canonicalized before persistence', () => {
  const parsed = extractWhatsAppRegistration('Sarah Smith, 14 May 1990, Female');
  assert.equal(parsed.dateOfBirth, CANONICAL_DOB);
});

test('persisted canonical text remains unchanged and null remains null', () => {
  assert.equal(normalizePersistedDateOfBirth(CANONICAL_DOB), CANONICAL_DOB);
  assert.equal(normalizePersistedDateOfBirth(null), null);
});

test('timezone-bearing Date values and malformed persisted DOB representations fail closed', () => {
  for (const value of [
    new Date('1990-05-14T00:00:00.000Z'),
    new Date(1990, 4, 14),
    new Date('invalid'),
    '14/05/1990',
    '1990-02-31',
    '',
    undefined,
    {},
  ]) {
    assert.throws(
      () => normalizeOnboardingSessionRow({ pending_date_of_birth: value }),
      (error) => error.code === 'ONBOARDING_PERSISTED_DATE_OF_BIRTH_INVALID'
    );
  }
});

test('canonical persisted DOB is identical in UTC and Africa/Johannesburg runtimes', () => {
  const modulePath = require.resolve('../src/services/clientIdentityOnboarding');
  const script = [
    `const { normalizePersistedDateOfBirth } = require(${JSON.stringify(modulePath)});`,
    `process.stdout.write(normalizePersistedDateOfBirth('${CANONICAL_DOB}'));`,
  ].join(' ');

  for (const timezone of ['UTC', 'Africa/Johannesburg']) {
    const output = execFileSync(process.execPath, ['-e', script], {
      encoding: 'utf8',
      env: { ...process.env, TZ: timezone },
    });
    assert.equal(output, CANONICAL_DOB, `DOB changed under TZ=${timezone}`);
  }
});

test('save and restart use a date-only SQL boundary and complete CRM V2 registration', async (t) => {
  const originalQuery = poolModule.pool.query;
  const observedSql = [];
  let durable = {
    phone: PHONE,
    client_id: null,
    crm_v2_client_id: null,
    identity_model: null,
    state: 'complete',
    pending_name: 'Sarah Smith',
    pending_contact: PHONE,
    pending_date_of_birth: CANONICAL_DOB,
    pending_gender: 'female',
    booking_requested: true,
    authority_version: AUTHORITY_VERSION,
    created_at: new Date('2026-08-30T08:00:00.000Z'),
    updated_at: new Date('2026-08-30T08:00:00.000Z'),
  };

  t.after(() => {
    poolModule.pool.query = originalQuery;
  });

  poolModule.pool.query = async (sql, params = []) => {
    if (/^ALTER TABLE client_onboarding_sessions /.test(sql)) return { rows: [], rowCount: 0 };
    observedSql.push(sql);
    if (/^SELECT phone,client_id,crm_v2_client_id,identity_model,state/.test(sql)) {
      assert.match(sql, new RegExp(DATE_ONLY_SQL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      return { rows: [structuredClone(durable)], rowCount: 1 };
    }
    if (/^INSERT INTO client_onboarding_sessions /.test(sql)) {
      assert.match(sql, new RegExp(DATE_ONLY_SQL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.doesNotMatch(sql, /RETURNING\s+\*/);
      durable = {
        ...durable,
        phone: params[0],
        client_id: params[1],
        crm_v2_client_id: params[2],
        identity_model: params[3],
        state: params[4],
        pending_name: params[5],
        pending_contact: params[6],
        pending_date_of_birth: params[7],
        pending_gender: params[8],
        booking_requested: params[9],
        authority_version: params[10],
        updated_at: new Date('2026-08-30T08:01:00.000Z'),
      };
      return { rows: [structuredClone(durable)], rowCount: 1 };
    }
    throw new Error(`Unexpected synthetic SQL: ${String(sql).slice(0, 80)}`);
  };

  const parsed = extractWhatsAppRegistration('Sarah Smith, 14 May 1990, Female');
  const saved = await saveSession(PHONE, {
    pendingName: parsed.fullName,
    pendingDateOfBirth: parsed.dateOfBirth,
    pendingGender: parsed.gender,
    state: 'complete',
    bookingRequested: true,
  });
  assert.equal(saved.pending_date_of_birth, CANONICAL_DOB);

  const resumed = await getSession(PHONE);
  assert.equal(resumed.pending_date_of_birth, CANONICAL_DOB);

  const boundaryCalls = [];
  const completed = await completeCrmV2Onboarding(PHONE, resumed, {
    registrationBoundary: async (input) => {
      boundaryCalls.push(structuredClone(input));
      return {
        status: 'created',
        client: {
          id: '77',
          name: input.name,
          normalizedMobile: PHONE,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          profileStatus: 'registered',
          status: 'active',
        },
      };
    },
    persistSession: saveSession,
    revalidateSessionIdentity: async ({ session }) => ({
      status: 'crm_v2_current',
      identity: { identityModel: 'crm_v2', crmV2ClientId: String(session.crm_v2_client_id) },
      client: {
        id: String(session.crm_v2_client_id),
        name: session.pending_name,
        normalizedMobile: PHONE,
        dateOfBirth: session.pending_date_of_birth,
        gender: session.pending_gender,
        profileStatus: 'registered',
        status: 'active',
      },
      audit: { identityModel: 'crm_v2', resolution: 'synthetic_exact_mobile' },
    }),
    occurredAt: new Date('2026-08-30T08:02:00.000Z'),
  });

  assert.equal(boundaryCalls.length, 1);
  assert.equal(boundaryCalls[0].dateOfBirth, CANONICAL_DOB);
  assert.equal(completed.session.pending_date_of_birth, CANONICAL_DOB);
  assert.equal(completed.clientIdentity.identityModel, 'crm_v2');
  assert.equal(completed.clientIdentity.crmV2ClientId, '77');
  assert.equal(completed.session.booking_requested, true);

  const selectSql = observedSql.find((sql) => /^SELECT phone,client_id,crm_v2_client_id,identity_model,state/.test(sql));
  const insertSql = observedSql.find((sql) => /^INSERT INTO client_onboarding_sessions /.test(sql));
  assert.ok(selectSql);
  assert.ok(insertSql);
  assert.match(selectSql, /TO_CHAR\(pending_date_of_birth, 'YYYY-MM-DD'\) AS pending_date_of_birth/);
  assert.match(insertSql, /RETURNING phone,client_id,crm_v2_client_id,identity_model,state,pending_name,pending_contact,TO_CHAR\(pending_date_of_birth, 'YYYY-MM-DD'\) AS pending_date_of_birth/);
});
