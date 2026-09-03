const { authoritativeSlotsForIntent } = require('./clientBookingAvailability');
const {
  addIsoDays,
  getClinicDateStatus,
  localIsoDate,
  shortDateTitle,
} = require('./clinicDateChoices');

const DEFAULT_DATE_CHOICE_COUNT = 2;
const DEFAULT_DATE_SEARCH_DAYS = 21;

function isDateSelectionIntent(intent) {
  return Boolean(
    intent &&
    intent.status === 'collecting' &&
    intent.service_text &&
    intent.service_verified !== false &&
    intent.therapist_text &&
    !intent.preferred_date
  );
}

function dateChoiceTitle(date, offset) {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  return shortDateTitle(date);
}

function dateChoiceButtons(choices = []) {
  const buttons = choices.slice(0, DEFAULT_DATE_CHOICE_COUNT).map((choice) => ({
    id: `client_date_${choice.date}`,
    title: String(choice.title || choice.date).slice(0, 20),
  }));
  buttons.push({ id: 'client_date_other', title: 'Choose another date' });
  return buttons.slice(0, 3);
}

async function availableDateChoicesForIntent(
  intent,
  { now = new Date(), count = DEFAULT_DATE_CHOICE_COUNT, maxDays = DEFAULT_DATE_SEARCH_DAYS } = {}
) {
  if (!isDateSelectionIntent(intent)) return [];
  const fromDate = localIsoDate(now);
  const choices = [];

  for (let offset = 0; offset <= maxDays && choices.length < count; offset += 1) {
    const date = addIsoDays(fromDate, offset);
    const clinicDate = await getClinicDateStatus({ date });
    if (!clinicDate.covered) continue;

    const candidateIntent = {
      ...intent,
      preferred_date: date,
      preferred_time: null,
    };
    const availability = await authoritativeSlotsForIntent(candidateIntent, { now });
    if (!availability.slots.length) continue;

    choices.push({
      date,
      offset,
      title: dateChoiceTitle(date, offset),
    });
  }

  return choices;
}

async function applyAvailabilityAwareDateChoices(result, options = {}) {
  if (!result?.handled || !isDateSelectionIntent(result.intent)) return result;
  if (result.interactive?.type !== 'button') return result;

  const choices = await availableDateChoicesForIntent(result.intent, options);
  let body = result.interactive.body;
  if (!choices.length) {
    body = [
      body,
      '',
      'I could not find a directly available date in the next few weeks. You can still type another date and I’ll check it.',
    ].join('\n');
  }

  return {
    ...result,
    interactive: {
      ...result.interactive,
      body,
      buttons: dateChoiceButtons(choices),
    },
  };
}

module.exports = {
  DEFAULT_DATE_CHOICE_COUNT,
  DEFAULT_DATE_SEARCH_DAYS,
  applyAvailabilityAwareDateChoices,
  availableDateChoicesForIntent,
  dateChoiceButtons,
  dateChoiceTitle,
  isDateSelectionIntent,
};
