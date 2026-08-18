const Module = require('node:module');
const { normalizePhone } = require('../services/clientIdentityOnboarding');
const {
  cleanName,
  normalizeZaMobile,
  createProvisionalClient,
  cleanupUnusedProvisionalClient,
} = require('../services/adminProvisionalClient');

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function candidateNameFromQuery(value = '') {
  const raw = clean(value);
  if (!raw || normalizeZaMobile(raw)) return null;
  return cleanName(raw);
}

function buttonInteractive(body, buttons) {
  return { type: 'button', body, buttons };
}

function noMatchOffer(name) {
  const subject = name ? `“${name}”` : 'that client';
  return buttonInteractive(
    `I couldn't find a canonical CRM client matching ${subject}.\n\nIf this is a new client, I can reserve the appointment now using only their name and mobile number. Their profile can be completed later.`,
    [
      { id: 'admin_booking_new_client', title: 'Reserve new client' },
      { id: 'admin_booking_try_client', title: 'Try another client' },
      { id: 'admin_booking_cancel_flow', title: 'Cancel booking' },
    ]
  );
}

function mobilePrompt(name) {
  return [
    `*Reserve for new client: ${name}*`,
    '',
    'Send the client’s South African mobile number.',
    'I’ll check it against the canonical CRM before creating anything.',
    '',
    'Type 0 to cancel.',
  ].join('\n');
}

function isBookingCancel(value = '') {
  const v = clean(value).toLowerCase();
  return ['0', '2', 'cancel booking', 'admin_booking_cancel', 'admin_booking_cancel_flow'].includes(v);
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  const exported = originalLoad.apply(this, arguments);
  if (
    typeof request === 'string' &&
    /(?:^|\/)adminMobileBookingFlow(?:\.js)?$/.test(request) &&
    exported &&
    typeof exported.processAdminMobileBookingFlowMessage === 'function' &&
    typeof exported.getSession === 'function' &&
    typeof exported.setSession === 'function' &&
    !exported.__provisionalClientBookingPatched
  ) {
    const originalProcess = exported.processAdminMobileBookingFlowMessage;

    exported.processAdminMobileBookingFlowMessage = async function processWithProvisionalClient(sender, text) {
      const key = normalizePhone(sender);
      const raw = clean(text);
      const v = raw.toLowerCase();
      let session = await exported.getSession(key);

      if (session?.step === 'provisional-client-offer') {
        if (v === 'admin_booking_try_client' || v === 'try another client') {
          await exported.setSession(key, { ...session, step: 'client-query', provisionalName: undefined, provisionalAdminId: undefined });
          return { handled: true, reply: 'Send another client name or mobile number. Type 0 to cancel.' };
        }
        if (v === 'admin_booking_new_client' || v === 'reserve new client') {
          if (session.provisionalName) {
            await exported.setSession(key, { ...session, step: 'provisional-client-mobile' });
            return { handled: true, reply: mobilePrompt(session.provisionalName) };
          }
          await exported.setSession(key, { ...session, step: 'provisional-client-name' });
          return { handled: true, reply: 'Send the new client’s first name and surname. Type 0 to cancel.' };
        }
        if (v === '0' || v === 'admin_booking_cancel_flow') {
          return originalProcess(sender, v === '0' ? '0' : 'admin_booking_cancel_flow');
        }
        return { handled: true, interactive: noMatchOffer(session.provisionalName) };
      }

      if (session?.step === 'provisional-client-name') {
        if (v === '0') return originalProcess(sender, '0');
        const fullName = cleanName(raw);
        if (!fullName) {
          return { handled: true, reply: 'Send the client’s first name and surname, for example *Stefan Erasmus*. Type 0 to cancel.' };
        }
        await exported.setSession(key, { ...session, step: 'provisional-client-mobile', provisionalName: fullName });
        return { handled: true, reply: mobilePrompt(fullName) };
      }

      if (session?.step === 'provisional-client-mobile') {
        if (v === '0') return originalProcess(sender, '0');
        const normalizedMobile = normalizeZaMobile(raw);
        if (!normalizedMobile) {
          return { handled: true, reply: 'Send a valid South African mobile number, for example *082 123 4567*. Type 0 to cancel.' };
        }
        if (!session.provisionalName || !session.provisionalAdminId) {
          await exported.setSession(key, { ...session, step: 'client-query', provisionalName: undefined, provisionalAdminId: undefined });
          return { handled: true, reply: 'I lost the new-client details, so nothing was created. Send the client name again to continue.' };
        }

        const outcome = await createProvisionalClient({
          fullName: session.provisionalName,
          mobileNumber: raw,
          adminId: session.provisionalAdminId,
        });

        if (outcome.status === 'invalid_name') {
          await exported.setSession(key, { ...session, step: 'provisional-client-name' });
          return { handled: true, reply: 'The client name is not valid. Send the first name and surname again, or type 0 to cancel.' };
        }
        if (outcome.status === 'invalid_mobile') {
          return { handled: true, reply: 'Send a valid South African mobile number, for example *082 123 4567*. Type 0 to cancel.' };
        }
        if (outcome.status === 'ambiguous') {
          return { handled: true, reply: 'That mobile number is linked to more than one canonical client, so I will not guess or create another record. Send a different mobile number or type 0 to cancel.' };
        }
        if (!outcome.client?.id) {
          return { handled: true, reply: 'I could not safely reserve this new client right now. Nothing was created. Please try again or type 0 to cancel.' };
        }

        const wasCreated = outcome.status === 'created';
        const provisionalClientId = wasCreated ? outcome.client.id : null;
        await exported.setSession(key, {
          ...session,
          step: 'client-query',
          provisionalName: undefined,
          provisionalAdminId: undefined,
        });
        const result = await originalProcess(sender, normalizedMobile);
        const after = await exported.getSession(key);

        if (wasCreated && after?.step === 'confirm') {
          await exported.setSession(key, {
            ...after,
            provisionalClientId,
            provisionalAdminId: session.provisionalAdminId,
          });
        } else if (wasCreated) {
          await cleanupUnusedProvisionalClient({
            clientId: provisionalClientId,
            adminId: session.provisionalAdminId,
            reason: 'booking_prepare_failed',
          });
        }

        if (wasCreated && result?.interactive?.body) {
          result.interactive = {
            ...result.interactive,
            body: `✅ New client reserved in CRM with an incomplete profile.\n\n${result.interactive.body}`,
          };
        } else if (wasCreated && result?.reply) {
          result.reply = `✅ New client reserved in CRM with an incomplete profile.\n\n${result.reply}`;
        }
        return result;
      }

      const before = session;
      const result = await originalProcess(sender, text);

      if (before?.step === 'confirm' && before.provisionalClientId && isBookingCancel(raw)) {
        await cleanupUnusedProvisionalClient({
          clientId: before.provisionalClientId,
          adminId: before.provisionalAdminId,
          reason: 'booking_cancelled',
        });
      }

      if (
        before?.step === 'client-query' &&
        result?.handled === true &&
        typeof result.reply === 'string' &&
        result.reply.startsWith("I couldn't find a canonical CRM client matching")
      ) {
        const provisionalName = candidateNameFromQuery(raw);
        await exported.setSession(key, {
          ...before,
          step: 'provisional-client-offer',
          provisionalName,
          provisionalAdminId: result.admin?.id || null,
        });
        return { handled: true, admin: result.admin, interactive: noMatchOffer(provisionalName) };
      }
      return result;
    };

    Object.defineProperty(exported, '__provisionalClientBookingPatched', { value: true });
  }
  return exported;
};

module.exports = { candidateNameFromQuery, noMatchOffer, mobilePrompt, isBookingCancel };
