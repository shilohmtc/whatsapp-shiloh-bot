const CLIENT_FAMILY_COPY = Object.freeze({
  treatmentPrompt: 'Choose the treatment you’d like to book. 🌿',
});

const LEGACY_FAMILY_TREATMENT_PROMPT = 'Choose an active treatment. Shiloh will only offer practitioners currently eligible in CRM.';

function applyClientFamilyCopy(body = '') {
  return String(body).replace(LEGACY_FAMILY_TREATMENT_PROMPT, CLIENT_FAMILY_COPY.treatmentPrompt);
}

module.exports = { CLIENT_FAMILY_COPY, applyClientFamilyCopy };
