const { sendWhatsAppMessage } = require("../services/whatsapp");
const { generateReply } = require("../services/ai");
const { updateProfileFromMessage } = require("../services/profileExtractor");
const { CLINIC_REDIRECT, evaluateClinicScope } = require("../services/scopeGuard");
const { processBookingMessage } = require("../services/bookingIntent");
const { processAppointmentChangeMessage } = require("../services/appointmentChange");
const { processCustomerExperienceMessage } = require("../services/customerExperience");
const { processClientIdentityMessage } = require("../services/clientIdentityOnboarding");
const {
  forceMatchedClientNameConfirmation,
  guardActiveNameConfirmation,
} = require("../services/identityOnboardingGuard");
const logger = require("../lib/logger");

function maskPhone(phone = "") {
  return phone.length > 4 ? `***${phone.slice(-4)}` : "***";
}

function isGreetingOnly(text = "") {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(
    String(text).trim()
  );
}

exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    (req.log || logger).info("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  (req.log || logger).warn("WhatsApp webhook verification rejected");
  return res.sendStatus(403);
};

exports.receiveWebhook = async (req, res) => {
  const log = req.log || logger;

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages) return res.sendStatus(200);

    const message = value.messages[0];
    if (message.type !== "text") {
      log.info({ messageType: message.type }, "Ignoring unsupported WhatsApp message");
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body?.trim();
    if (!from || !text) {
      log.warn("Received malformed WhatsApp text message");
      return res.sendStatus(200);
    }

    log.info({ from: maskPhone(from) }, "Processing incoming WhatsApp message");

    try {
      // Satisfaction replies remain first because they can be a single number or
      // private free-form feedback and must not be mistaken for onboarding input.
      const customerExperience = await processCustomerExperienceMessage(from, text);
      if (customerExperience.handled) {
        log.info(
          {
            from: maskPhone(from),
            experienceStatus: customerExperience.experience?.status,
            rating: customerExperience.experience?.rating,
          },
          "Handled customer-experience conversation"
        );
        await sendWhatsAppMessage(from, customerExperience.reply);
        return res.sendStatus(200);
      }

      // If an existing historical client is being onboarded, verify the claimed name
      // against the linked canonical client before the onboarding service can write
      // DOB/contact data or change the client display name.
      const nameGuard = await guardActiveNameConfirmation(from, text);
      if (nameGuard.handled) {
        log.warn({ from: maskPhone(from) }, "Blocked onboarding identity-name mismatch");
        await sendWhatsAppMessage(from, nameGuard.reply);
        return res.sendStatus(200);
      }

      // Canonical identity/onboarding runs before the scope guard so required answers
      // such as a name, phone number or date of birth are accepted as valid workflow input.
      const identity = await processClientIdentityMessage(from, text);
      if (identity.handled) {
        log.info(
          {
            from: maskPhone(from),
            identityStatus: identity.identityStatus,
            onboardingComplete: Boolean(identity.onboardingComplete),
          },
          "Handled canonical client identity/onboarding conversation"
        );

        let reply = identity.reply;

        // A phone match is useful for recognition but is not enough evidence to update
        // an incomplete historical client. Require the sender to confirm the matched
        // client's name before collecting or persisting further identity fields.
        if (identity.identityStatus === "matched_incomplete" && identity.client?.id) {
          const forced = await forceMatchedClientNameConfirmation(from, identity.client.id);
          if (forced) {
            reply = `Welcome back, ${identity.client.display_name}. Before I can continue with the booking, please confirm your full name.`;
          }
        }

        if (identity.onboardingComplete && identity.resumeBooking) {
          const booking = await processBookingMessage(from, "I want to book an appointment");
          if (booking.handled && booking.reply) {
            reply = `${reply}\n\n${booking.reply}`;
          }
        }

        await sendWhatsAppMessage(from, reply);
        return res.sendStatus(200);
      }

      // Recognition and onboarding are intentionally separate. A unique canonical
      // client may be welcomed by name even when DOB/contact verification is still
      // incomplete; those missing fields remain mandatory at the booking gate.
      if (
        identity.identityStatus === "matched_incomplete" &&
        identity.client?.display_name &&
        isGreetingOnly(text)
      ) {
        log.info(
          { from: maskPhone(from), identityStatus: identity.identityStatus },
          "Recognized incomplete canonical client greeting"
        );
        await sendWhatsAppMessage(
          from,
          `Welcome back, ${identity.client.display_name} 👋 How can I help you today?`
        );
        return res.sendStatus(200);
      }

      const scope = evaluateClinicScope(text);
      if (!scope.allowed) {
        log.info(
          { from: maskPhone(from), scopeReason: scope.reason },
          "Redirecting off-topic WhatsApp request"
        );
        await sendWhatsAppMessage(from, CLINIC_REDIRECT);
        return res.sendStatus(200);
      }

      const appointmentChange = await processAppointmentChangeMessage(from, text);
      if (appointmentChange.handled) {
        log.info(
          {
            from: maskPhone(from),
            action: appointmentChange.intent?.action,
            changeStatus: appointmentChange.intent?.status,
          },
          "Handled appointment-change conversation"
        );
        await sendWhatsAppMessage(from, appointmentChange.reply);
        return res.sendStatus(200);
      }

      const booking = await processBookingMessage(from, text);
      if (booking.handled) {
        log.info(
          { from: maskPhone(from), bookingStatus: booking.intent?.status },
          "Handled booking-intent conversation"
        );
        await sendWhatsAppMessage(from, booking.reply);
        return res.sendStatus(200);
      }

      await updateProfileFromMessage(from, text);
      const reply = await generateReply(from, text);
      await sendWhatsAppMessage(from, reply);
    } catch (error) {
      log.error({ err: error, from: maskPhone(from) }, "Failed to process WhatsApp message");
      try {
        await sendWhatsAppMessage(
          from,
          "Sorry, I'm having trouble responding right now. Please try again in a moment."
        );
      } catch (fallbackError) {
        log.error({ err: fallbackError }, "Failed to send WhatsApp fallback message");
        return res.sendStatus(500);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    log.error({ err: error }, "Unhandled WhatsApp webhook error");
    return res.sendStatus(500);
  }
};
