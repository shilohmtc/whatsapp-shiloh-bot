const { getIntent } = require('./bookingIntent');
const {
  processClientIdentityMessage,
} = require('./clientIdentityOnboarding');
const {
  resolveWhatsAppBookingIdentity,
  bookingProfileComplete,
} = require('./whatsappBookingIdentity');

function isSummaryConfirmation(text = '') {
  return /^(yes|y|confirm|confirmed|correct|looks good|that works|proceed|continue|ok|okay)$/i.test(
    String(text || '').trim()
  );
}

async function bookingIdentityStatus(phone) {
  const identity = await resolveWhatsAppBookingIdentity(phone);
  if (identity.status === 'unique' && bookingProfileComplete(identity.clientIdentity, identity.client)) {
    return { ready: true, identityStatus: 'matched_complete', clientIdentity: identity.clientIdentity, client: identity.client, identityAudit: identity.identityAudit };
  }
  return {
    ready: false,
    identityStatus: identity.status === 'unique' ? 'matched_incomplete' : identity.status,
    clientIdentity: identity.clientIdentity || null,
    client: identity.client || null,
    identityAudit: identity.identityAudit || null,
  };
}

async function ensureBookingIdentity(phone) {
  const status = await bookingIdentityStatus(phone);
  if (status.ready) return status;

  const onboarding = await processClientIdentityMessage(phone, 'booking');
  if (!onboarding?.handled) {
    return {
      ...status,
      handled: true,
      reply: 'I can’t verify a complete Shiloh client profile for this booking yet, so I won’t continue to confirmation. Please contact the clinic team so we can verify your profile safely.',
    };
  }
  return { ...status, ...onboarding, ready: false };
}

async function guardBookingConfirmationIdentity(phone, text) {
  if (!isSummaryConfirmation(text)) return { handled: false };
  const intent = await getIntent(phone);
  if (!intent || intent.status !== 'awaiting_confirmation') return { handled: false };

  const identity = await ensureBookingIdentity(phone);
  if (identity.ready) return { handled: false, identity };
  return {
    handled: true,
    reply: identity.reply,
    identity,
  };
}

module.exports = {
  bookingIdentityStatus,
  ensureBookingIdentity,
  guardBookingConfirmationIdentity,
  isSummaryConfirmation,
};
