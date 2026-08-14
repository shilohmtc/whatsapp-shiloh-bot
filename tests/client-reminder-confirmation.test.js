const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const reminder = fs.readFileSync(path.join(root, 'src/services/appointmentReminderConfirmation.js'), 'utf8');
const lifecycle = fs.readFileSync(path.join(root, 'src/services/appointmentLifecycle.js'), 'utf8');
const care = fs.readFileSync(path.join(root, 'src/services/customerCare.js'), 'utf8');
const bookingConfirmation = fs.readFileSync(path.join(root, 'src/services/customerBookingConfirmation.js'), 'utf8');
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

test('lifecycle reminder claim pauses while the client has an active reschedule or cancel intent', () => {
  assert.match(lifecycle, /appointment_change_intents/);
  assert.match(lifecycle, /NOT EXISTS/);
  assert.match(lifecycle, /aci\.phone\s*=\s*a\.phone/);
  assert.match(lifecycle, /aci\.status\s*=\s*'collecting'/);
  assert.match(lifecycle, /aci\.action\s+IN\s*\('reschedule','cancel'\)/);
});

test('reminder greeting prefers one unambiguous active CRM client name before profile fallback', () => {
  assert.match(lifecycle, /client_contacts/);
  assert.match(lifecycle, /c\.display_name/);
  assert.match(lifecycle, /c\.status='active'/);
  assert.match(lifecycle, /HAVING COUNT\(DISTINCT c\.id\)=1/);
  assert.match(lifecycle, /getProfile/);
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

test('booking confirmation has a durable per-appointment delivery claim', () => {
  assert.match(bookingConfirmation, /CREATE TABLE IF NOT EXISTS customer_message_deliveries/);
  assert.match(bookingConfirmation, /PRIMARY KEY \(appointment_id,message_kind\)/);
  assert.match(bookingConfirmation, /ON CONFLICT \(appointment_id,message_kind\) DO NOTHING/);
  assert.match(bookingConfirmation, /already_sent_or_in_progress/);
});

test('booking lifecycle is enrolled before the confirmation delivery claim and provider send', () => {
  const enroll = bookingConfirmation.indexOf('await enrollAppointmentLifecycle');
  const claim = bookingConfirmation.indexOf('claimed=await claimBookingConfirmation');
  const sendTemplate = bookingConfirmation.indexOf('await sendWhatsAppTemplate', claim);
  const sendText = bookingConfirmation.indexOf('await sendWhatsAppMessage', claim);
  assert.ok(enroll >= 0 && claim > enroll);
  assert.ok(sendTemplate > claim && sendText > claim);
});

test('definitive provider failure releases the claim but post-send bookkeeping failure cannot duplicate', () => {
  assert.match(bookingConfirmation, /providerAccepted=true/);
  assert.match(bookingConfirmation, /if\(claimed&&!providerAccepted\)/);
  assert.match(bookingConfirmation, /releaseBookingConfirmationClaim\(appointmentId\)/);
  assert.match(bookingConfirmation, /providerAccepted\?'delivery_state_uncertain':'error'/);
  const accepted = bookingConfirmation.indexOf('providerAccepted=true');
  const marked = bookingConfirmation.indexOf('await markBookingConfirmationSent', accepted);
  const audit = bookingConfirmation.indexOf("customer.booking_confirmation_sent", marked);
  assert.ok(accepted >= 0 && marked > accepted && audit > marked);
});
