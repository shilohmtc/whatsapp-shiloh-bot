const { currentRequestLog } = require('../lib/requestLogContext');
const { whatsappIdentityDecisionObservability } = require('./whatsappIdentityDecisionObservability');

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function isGreetingNavigation(text = '') {
  return /^(hi|hello|hey|howzit|hiya|start|good morning|good afternoon|good evening)[!. ]*$/i.test(clean(text));
}

function isBookAnotherNavigation(text = '') {
  const value = clean(text).toLowerCase().replace(/[.!?]+$/, '');
  return [
    'book another treatment',
    'book another appointment',
    'another appointment',
    'another booking',
    'make another booking',
    'make another appointment',
    'i want to make another booking',
    'i want to make another appointment',
    'i want another booking',
    'i want another appointment',
  ].includes(value);
}

function discoveryCommandForNavigation(text = '') {
  if (isGreetingNavigation(text)) return 'main menu';
  if (isBookAnotherNavigation(text)) return 'client_book_now';
  return null;
}

async function safelyObserveDecision(observer, input) {
  if (!input.logger || !observer) return;
  try {
    await observer.observeAndLog(input);
  } catch (_error) {
    // Observability must never alter identity routing or the client response.
  }
}

function installClientNavigationPriority({
  identityService,
  discoveryService,
  identityDecisionObservability = whatsappIdentityDecisionObservability,
}) {
  if (!identityService || !discoveryService) throw new Error('client navigation services are required');
  if (identityService.__clientNavigationPriorityInstalled && discoveryService.__clientNavigationPriorityInstalled) return;

  const originalIdentity = identityService.processClientIdentityMessage;
  const originalDiscovery = discoveryService.processClientDiscoveryMessage;
  if (typeof originalIdentity !== 'function' || typeof originalDiscovery !== 'function') {
    throw new Error('client navigation service functions are unavailable');
  }
  const currentAuthorityVersion = identityService.AUTHORITY_VERSION || null;

  identityService.processClientIdentityMessage = async (sender, text, ...rest) => {
    const requestLog = currentRequestLog();
    let sessionBefore = null;
    if (requestLog && identityDecisionObservability?.captureSession) {
      try {
        sessionBefore = await identityDecisionObservability.captureSession(sender, currentAuthorityVersion);
      } catch (_error) {
        sessionBefore = null;
      }
    }

    if (isBookAnotherNavigation(text)) {
      const result = { handled: false, navigationPriority: true };
      await safelyObserveDecision(identityDecisionObservability, {
        logger: requestLog,
        phone: sender,
        currentAuthorityVersion,
        sessionBefore,
        originalResult: result,
        finalResult: result,
        navigationKind: 'book_another',
      });
      return result;
    }

    const identity = await originalIdentity(sender, text, ...rest);
    let result = identity;
    let navigationKind = null;
    if (isGreetingNavigation(text) && identity?.identityStatus === 'matched_complete') {
      result = {
        handled: false,
        navigationPriority: true,
        identityStatus: identity.identityStatus,
        client: identity.client || null,
      };
      navigationKind = 'matched_greeting';
    }

    await safelyObserveDecision(identityDecisionObservability, {
      logger: requestLog,
      phone: sender,
      currentAuthorityVersion,
      sessionBefore,
      originalResult: identity,
      finalResult: result,
      navigationKind,
    });
    return result;
  };

  discoveryService.processClientDiscoveryMessage = async (sender, text, ...rest) => {
    const command = discoveryCommandForNavigation(text);
    return originalDiscovery(sender, command || text, ...rest);
  };

  identityService.__clientNavigationPriorityInstalled = true;
  discoveryService.__clientNavigationPriorityInstalled = true;
}

module.exports = {
  clean,
  isGreetingNavigation,
  isBookAnotherNavigation,
  discoveryCommandForNavigation,
  installClientNavigationPriority,
};
