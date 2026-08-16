const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lifecycle = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'appointmentLifecycle.js'), 'utf8');
const finalization = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminAppointmentFinalization.js'), 'utf8');

test('post-appointment client followups require explicit completed attendance', () => {
  const claim = lifecycle.match(/async function claimDueFollowup\(\)[\s\S]*?async function undoClaim/);
  assert.ok(claim);
  assert.match(claim[0], /WHERE status='completed' AND followup_sent_at IS NULL/);
  assert.doesNotMatch(claim[0], /confirmed_by_client/);
  assert.doesNotMatch(claim[0], /status IN \('confirmed'/);
});

test('followup delivery remains claimed transactionally and is retryable only on send failure', () => {
  assert.match(lifecycle, /FOR UPDATE SKIP LOCKED LIMIT 1/);
  assert.match(lifecycle, /followup_sent_at=NOW\(\)/);
  assert.match(lifecycle, /undoClaim\(appointment\.id,"followup_sent_at"\)/);
});

test('explicit attendance finalization synchronizes canonical lifecycle status', () => {
  assert.match(finalization, /FINAL_STATUSES = new Set\(\['completed', 'no_show', 'no_charge'\]\)/);
  assert.match(finalization, /UPDATE appointment_lifecycle SET status=\$1,updated_at=NOW\(\) WHERE appointment_id=\$2/);
  assert.match(finalization, /Explicit WhatsApp practitioner attendance certification/);
});
