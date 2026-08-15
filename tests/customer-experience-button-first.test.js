const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ratingRows,
  positiveNextButtons,
  presentCustomerExperienceResult,
} = require('../src/presentation/customerExperiencePresentation');

test('rating selector exposes five finite choices', () => {
  const rows = ratingRows();
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((row) => row.id), ['1','2','3','4','5']);
});

test('awaiting-rating response becomes an interactive list', () => {
  const result = presentCustomerExperienceResult({
    handled: true,
    reply: 'Please reply with a number from 1 to 5 so I can record your experience.',
    experience: { status: 'awaiting_rating' },
  });
  assert.equal(result.interactive.type, 'list');
  assert.equal(result.interactive.buttonText, 'Choose rating');
  assert.equal(result.interactive.rows.length, 5);
});

test('positive completed rating exposes Book another and Main menu', () => {
  assert.deepEqual(positiveNextButtons(), [
    { id: 'client_postbook_book_another', title: 'Book another' },
    { id: 'client_postbook_main_menu', title: 'Main menu' },
  ]);
  const result = presentCustomerExperienceResult({
    handled: true,
    reply: 'Thank you so much!',
    experience: { status: 'completed', rating: 5 },
  });
  assert.equal(result.interactive.type, 'button');
  assert.equal(result.interactive.buttons.length, 2);
});

test('low-rating feedback collection remains free text', () => {
  const original = {
    handled: true,
    reply: 'Would you mind telling us what we could have done better?',
    experience: { status: 'awaiting_feedback', rating: 2 },
  };
  assert.deepEqual(presentCustomerExperienceResult(original), original);
});
