const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { cancellationSuccessInteractive } = require('../src/services/appointmentChange');
const { commandForClientBookingButton } = require('../src/services/clientBookingInteractive');
const { shouldSendLegacyConfirmationSupplements } = require('../src/services/customerBookingConfirmation');

test('successful cancellation exposes canonical Book another button with typed BOOK fallback', () => {
  const interactive = cancellationSuccessInteractive({
    id: 574,
    service_name: 'Full Body Swedish',
    staff_name: 'Christel',
    starts_at: '2026-08-17T09:00:00.000Z',
  });

  assert.equal(interactive.type, 'button');
  assert.match(interactive.body, /appointment has been cancelled/i);
  assert.match(interactive.body, /BOOK/);
  assert.deepEqual(interactive.buttons, [
    { id: 'client_postbook_book_another', title: 'Book another' },
  ]);
  assert.equal(commandForClientBookingButton(interactive.buttons[0].id), 'booking');
});

test('live v1 skips legacy supplements while fallback delivery retains the canonical action block', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/services/customerBookingConfirmation.js'),
    'utf8'
  );

  const templateBranch = source.indexOf('if(template){');
  const plainBranch = source.indexOf('}else{', templateBranch);
  const suppression = source.indexOf('const supplementalActionsSuppressed=!shouldSendLegacyConfirmationSupplements(template);', plainBranch);
  const guard = source.indexOf('if(!supplementalActionsSuppressed){', suppression);
  const googleAction = source.indexOf("confirmationActions.googleCalendar=await sendOptionalConfirmationAction('google_calendar'", guard);
  const changeAction = source.indexOf("confirmationActions.changeButtons=await sendOptionalConfirmationAction('booking_change_buttons'", guard);
  const postBookAction = source.indexOf("confirmationActions.postConfirmationMenu=await sendOptionalConfirmationAction('post_confirmation_menu'", guard);

  assert.ok(templateBranch >= 0, 'template delivery branch must remain present');
  assert.ok(plainBranch > templateBranch, 'plain-message fallback branch must remain present');
  assert.ok(suppression > plainBranch, 'suppression policy must be evaluated only after primary delivery');
  assert.ok(guard > suppression, 'legacy action block must be guarded');
  assert.ok(googleAction > guard, 'calendar CTA must remain available to non-v1 fallback delivery');
  assert.ok(changeAction > googleAction, 'Reschedule/Cancel must remain in the fallback action block');
  assert.ok(postBookAction > changeAction, 'post-confirmation navigation must remain in the fallback action block');

  assert.equal(shouldSendLegacyConfirmationSupplements('shiloh_booking_confirmation_v1'), false);
  assert.equal(shouldSendLegacyConfirmationSupplements(undefined), true);
  assert.equal((source.match(/confirmationActions\.googleCalendar=await/g) || []).length, 1);
  assert.equal((source.match(/confirmationActions\.changeButtons=await/g) || []).length, 1);
});
