const { resolveVerifiedClientByWhatsApp } = require('./clientVerifiedIdentity');

function cleanName(text = "") {
  return String(text)
    .trim()
    .replace(/^my name is\s+/i, "")
    .replace(/^i am\s+/i, "")
    .replace(/^i'm\s+/i, "")
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ");
}

function comparableName(value = "") {
  return cleanName(value).toLocaleLowerCase("en-ZA");
}

// Retained only as a non-authoritative compatibility utility for historical
// tests/callers. It MUST NOT be used to verify, claim or link a client.
const NON_IDENTITY_NAME_PREFIXES = new Set(["pa", "mr", "mrs", "ms", "miss", "dr"]);
function identityNameTokens(value = "") {
  const normalized = comparableName(value)
    .replace(/[^a-z' -]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (normalized.length > 1 && NON_IDENTITY_NAME_PREFIXES.has(normalized[0])) normalized.shift();
  return normalized;
}

function namesCompatible(supplied, expected) {
  const suppliedExact = comparableName(supplied);
  const expectedExact = comparableName(expected);
  if (!suppliedExact || !expectedExact) return false;
  if (suppliedExact === expectedExact) return true;
  const suppliedTokens = identityNameTokens(supplied);
  const expectedTokens = identityNameTokens(expected);
  if (!suppliedTokens.length || !expectedTokens.length) return false;
  return suppliedTokens.join(" ") === expectedTokens.join(" ");
}

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function expandTwoDigitYear(value, now = new Date()) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 0) return null;
  if (year >= 100) return year;
  const currentTwoDigits = now.getUTCFullYear() % 100;
  return year <= currentTwoDigits ? 2000 + year : 1900 + year;
}

function canonicalDate(year, month, day, now = new Date()) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const oldest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
  if (date > today || date < oldest) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseNaturalDateOfBirth(text = "", now = new Date()) {
  const source = String(text || "").trim();
  let match = source.match(/\b(\d{1,2})\s+([A-Za-z]+),?\s+(\d{2}|\d{4})\b/i);
  if (match) {
    const month = MONTHS[match[2].toLowerCase()];
    const year = expandTwoDigitYear(match[3], now);
    if (month && year) return canonicalDate(year, month, Number(match[1]), now);
  }
  match = source.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})\b/);
  if (match) {
    const year = expandTwoDigitYear(match[3], now);
    if (year) return canonicalDate(year, Number(match[2]), Number(match[1]), now);
  }
  return null;
}

// The old imported-name guard is intentionally inert. Identity decisions are
// centralized in clientVerifiedIdentity. This compatibility export prevents
// a controller/test import from reviving the retired display-name rule.
async function forceMatchedClientNameConfirmation() {
  return false;
}

async function guardActiveNameConfirmation(phone) {
  const identity = await resolveVerifiedClientByWhatsApp(phone);
  if (identity.status === 'ambiguous' || identity.status === 'manual_review') {
    return {
      handled: true,
      identityStatus: identity.status,
      reply: "I found an identity conflict for this WhatsApp number, so I won't update, merge or select a client record automatically. Please contact the clinic team so we can verify the correct profile safely.",
    };
  }
  if (identity.status === 'historical_unverified') {
    return {
      handled: true,
      identityStatus: identity.status,
      reply: "This number matches a Shiloh profile with appointment history, but history and imported details are not identity proof. Please contact the clinic team so we can verify the profile before continuing.",
    };
  }
  return { handled: false, identityStatus: identity.status };
}

module.exports = {
  forceMatchedClientNameConfirmation,
  guardActiveNameConfirmation,
  namesCompatible,
  parseNaturalDateOfBirth,
  expandTwoDigitYear,
};
