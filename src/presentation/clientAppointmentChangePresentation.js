function presentClientAppointmentChangeResult(result) {
  if (!result?.handled || result?.interactive || typeof result.reply !== 'string') return result;
  if (!result.reply.startsWith('Please confirm the cancellation:')) return result;

  const typedInstruction = 'Reply *YES* to cancel this booking, or *STOP* to leave it unchanged.';
  const body = result.reply.includes(typedInstruction)
    ? result.reply.replace(
        typedInstruction,
        'Nothing has changed yet.\n\nUse a button below, or type *YES* to cancel or *STOP* to keep the appointment.'
      )
    : `${result.reply}\n\nNothing has changed yet.\n\nUse a button below, or type *YES* to cancel or *STOP* to keep the appointment.`;

  return {
    ...result,
    interactive: {
      type: 'button',
      body,
      buttons: [
        { id: 'yes', title: 'Confirm cancellation' },
        { id: 'stop', title: 'Keep appointment' },
      ],
    },
  };
}

module.exports = { presentClientAppointmentChangeResult };
