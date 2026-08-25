const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  EVIDENCE_TYPES,
  resolveClientFacingName,
  resolveClientFacingNameByPhone,
  promoteClientFacingNameInTransaction,
} = require('../src/services/clientFacingNameAuthority');

const root = path.join(__dirname, '..');
function source(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

test('migration 080 creates separate alias/current-name stores with zero heuristic promotion', () => {
  const sql = source('migrations/080_client_facing_name_authority.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS client_name_aliases/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS client_facing_name_authorities/);
  assert.match(sql, /uq_client_facing_name_one_active/);
  assert.match(sql, /explicit_client_confirmation/);
  assert.match(sql, /verified_registration_intake/);
  assert.match(sql, /audited_staff_correction/);
  assert.match(sql, /pre_authority_display_name/);
  assert.match(sql, /goldie_import/);
  assert.doesNotMatch(sql, /INSERT\s+INTO\s+client_facing_name_authorities/i);
  assert.doesNotMatch(sql, /UPDATE\s+clients\b/i);
  assert.doesNotMatch(sql, /UPDATE\s+appointments\b/i);
  assert.doesNotMatch(sql, /Ma Marinda/i);
});

test('resolver returns only active evidence-backed authority and otherwise neutral', async () => {
  const authoritativeDb = {
    async query(sql, values) {
      assert.match(sql, /client_facing_name_authorities/);
      assert.deepEqual(values, [42]);
      return { rowCount: 1, rows: [{ id: 9, current_name: 'Marinda Example', evidence_type: 'verified_registration_intake', promoted_at: '2026-08-25T08:00:00Z' }] };
    },
  };
  const resolved = await resolveClientFacingName(42, authoritativeDb);
  assert.equal(resolved.status, 'authoritative');
  assert.equal(resolved.name, 'Marinda Example');
  assert.equal(resolved.authorityId, 9);

  const neutral = await resolveClientFacingName(42, { async query() { return { rowCount: 0, rows: [] }; } });
  assert.equal(neutral.status, 'neutral');
  assert.equal(neutral.name, null);
  assert.equal(neutral.authorityId, null);
});

test('phone resolver fails closed on ambiguous canonical ownership', async () => {
  let calls = 0;
  const result = await resolveClientFacingNameByPhone('082 000 0000', {
    async query(sql) {
      calls += 1;
      assert.match(sql, /client_contacts/);
      return { rowCount: 2, rows: [{ id: 1 }, { id: 2 }] };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.name, null);
});

test('promotion rejects unauthorized evidence and unattributed staff correction before database mutation', async () => {
  const neverDb = { async query() { throw new Error('database must not be touched'); } };
  await assert.rejects(
    promoteClientFacingNameInTransaction(neverDb, {
      clientId: 1,
      name: 'Valid Name',
      evidenceType: 'goldie_import',
      evidenceReference: { source: 'goldie' },
      actorType: 'system',
    }),
    (error) => error.code === 'CLIENT_FACING_NAME_EVIDENCE_NOT_AUTHORIZED'
  );
  await assert.rejects(
    promoteClientFacingNameInTransaction(neverDb, {
      clientId: 1,
      name: 'Valid Name',
      evidenceType: EVIDENCE_TYPES.AUDITED_STAFF_CORRECTION,
      evidenceReference: { directEvidence: 'intake_form_123' },
      actorType: 'staff',
      actorReference: '',
    }),
    (error) => error.code === 'CLIENT_FACING_NAME_STAFF_EVIDENCE_REQUIRED'
  );
});

test('verified registration promotion preserves compatibility label as alias then projects authoritative name', async () => {
  const calls = [];
  const db = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (/SELECT id,display_name FROM clients/.test(sql)) return { rowCount: 1, rows: [{ id: 7, display_name: 'Imported Label' }] };
      if (/SELECT id,current_name,evidence_type,promoted_at/.test(sql)) return { rowCount: 0, rows: [] };
      if (/INSERT INTO client_name_aliases/.test(sql)) return { rowCount: 1, rows: [{ id: 11 }] };
      if (/INSERT INTO client_facing_name_authorities/.test(sql)) return { rowCount: 1, rows: [{ id: 12, current_name: 'Confirmed Name', evidence_type: EVIDENCE_TYPES.VERIFIED_REGISTRATION_INTAKE, promoted_at: '2026-08-25T08:00:00Z' }] };
      if (/UPDATE clients SET display_name/.test(sql)) return { rowCount: 1, rows: [] };
      if (/INSERT INTO crm_audit_events/.test(sql)) return { rowCount: 1, rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const result = await promoteClientFacingNameInTransaction(db, {
    clientId: 7,
    name: 'Confirmed Name',
    evidenceType: EVIDENCE_TYPES.VERIFIED_REGISTRATION_INTAKE,
    evidenceReference: { verificationId: 55, channel: 'whatsapp' },
    actorType: 'client',
    actorReference: 'whatsapp_registration',
  });
  assert.equal(result.name, 'Confirmed Name');
  assert.equal(result.authorityId, 12);
  const aliasIndex = calls.findIndex(({ sql }) => /INSERT INTO client_name_aliases/.test(sql));
  const authorityIndex = calls.findIndex(({ sql }) => /INSERT INTO client_facing_name_authorities/.test(sql));
  const projectionIndex = calls.findIndex(({ sql }) => /UPDATE clients SET display_name/.test(sql));
  assert.ok(aliasIndex >= 0 && authorityIndex > aliasIndex && projectionIndex > authorityIndex);
});

test('verified intake is the onboarding name authority write; onboarding does not independently overwrite display_name', () => {
  const js = source('src/services/clientIdentityOnboarding.js');
  assert.match(js, /promoteClientFacingNameInTransaction/);
  assert.match(js, /EVIDENCE_TYPES\.VERIFIED_REGISTRATION_INTAKE/);
  assert.doesNotMatch(js, /UPDATE clients SET display_name/);
  assert.doesNotMatch(js, /INSERT INTO clients \(display_name/);
  assert.doesNotMatch(js, /Ma Marinda/i);
});

test('outbound Calendar, confirmations, reminders and follow-ups converge on centralized resolver', () => {
  const lifecycle = source('src/services/appointmentLifecycle.js');
  assert.match(lifecycle, /resolveClientFacingNameByPhone/);
  assert.doesNotMatch(lifecycle, /getProfile/);

  const confirmation = source('src/services/customerBookingConfirmation.js');
  assert.match(confirmation, /resolveClientFacingName/);
  assert.doesNotMatch(confirmation, /c\.display_name AS client_name/);

  const calendar = source('src/services/googleBookingCalendar.js');
  assert.match(calendar, /resolveClientFacingNameForAppointment/);
  assert.match(calendar, /authoritativeCalendarData/);

  const changes = source('src/services/customerChangeNotification.js');
  assert.match(changes, /resolveClientFacingName/);
  assert.doesNotMatch(changes, /COALESCE\(c\.display_name,a\.source_client_name/);

  const reschedule = source('src/services/clientRescheduleApprovedNotification.js');
  assert.match(reschedule, /resolveClientFacingName/);
  assert.doesNotMatch(reschedule, /COALESCE\(client\.display_name,appointment\.source_client_name/);

  const care = source('src/services/customerCare.js');
  assert.match(care, /resolveClientFacingName/);
  assert.doesNotMatch(care, /SELECT c\.id,c\.display_name/);
});

test('admin lookup searches aliases but does not turn an alias into name authority', () => {
  const lookup = source('src/services/adminClientLookup.js');
  assert.match(lookup, /client_name_aliases alias_search/);
  assert.match(lookup, /client_facing_name_authorities authority_search/);
  assert.match(lookup, /Search\/provenance aliases do not establish the current client-facing name/i);
  assert.doesNotMatch(lookup, /INSERT INTO client_facing_name_authorities/);
});

test('startup verifies migration 080 before application process', () => {
  const pkg = JSON.parse(source('package.json'));
  const start = pkg.scripts.start;
  assert.match(start, /ensure-client-identity-verification\.js && node scripts\/ensure-client-facing-name-authority\.js/);
  const guard = source('scripts/ensure-client-facing-name-authority.js');
  assert.match(guard, /080_client_facing_name_authority\.sql/);
  assert.match(guard, /checksumVerified/);
  assert.match(guard, /heuristicPromotionPerformed: false/);
});
