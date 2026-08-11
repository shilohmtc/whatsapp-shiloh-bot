const { pool } = require("../db/pool");
const { processBookingMessage, clearIntent } = require("./bookingIntent");
const {
  POLICY_VERSION,
  processBookingPolicyMessage,
  sanitizeBookingReply,
} = require("./bookingPolicy");

const SYNTHETIC_PHONE = "__shiloh_booking_policy_test__";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  await pool.query("DELETE FROM booking_policy_acceptances WHERE phone = $1", [SYNTHETIC_PHONE]);
  await clearIntent(SYNTHETIC_PHONE);
}

async function getActiveServiceName() {
  const result = await pool.query(
    `SELECT name
     FROM services
     WHERE status = 'active'
     ORDER BY id
     LIMIT 1`
  );
  if (!result.rows[0]?.name) throw new Error("No active CRM service available for booking-policy self-test");
  return result.rows[0].name;
}

async function runBookingPolicySelfTest() {
  const transcript = [];
  await cleanup();

  try {
    const service = await getActiveServiceName();
    const start = await processBookingMessage(
      SYNTHETIC_PHONE,
      `I want to book ${service} on 25 August 2026 at 10:00 with Christel`
    );
    const startReply = sanitizeBookingReply(start.reply || "");
    transcript.push({ step: "booking_summary", reply: startReply });

    assert(start.handled === true, "Booking request was not handled");
    assert(/Please check these booking preferences/i.test(startReply), "Booking summary was not produced");
    assert(!/Goldie/i.test(startReply), "Legacy Goldie wording leaked into production booking summary");
    assert(/Booking Policy & Terms/i.test(startReply), "Booking summary did not announce the policy gate");

    const showPolicy = await processBookingPolicyMessage(SYNTHETIC_PHONE, "YES");
    transcript.push({ step: "show_policy", reply: showPolicy.reply || "" });
    assert(showPolicy.handled === true, "YES did not enter the policy gate");
    assert((showPolicy.reply || "").includes(POLICY_VERSION), "Policy version was not displayed");
    assert(/I AGREE/i.test(showPolicy.reply || ""), "Explicit I AGREE instruction was not displayed");
    assert(!/Goldie/i.test(showPolicy.reply || ""), "Legacy Goldie wording leaked into policy display");

    const genericYes = await processBookingPolicyMessage(SYNTHETIC_PHONE, "yes");
    transcript.push({ step: "generic_yes_rejected", reply: genericYes.reply || "" });
    assert(genericYes.handled === true, "Generic yes was not handled by policy gate");
    assert(/explicit acceptance/i.test(genericYes.reply || ""), "Generic yes was not rejected as insufficient consent");

    const accepted = await processBookingPolicyMessage(SYNTHETIC_PHONE, "I AGREE");
    transcript.push({ step: "explicit_acceptance", reply: accepted.reply || "" });
    assert(accepted.handled === true, "Explicit acceptance was not handled");
    assert(/acceptance .* recorded/i.test(accepted.reply || ""), "Acceptance acknowledgement was not returned");
    assert(/not confirmed/i.test(accepted.reply || ""), "Acceptance reply did not preserve the no-confirmation safeguard");
    assert(!/Goldie/i.test(accepted.reply || ""), "Legacy Goldie wording leaked after acceptance");

    const audit = await pool.query(
      `SELECT policy_version, channel, service_text, preferred_date, preferred_time, therapist_text
       FROM booking_policy_acceptances
       WHERE phone = $1
       ORDER BY accepted_at DESC
       LIMIT 1`,
      [SYNTHETIC_PHONE]
    );
    const row = audit.rows[0];
    assert(Boolean(row), "No policy acceptance audit row was recorded");
    assert(row.policy_version === POLICY_VERSION, "Recorded policy version does not match current policy version");
    assert(row.channel === "whatsapp", "Recorded policy channel is not whatsapp");
    assert(Boolean(row.service_text && row.preferred_date && row.preferred_time), "Acceptance audit snapshot is incomplete");

    return {
      ok: true,
      synthetic: true,
      policyVersion: POLICY_VERSION,
      service,
      assertions: {
        bookingSummaryProduced: true,
        goldieAbsent: true,
        explicitPolicyGateDisplayed: true,
        genericYesRejected: true,
        explicitAgreementAccepted: true,
        acceptanceAuditRecorded: true,
        noAppointmentConfirmationClaim: true,
      },
      transcript,
    };
  } finally {
    await cleanup();
  }
}

module.exports = { runBookingPolicySelfTest, SYNTHETIC_PHONE };
