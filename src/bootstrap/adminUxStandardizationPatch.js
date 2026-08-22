const interactiveMenu = require('../services/adminInteractiveMenu');
const adminAssistant = require('../services/adminAssistant');
const bookingFlow = require('../services/adminMobileBookingFlow');
const { normalizePhone } = require('../services/clientIdentityOnboarding');
const {
  isBookingCategoryInteractive,
  standardizeAdminUxResult,
  standardizeBookingCategories,
} = require('../services/adminUxStandardization');

function categorySignature(categories = []) {
  return JSON.stringify((categories || []).map((category) => ({
    name: category?.name || '',
    services: (category?.services || []).map((service) => service?.id ?? service?.name ?? null),
    groups: (category?.groups || []).map((group) => ({
      name: group?.name || '',
      services: (group?.services || []).map((service) => service?.id ?? service?.name ?? null),
    })),
  })));
}

async function standardizeBookingCategorySession(sender, result) {
  if (!isBookingCategoryInteractive(result?.interactive) || !result?.admin) return result;

  const sessionKey = normalizePhone(sender);
  const session = await bookingFlow.getSession(sessionKey);
  if (session?.step !== 'category' || !Array.isArray(session.categories)) return result;

  const categories = standardizeBookingCategories(session.categories);
  if (categorySignature(categories) !== categorySignature(session.categories)) {
    await bookingFlow.setSession(sessionKey, { ...session, categories });
  }

  return {
    ...result,
    interactive: bookingFlow.categoryInteractive(bookingFlow.bookingScope(result.admin), categories),
  };
}

function isLegacyAdminFallback(result) {
  return result?.handled === true
    && result?.isAdmin === true
    && typeof result?.reply === 'string'
    && result.reply.includes("I don't have that admin command connected yet.");
}

function modernizeLegacyAdminFallback(result) {
  if (!isLegacyAdminFallback(result)) return result;
  return {
    ...result,
    reply: "I didn't recognise that admin request. Send *Menu* to open Shiloh Admin.",
  };
}

if (!interactiveMenu.__adminUxStandardizationPatched) {
  const original = interactiveMenu.processAdminInteractiveMenuMessage;
  interactiveMenu.processAdminInteractiveMenuMessage = async function processAdminInteractiveMenuWithStandardUx(sender, text) {
    const result = await original(sender, text);
    const bookingStandardized = await standardizeBookingCategorySession(sender, result);
    return standardizeAdminUxResult(bookingStandardized);
  };
  Object.defineProperty(interactiveMenu, '__adminUxStandardizationPatched', { value: true, enumerable: false });
}

if (!adminAssistant.__adminLegacyFallbackPatched) {
  const original = adminAssistant.processAdminAssistantMessage;
  adminAssistant.processAdminAssistantMessage = async function processAdminAssistantWithoutLegacyDump(sender, text) {
    return modernizeLegacyAdminFallback(await original(sender, text));
  };
  Object.defineProperty(adminAssistant, '__adminLegacyFallbackPatched', { value: true, enumerable: false });
}

module.exports = {
  categorySignature,
  isLegacyAdminFallback,
  modernizeLegacyAdminFallback,
  standardizeBookingCategorySession,
};
