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

function installClientNavigationPriority({ identityService, discoveryService }) {
  if (!identityService || !discoveryService) throw new Error('client navigation services are required');
  if (identityService.__clientNavigationPriorityInstalled && discoveryService.__clientNavigationPriorityInstalled) return;

  const originalIdentity = identityService.processClientIdentityMessage;
  const originalDiscovery = discoveryService.processClientDiscoveryMessage;
  if (typeof originalIdentity !== 'function' || typeof originalDiscovery !== 'function') {
    throw new Error('client navigation service functions are unavailable');
  }

  identityService.processClientIdentityMessage = async (sender, text, ...rest) => {
    if (discoveryCommandForNavigation(text)) return { handled: false, navigationPriority: true };
    return originalIdentity(sender, text, ...rest);
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
