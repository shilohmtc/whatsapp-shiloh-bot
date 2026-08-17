const nextAvailable = require('../services/adminBookingNextAvailable');
const { clearAdminBookingTimeInputSession } = require('../services/adminBookingTimeInputSession');

const original = nextAvailable.processImmediateTimeAction;
nextAvailable.processImmediateTimeAction = async function confirmedRescheduleCommit(sender, text, ...rest) {
  const raw = String(text || '').trim();
  if (/^manage_quick_reschedule_confirm_\d+_\d+$/i.test(raw)) {
    // The durable typed-input context is only needed until the review card is shown.
    // Clear it before replaying the scoped confirmed slot so the confirmation-layer
    // base wrapper does not treat the final guarded commit as another preview.
    await clearAdminBookingTimeInputSession(sender);
  }
  return original(sender, text, ...rest);
};

module.exports = { confirmedRescheduleCommitInstalled: true };
