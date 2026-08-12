const { sendWhatsAppMessage, sendWhatsAppReplyButtons, sendWhatsAppList } = require('../services/whatsapp');
const { generateReply } = require('../services/ai');
const { updateProfileFromMessage } = require('../services/profileExtractor');
const { CLINIC_REDIRECT, evaluateClinicScope } = require('../services/scopeGuard');
const { processBookingMessage } = require('../services/bookingIntent');
const { processBookingPolicyMessage, sanitizeBookingReply } = require('../services/bookingPolicy');
const { commandForClientBookingButton, decorateClientBookingResult } = require('../services/clientBookingInteractive');
const { processClientAvailabilityMessage } = require('../services/clientBookingAvailability');
const { guardBookingConfirmationIdentity, ensureBookingIdentity } = require('../services/clientBookingIdentityGate');
const { guardClientFreelancerBooking } = require('../services/clientBookingStaffGuard');
const { guardEnglishOnly } = require('../services/englishLanguageGuard');
const { processAppointmentChangeMessage } = require('../services/appointmentChange');
const { processCustomerExperienceMessage } = require('../services/customerExperience');
const { processCustomerCareMessage } = require('../services/customerCare');
const { processClientIdentityMessage } = require('../services/clientIdentityOnboarding');
const { processClientDiscoveryMessage } = require('../services/clientDiscoveryMenu');
const { forceMatchedClientNameConfirmation, guardActiveNameConfirmation } = require('../services/identityOnboardingGuard');
const { processAdminClientTestModeControl } = require('../services/adminClientTestMode');
const logger = require('../lib/logger');

function maskPhone(phone = '') { return phone.length > 4 ? `***${phone.slice(-4)}` : '***'; }
function isGreetingOnly(text = '') { return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(String(text).trim()); }

function inboundText(message) {
  if (message?.type === 'text') return message.text?.body?.trim() || null;
  if (message?.type === 'interactive' && message.interactive?.type === 'button_reply') {
    const id = message.interactive.button_reply?.id?.trim() || '';
    return commandForClientBookingButton(id) || id || null;
  }
  if (message?.type === 'interactive' && message.interactive?.type === 'list_reply') {
    return message.interactive.list_reply?.id?.trim() || null;
  }
  return null;
}

async function sendClientResult(to, result) {
  if (result?.interactive?.type === 'list') {
    return sendWhatsAppList(
      to,
      result.interactive.body,
      result.interactive.buttonText || result.interactive.button,
      result.interactive.rows || result.interactive.sections?.[0]?.rows,
      result.interactive.sectionTitle || result.interactive.sections?.[0]?.title
    );
  }
  if (result?.interactive?.type === 'button' || result?.interactive?.buttons) {
    return sendWhatsAppReplyButtons(to, result.interactive.body, result.interactive.buttons);
  }
  return sendWhatsAppMessage(to, result?.reply || 'Sorry, Shiloh could not render that response.');
}

async function processClientStack(from, text, log) {
  const customerExperience = await processCustomerExperienceMessage(from, text);
  if (customerExperience.handled) {
    await sendWhatsAppMessage(from, customerExperience.reply);
    return true;
  }

  const customerCare = await processCustomerCareMessage(from, text);
  if (customerCare.handled) {
    await sendWhatsAppMessage(from, customerCare.reply);
    return true;
  }

  const nameGuard = await guardActiveNameConfirmation(from, text);
  if (nameGuard.handled) {
    await sendWhatsAppMessage(from, nameGuard.reply);
    return true;
  }

  const identity = await processClientIdentityMessage(from, text);
  if (identity.handled) {
    let reply = identity.reply;
    if (identity.identityStatus === 'matched_incomplete' && identity.client?.id) {
      const forced = await forceMatchedClientNameConfirmation(from, identity.client.id);
      if (forced) reply = `Welcome back, ${identity.client.display_name}. Before I can continue with the booking, please confirm your full name.`;
    }
    if (identity.onboardingComplete && identity.resumeBooking) {
      const booking = decorateClientBookingResult(await processBookingMessage(from, 'I want to book an appointment'));
      if (booking.handled && booking.interactive) {
        booking.interactive = { ...booking.interactive, body: `${reply}\n\n${booking.interactive.body}` };
        await sendClientResult(from, booking);
        return true;
      }
      if (booking.handled && booking.reply) reply = `${reply}\n\n${sanitizeBookingReply(booking.reply)}`;
    }
    await sendWhatsAppMessage(from, reply);
    return true;
  }

  if (identity.identityStatus === 'matched_incomplete' && identity.client?.display_name && isGreetingOnly(text)) {
    await sendWhatsAppMessage(from, `Welcome back, ${identity.client.display_name} 👋 How can I help you today?`);
    return true;
  }

  const clientDiscovery = await processClientDiscoveryMessage(from, text);
  if (clientDiscovery.handled) {
    await sendClientResult(from, clientDiscovery);
    return true;
  }

  const clientAvailability = await processClientAvailabilityMessage(from, text);
  if (clientAvailability.handled) {
    if (clientAvailability.intent?.status === 'awaiting_confirmation') {
      const availabilityIdentity = await ensureBookingIdentity(from);
      if (!availabilityIdentity.ready) {
        await sendWhatsAppMessage(from, availabilityIdentity.reply);
        return true;
      }
    }
    await sendClientResult(from, clientAvailability);
    return true;
  }

  const scope = evaluateClinicScope(text);
  if (!scope.allowed) {
    await sendWhatsAppMessage(from, CLINIC_REDIRECT);
    return true;
  }

  const freelancerGuard = await guardClientFreelancerBooking(text);
  if (freelancerGuard.blocked) {
    log.info({ from: maskPhone(from), staff: freelancerGuard.staff?.display_name || null }, 'Blocked client freelancer booking request in Client Test Mode');
    await sendWhatsAppMessage(from, freelancerGuard.reply);
    return true;
  }

  const appointmentChange = await processAppointmentChangeMessage(from, text);
  if (appointmentChange.handled) {
    await sendWhatsAppMessage(from, appointmentChange.reply);
    return true;
  }

  const bookingIdentity = await guardBookingConfirmationIdentity(from, text);
  if (bookingIdentity.handled) {
    await sendWhatsAppMessage(from, bookingIdentity.reply);
    return true;
  }

  const bookingPolicy = await processBookingPolicyMessage(from, text);
  if (bookingPolicy.handled) {
    await sendWhatsAppMessage(from, bookingPolicy.reply);
    return true;
  }

  const booking = decorateClientBookingResult(await processBookingMessage(from, text));
  if (booking.handled) {
    await sendClientResult(from, booking.interactive ? booking : { ...booking, reply: sanitizeBookingReply(booking.reply) });
    return true;
  }

  await updateProfileFromMessage(from, text);
  const reply = await generateReply(from, text);
  await sendWhatsAppMessage(from, reply);
  return true;
}

async function clientTestModeWebhook(req, res, next) {
  const log = req.log || logger;
  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages) return next();
    const message = value.messages[0];
    const from = message.from;
    const text = inboundText(message);
    if (!from || !text) return next();

    const mode = await processAdminClientTestModeControl(from, text);
    if (mode.handled) {
      log.info({ from: maskPhone(from), active: mode.active }, 'Handled Jean-Pierre Client Test Mode control');
      await sendWhatsAppMessage(from, mode.reply);
      return res.sendStatus(200);
    }
    if (!mode.active) return next();

    const language = await guardEnglishOnly(text);
    if (!language.allowed) {
      await sendWhatsAppMessage(from, language.reply);
      return res.sendStatus(200);
    }

    log.info({ from: maskPhone(from), messageType: message.type }, 'Processing message through Client Test Mode client stack');
    await processClientStack(from, text, log);
    return res.sendStatus(200);
  } catch (error) {
    log.error({ err: error }, 'Client Test Mode pre-controller failed closed');
    return res.sendStatus(500);
  }
}

module.exports = { clientTestModeWebhook, inboundText, processClientStack, sendClientResult };
