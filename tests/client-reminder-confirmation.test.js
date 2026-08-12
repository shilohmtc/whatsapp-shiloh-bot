const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const reminder = fs.readFileSync(path.join(root, 'src/services/appointmentReminderConfirmation.js'), 'utf8');
const care = fs.readFileSync(path.join(root, 'src/services/customerCare.js'), 'utf8');
const { parseConfirmationCommand } = require('../src/services/appointmentReminderConfirmation');

test('reminder confirmation command is deliberately explicit', () => {
  assert.deepEqual(parseConfirmationCommand('CONFIRM APPOINTMENT'), { appointmentId: null, explicitId: false });
  assert.deepEqual(parseConfirmationCommand('confirm my booking #123'), { appointmentId: 123, explicitId: true });
  assert.deepEqual(parseConfirmationCommand('reminder_confirm_456'), { appointmentId: 456, explicitId: true });
  assert.equal(parseConfirmationCommand('yes'), null);
  assert.equal(parseConfirmationCommand('confirm'), null);
});

test('only reminded future non-final appointments are eligible', () => {
  assert.match(reminder, /al\.reminder_sent_at IS NOT NULL/);
  assert.match(reminder, /al\.appointment_at>NOW\(\)/);
  assert.match(reminder, /a\.ends_at>NOW\(\)/);
  assert.match(reminder, /a\.status IN \('scheduled','confirmed'\)/);
  assert.match(reminder, /al\.status IN \('confirmed','confirmed_by_client'\)/);
  assert.doesNotMatch(reminder, /completed','cancelled','no_show/);
});

test('client identity fails closed unless exactly one active canonical client matches the phone', () => {
  assert.match(reminder, /matched_clients AS/);
  assert.match(reminder, /SELECT DISTINCT c\.id/);
  assert.match(reminder, /HAVING COUNT\(\*\)=1/);
  assert.match(reminder, /c\.status='active'/);
});

test('confirmation revalidates under row lock and is transactional and auditable', () => {
  assert.match(reminder, /BEGIN/);
  assert.match(reminder, /FOR UPDATE OF a,al/);
  assert.match(reminder, /UPDATE appointments SET status='confirmed'/);
  assert.match(reminder, /INSERT INTO appointment_status_history/);
  assert.match(reminder, /UPDATE appointment_lifecycle[\s\S]*status='confirmed_by_client'/);
  assert.match(reminder, /client\.appointment_reminder_confirmed/);
  assert.match(reminder, /COMMIT/);
  assert.match(reminder, /ROLLBACK/);
});

test('reminder confirmation never asserts attendance cancellation or payment truth', () => {
  assert.doesNotMatch(reminder, /SET status='completed'/);
  assert.doesNotMatch(reminder, /SET status='cancelled'/);
  assert.doesNotMatch(reminder, /SET status='no_show'/);
  assert.doesNotMatch(reminder, /payment|ozow|voucher/i);
  assert.doesNotMatch(reminder, /sendWhatsAppMessage|sendWhatsAppTemplate/);
});

test('customer-care router gives explicit reminder confirmation first chance', () => {
  assert.match(care, /processAppointmentReminderConfirmationMessage/);
  const reminderIndex = care.indexOf('processAppointmentReminderConfirmationMessage(phone,text)');
  const birthdayIndex = care.indexOf('const birthdayOn=');
  assert.ok(reminderIndex >= 0 && birthdayIndex >= 0 && reminderIndex < birthdayIndex);
});
