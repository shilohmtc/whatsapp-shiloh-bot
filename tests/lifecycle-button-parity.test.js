const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { cancellationSuccessInteractive } = require('../src/services/appointmentChange');
const { commandForClientBookingButton } = require('../src/services/clientBookingInteractive');

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

test('booking confirmation template and in-session branches share the same supplemental action block', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/services/customerBookingConfirmation.js'),
    'utf8'
  );

  const templateBranch = source.indexOf('if(template){');
  const plainBranch = source.indexOf('}else{', templateBranch);
  const googleAction = source.indexOf("confirmationActions.googleCalendar=await sendOptionalConfirmationAction('google_calendar'", plainBranch);
  const changeAction = source.indexOf("confirmationActions.changeButtons=await sendOptionalConfirmationAction('booking_change_buttons'", plainBranch);
  const postBookAction = source.indexOf("confirmationActions.postConfirmationMenu=await sendOptionalConfirmationAction('post_confirmation_menu'", plainBranch);

  assert.ok(templateBranch >= 0, 'template delivery branch must remain present');
  assert.ok(plainBranch > templateBranch, 'plain-message fallback branch must remain present');
  assert.ok(googleAction > plainBranch, 'calendar CTA actions must run after the delivery branch joins');
  assert.ok(changeAction > googleAction, 'Reschedule/Cancel buttons must share the joined action path');
  assert.ok(postBookAction > changeAction, 'post-confirmation navigation must share the joined action path');

  assert.equal((source.match(/confirmationActions\.googleCalendar=await/g) || []).length, 1);
  assert.equal((source.match(/confirmationActions\.changeButtons=await/g) || []).length, 1);
});
