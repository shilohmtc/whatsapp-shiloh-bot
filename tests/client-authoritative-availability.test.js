const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const availabilityPath = path.join(__dirname, '..', 'src', 'services', 'clientBookingAvailability.js');
const sharedPath = path.join(__dirname, '..', 'src', 'services', 'availabilityService.js');
const webhookPath = path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js');
const source = fs.readFileSync(availabilityPath, 'utf8');
const shared = fs.readFileSync(sharedPath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');
const {
  SLOT_PAGE_SIZE,
  isFutureSlot,
  parseSlotPage,
  parseSlotSelection,
  slotId,
  slotsInteractive,
} = require(availabilityPath);

test('client availability reuses the canonical shared availability engine', () => {
  assert.match(source, /require\('\.\/availabilityService'\)/);
  assert.match(source, /listAvailableSlots\(\{/);
  assert.match(shared, /staff_services/);
  assert.match(shared, /staff_working_hours/);
  assert.match(shared, /appointments a/);
  assert.match(shared, /calendar_blocks/);
  assert.match(shared, /checkCalendarAvailability/);
});

test('client availability restricts candidates to active client-bookable practitioners', () => {
  assert.match(source, /st\.status = 'active'/);
  assert.match(source, /st\.resource_type = 'practitioner'/);
  assert.match(source, /st\.client_bookable = TRUE/);
  assert.doesNotMatch(source, /Savanna|Pieter/);
});

test('already-past slots are filtered before client display', () => {
  const now = new Date('2026-08-12T12:00:00Z');
  assert.equal(isFutureSlot({ starts_at: '2026-08-12T11:59:59Z' }, now), false);
  assert.equal(isFutureSlot({ starts_at: '2026-08-12T12:00:01Z' }, now), true);
  assert.match(source, /if \(!isFutureSlot\(enriched, now\)\) continue/);
});

test('slot lists stay inside Meta limits and expose stable practitioner-bound IDs', () => {
  assert.equal(SLOT_PAGE_SIZE, 9);
  const slots = Array.from({ length: 14 }, (_, index) => ({
    staff_id: index % 2 ? 2 : 1,
    staff_name: index % 2 ? 'Abigail' : 'Christel',
    service_name: 'Swedish Massage',
    starts_at: new Date(Date.UTC(2026, 7, 13, 7, index * 15)).toISOString(),
    ends_at: new Date(Date.UTC(2026, 7, 13, 8, index * 15)).toISOString(),
  }));
  const intent = {
    service_text: 'Swedish Massage',
    preferred_date: '2026-08-13',
    therapist_text: 'Any available therapist',
  };
  const first = slotsInteractive(intent, slots, 1);
  assert.equal(first.type, 'list');
  assert.equal(first.rows.length, 10);
  assert.match(first.rows[0].id, /^client_slot_\d+_\d{8}_\d{4}$/);
  assert.equal(first.rows.at(-1).id, 'client_slots_page_2');
  assert.ok(first.rows.every((row) => row.id.length <= 200));
  assert.ok(first.rows.every((row) => row.title.length <= 24));
  assert.ok(first.rows.every((row) => !row.description || row.description.length <= 72));
});

test('slot IDs and pagination IDs parse deterministically', () => {
  const id = slotId({
    staff_id: 7,
    starts_at: '2026-08-14T12:30:00.000Z',
  });
  const parsed = parseSlotSelection(id);
  assert.equal(parsed.staffId, 7);
  assert.equal(parsed.dateKey, '20260814');
  assert.equal(parsed.hhmm, '1430');
  assert.deepEqual(parseSlotPage('client_slots_page_3_afternoon'), { page: 3, daypart: 'afternoon' });
});

test('slot selection is revalidated against live availability before entering booking intent', () => {
  assert.match(source, /async function revalidateSelectedSlot/);
  assert.match(source, /const result = await listAvailableSlots\(/);
  assert.match(source, /if \(!practitioner\)/);
  assert.match(source, /That slot is no longer available/);
  assert.match(source, /processBookingMessage\(sender, `booking with \$\{practitioner\.display_name\} at \$\{hh\}:\$\{mm\}`\)/);
});

test('typed exact times and dayparts are validated instead of trusted as availability', () => {
  assert.match(source, /extractTime\(value\)/);
  assert.match(source, /authoritativeSlotsForIntent\(intent, \{ daypart: requestedTime \}\)/);
  assert.match(source, /That exact time is not currently available/);
  assert.match(source, /const matching = target/);
});

test('availability layer is non-mutating with respect to canonical appointments and calendars', () => {
  assert.doesNotMatch(source, /INSERT INTO appointments/i);
  assert.doesNotMatch(source, /UPDATE appointments/i);
  assert.doesNotMatch(source, /DELETE FROM appointments/i);
  assert.doesNotMatch(source, /createBookingEvent|createPractitionerBookingEvent|updateBookingEvent|cancelBookingEvent/);
});

test('client availability routes after discovery and before policy/generic booking fallthrough', () => {
  const discovery = webhook.indexOf('processClientDiscoveryMessage(from,text)');
  const availability = webhook.indexOf('processClientAvailabilityMessage(from,text)');
  const policy = webhook.indexOf('processBookingPolicyMessage(from,text)');
  const genericBooking = webhook.lastIndexOf('processBookingMessage(from,text)');
  assert.ok(discovery >= 0 && availability >= 0 && policy >= 0 && genericBooking >= 0);
  assert.ok(discovery < availability);
  assert.ok(availability < policy);
  assert.ok(policy < genericBooking);
});
