const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileBookingFlow.js'), 'utf8');
const { noSlotsInteractive } = require('../src/services/adminMobileBookingFlow');

const sampleSession = { date: '2026-08-13', staff: { id: 1, display_name: 'Christel' }, service: { id: 2, name: 'Cupping Area Specific' } };

test('no-slot UX offers bounded receptionist-style actions', () => {
  const result = noSlotsInteractive(sampleSession);
  assert.equal(result.type, 'button');
  assert.equal(result.buttons.length, 3);
  assert.deepEqual(result.buttons.map((b) => b.id), ['admin_booking_next_available', 'admin_booking_choose_date', 'admin_booking_cancel_flow']);
  assert.match(result.body, /authoritative bookable slots/i);
  assert.match(result.body, /next available date/i);
});

test('next-available search is bounded and reuses the canonical availability engine', () => {
  assert.match(source, /const NEXT_AVAILABLE_DAYS = 30/);
  assert.match(source, /for \(let offset = 1; offset <= NEXT_AVAILABLE_DAYS; offset \+= 1\)/);
  assert.match(source, /listAvailableSlots\(\{ staffId: session\.staff\.id, serviceId: session\.service\.id, date, intervalMinutes: 15 \}\)/);
  assert.match(source, /mobile_booking\.next_available_found/);
  assert.match(source, /mobile_booking\.next_available_none/);
});

test('no-slot date path stays interactive instead of forcing repeated date guesses', () => {
  assert.match(source, /admin_booking_next_available/);
  assert.match(source, /admin_booking_choose_date/);
  assert.match(source, /interactive: noSlotsInteractive\(noSlotSession\)/);
  assert.match(source, /slotsInteractive\(nextSession, 0\)/);
});

test('next-available lookup never creates or mutates booking/calendar truth', () => {
  const start = source.indexOf('async function findNextAvailable(session)');
  const end = source.indexOf('async function begin(', start);
  assert.ok(start >= 0 && end > start, 'findNextAvailable must exist');
  const fn = source.slice(start, end);
  assert.match(fn, /listAvailableSlots/);
  assert.doesNotMatch(fn, /prepareAdminBooking|confirmAdminBooking|INSERT INTO appointments|UPDATE appointments|createBookingEvent|updateBookingEvent|cancelBookingEvent/i);
});

test('shared Admin scope rules remain fail-closed for practitioner and unlinked business admins', () => {
  assert.match(source, /name === 'marietjie'.*staffNames: \['marietjie'\]/);
  assert.match(source, /name === 'christel' \|\| name === 'abigail'.*staffNames: \['christel', 'abigail'\]/);
  assert.match(source, /key: 'own_practitioner'.*staffIds: \[Number\(admin\.staff_id\)\]/s);
  assert.match(source, /key: 'no_practitioner_scope'.*staffNames: \[\], staffIds: \[\]/s);
  assert.doesNotMatch(source, /All client-bookable services/);
  assert.match(source, /st\.client_bookable=TRUE/);
});
