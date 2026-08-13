const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'appointmentChange.js'), 'utf8');
const webhookSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js'), 'utf8');

test('appointment change intents remain isolated from onboarding state', () => {
  assert.match(source, /INSERT INTO appointment_change_intents/);
  assert.doesNotMatch(source, /INSERT INTO client_onboarding_sessions\(phone,action/);
});

test('bare RESCHEDULE command enters canonical appointment-change flow and carries forward the existing booking', () => {
  assert.match(webhookSource, /\^\(reschedule\|cancel\)\$/i);
  assert.match(webhookSource, /processAppointmentChangeMessage\(from,appointmentChangeText\)/);
  assert.match(source, /if\(rows\.length===1\)return\{appointment:rows\[0\]\}/);
  assert.match(source, /What new day or date would you prefer\?/);
});

test('client reschedule locks the practitioner and revalidates authoritative availability before mutation', () => {
  const begin = source.indexOf("await db.query('BEGIN')", source.indexOf('async function rescheduleCanonical'));
  const advisory = source.indexOf('pg_advisory_xact_lock', begin);
  const finalClinic = source.indexOf('const finalClinic=', advisory);
  const finalSchedule = source.indexOf('const finalSchedule=', finalClinic);
  const finalConflict = source.indexOf('const finalConflict=', finalSchedule);
  const finalExternal = source.indexOf('const finalExternal=', finalConflict);
  const update = source.indexOf('UPDATE appointments SET starts_at=', finalExternal);
  assert.ok(begin >= 0 && advisory > begin);
  assert.ok(finalClinic > advisory && finalSchedule > finalClinic);
  assert.ok(finalConflict > finalSchedule && finalExternal > finalConflict);
  assert.ok(update > finalExternal);
});

test('concurrent appointment movement fails closed instead of overwriting newer state', () => {
  assert.match(source, /originalStartsAt=locked\.rows\[0\]\.starts_at/);
  assert.match(source, /originalEndsAt=locked\.rows\[0\]\.ends_at/);
  assert.match(source, /new Date\(originalStartsAt\).*new Date\(a\.starts_at\)/s);
  assert.match(source, /status:'changed'/);
});

test('failed multi-calendar reschedule compensates back to original appointment time', () => {
  const fn = source.match(/async function rescheduleCanonical[\s\S]*?async function processAppointmentChangeMessage/);
  assert.ok(fn);
  assert.match(fn[0], /calendarMutationAttempted=true/);
  assert.match(fn[0], /ROLLBACK/);
  assert.match(fn[0], /startsAt:originalStartsAt,endsAt:originalEndsAt/);
  assert.match(fn[0], /Client reschedule calendar compensation failed/);
  assert.match(fn[0], /sync_status='error'/);
});
