const { upsertProfile } = require("./profile");

function cleanValue(value = "") {
  return String(value)
    .trim()
    .replace(/[.!?]+$/, "")
    .trim();
}

function extractProfilePatch(message = "") {
  const text = String(message).trim();
  const patch = { preferences: {} };

  const nameMatch = text.match(/\b(?:my name is|call me)\s+([A-Za-z][A-Za-z' -]{1,60})\b/i);
  if (nameMatch) patch.name = cleanValue(nameMatch[1]);

  const locationMatch = text.match(/\b(?:i live in|i am based in|i'm based in|i am from|i'm from)\s+([^,.!?]{2,100})/i);
  if (locationMatch) patch.location = cleanValue(locationMatch[1]);

  const languageMatch = text.match(/\b(?:my preferred language is|i prefer speaking|please speak to me in)\s+([A-Za-z -]{2,40})/i);
  if (languageMatch) patch.preferredLanguage = cleanValue(languageMatch[1]);

  const favouriteMatch = text.match(/\bmy (?:favorite|favourite)\s+([A-Za-z][A-Za-z -]{1,40})\s+is\s+([^,.!?]{1,100})/i);
  if (favouriteMatch) {
    const key = `favorite_${cleanValue(favouriteMatch[1]).toLowerCase().replace(/\s+/g, "_")}`;
    patch.preferences[key] = cleanValue(favouriteMatch[2]);
  }

  const preferMatch = text.match(/\bi prefer\s+([^,.!?]{2,120})/i);
  if (preferMatch && !languageMatch) {
    patch.preferences.general = cleanValue(preferMatch[1]);
  }

  if (Object.keys(patch.preferences).length === 0) {
    delete patch.preferences;
  }

  return patch;
}

async function updateProfileFromMessage(phone, message) {
  const patch = extractProfilePatch(message);
  const hasFacts = Object.keys(patch).length > 0;

  // Always touch the profile so last_interaction_at is current.
  return upsertProfile(phone, hasFacts ? patch : {});
}

module.exports = {
  extractProfilePatch,
  updateProfileFromMessage,
};
