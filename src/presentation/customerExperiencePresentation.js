const { postConfirmationButtons } = require('../services/clientBookingInteractive');

function ratingRows() {
  return [
    { id: '1', title: '1 · Very poor', description: 'Far below expectations' },
    { id: '2', title: '2 · Poor', description: 'Below expectations' },
    { id: '3', title: '3 · Okay', description: 'About as expected' },
    { id: '4', title: '4 · Good', description: 'A good experience' },
    { id: '5', title: '5 · Excellent', description: 'An excellent experience' },
  ];
}

function positiveNextButtons() {
  return postConfirmationButtons().filter((button) =>
    ['client_postbook_book_another', 'client_postbook_main_menu'].includes(button.id)
  );
}

function presentCustomerExperienceResult(result) {
  if (!result?.handled) return result;
  const status = result.experience?.status || null;
  const rating = Number(result.experience?.rating || 0);

  if (status === 'awaiting_rating') {
    return {
      ...result,
      interactive: {
        type: 'list',
        body: '🌿 *How was your Shiloh experience?*\nChoose a rating from 1 to 5 below.',
        buttonText: 'Choose rating',
        rows: ratingRows(),
        sectionTitle: 'Your rating',
      },
    };
  }

  if (status === 'completed' && rating >= 4) {
    return {
      ...result,
      interactive: {
        type: 'button',
        body: result.reply,
        buttons: positiveNextButtons(),
      },
    };
  }

  return result;
}

module.exports = {
  ratingRows,
  positiveNextButtons,
  presentCustomerExperienceResult,
};
