const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const recovery = fs.readFileSync(path.join(root, 'src/services/augustGoldieRecovery.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('recovery is constrained to the nine audited Goldie rows and seven real bookings', () => {
  for (const id of ['1725','1727','1734','1735','1736','1741','1755','1774','1775']) assert.match(recovery, new RegExp(`'${id}'`));
  assert.match(recovery, /REAL_BOOKING_IDS = new Set\(\['1725','1727','1734','1735','1736','1741','1755'\]\)/);
  assert.match(recovery, /Expected \$\{TARGET_IDS\.length\} audited Goldie rows/);
});

test('ambiguous legacy contacts create distinct non-contactable identities rather than unsafe merges', () => {
  assert.match(recovery, /duplicate_goldie_primary_phone/);
  assert.match(recovery, /contact_unverified:true,outbound_contact_authorized:false/);
  assert.match(recovery, /august_booking_recovery_distinct_identity/);
  assert.doesNotMatch(recovery, /INSERT INTO client_contacts/i);
  assert.match(recovery, /appeared after audit; refusing duplicate creation/);
  assert.match(recovery, /JOIN client_reconciliation_queue/);
  assert.doesNotMatch(recovery, /LEFT JOIN client_reconciliation_queue/);
});

test('Gwendie is linked to existing appointment 552 and Personal becomes a calendar block', () => {
  assert.match(recovery, /GWENDIE_APPOINTMENT_ID = '552'/);
  assert.match(recovery, /august_goldie_duplicate_link/);
  assert.match(recovery, /INSERT INTO calendar_blocks/);
  assert.match(recovery, /'personal_event'/);
  assert.match(recovery, /august_goldie_personal_block_recovery/);
});

test('appointment recovery is transactional, idempotent and preserves unmatched historical service snapshots', () => {
  assert.match(recovery, /await db\.query\('BEGIN'\)/);
  assert.match(recovery, /await db\.query\('COMMIT'\)/);
  assert.match(recovery, /await db\.query\('ROLLBACK'\)/);
  assert.match(recovery, /WHERE source='goldie' AND external_id=\$1 FOR UPDATE/);
  assert.match(recovery, /service\?\.id\|\|null/);
  assert.match(recovery, /service\?\.name\|\|serviceNames\[i\]/);
  assert.match(recovery, /no customer confirmation sent/);
});

test('all August CRM appointments are reconciled idempotently to canonical Google Calendar', () => {
  assert.match(recovery, /2026-08-01T00:00:00\+02:00/);
  assert.match(recovery, /2026-09-01T00:00:00\+02:00/);
  assert.match(recovery, /a\.status<>'cancelled'/);
  assert.match(recovery, /findBookingEventByAppointmentId/);
  assert.match(recovery, /createBookingEvent/);
  assert.match(recovery, /appointment_calendar_events/);
  assert.match(recovery, /if\(calendar\.summary\.errors\) throw new Error/);
});

test('startup recovery runs before Shiloh listens and sends no WhatsApp messages', () => {
  const recoveryIndex = app.indexOf('await executeAugustGoldieRecovery');
  const listenIndex = app.indexOf('server = app.listen');
  assert.ok(recoveryIndex > -1 && listenIndex > recoveryIndex);
  assert.doesNotMatch(recovery, /sendWhatsAppMessage|sendTemplateMessage|messages\.create/);
});
