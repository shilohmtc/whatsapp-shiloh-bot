const CLINIC_REDIRECT =
  "I'm Shiloh, the assistant for Shiloh Massage Therapy & Aesthetic Clinic. I can help with our treatments, services, prices, bookings, policies and other clinic-related questions. How can I help you with Shiloh today?";

const obviousOffTopicPatterns = [
  /\b(?:write|debug|fix)\s+(?:my\s+)?(?:code|javascript|python|sql|program)\b/i,
  /\b(?:politics|election|president|parliament|government news)\b/i,
  /\b(?:weather|forecast|temperature)\b/i,
  /\b(?:recipe|cook|bake)\b/i,
  /\b(?:homework|algebra|calculus|physics problem|chemistry problem)\b/i,
  /\b(?:bitcoin|crypto|stock market|forex)\b/i,
  /\b(?:tell me a joke|write me a poem|write a story)\b/i,
  /\b(?:football|soccer|rugby|cricket score)\b/i,
];

const clinicPatterns = [
  /\bshiloh\b/i,
  /\b(?:clinic|massage|therapy|therapist|treatment|facial|aesthetic|spa|waxing|nails?|piercing|pressotherapy|body treatment)\b/i,
  /\b(?:swedish|deep tissue|hot stone|couples? massage|back massage|neck massage|foot massage)\b/i,
  /\b(?:book|booking|appointment|availability|available|cancel|cancellation|reschedule|no[- ]?show)\b/i,
  /\b(?:price|prices|cost|fee|fees|special|discount|loyalty|voucher)\b/i,
  /\b(?:opening hours|open today|open tomorrow|close|closing time|address|location|directions|contact)\b/i,
  /\b(?:sore|pain|tension|tight|stiff|stress|relax|relaxation|muscle|back|neck|shoulder|legs?|feet|skin)\b/i,
  /\b(?:pressure|gentle|firm|deep pressure|sensitive skin|allergy|pregnant|pregnancy)\b/i,
  /\b(?:before|after)\s+(?:my\s+)?(?:massage|treatment|facial|appointment|session)\b/i,
];

const conversationalPatterns = [
  /^\s*(?:hi|hello|hey|good morning|good afternoon|good evening)\b/i,
  /^\s*(?:thanks|thank you|thankyou|okay|ok|great|perfect|yes|no|sure)\b/i,
  /^\s*(?:please|sorry|excuse me)\b/i,
];

function evaluateClinicScope(message = "") {
  const text = String(message).trim();
  if (!text) return { allowed: true, reason: "empty" };

  if (conversationalPatterns.some((pattern) => pattern.test(text))) {
    return { allowed: true, reason: "conversation" };
  }

  if (clinicPatterns.some((pattern) => pattern.test(text))) {
    return { allowed: true, reason: "clinic" };
  }

  if (obviousOffTopicPatterns.some((pattern) => pattern.test(text))) {
    return { allowed: false, reason: "off_topic" };
  }

  // Ambiguous messages are allowed through to the model, where the strict
  // clinic-only instructions make the final scope decision. This preserves
  // natural follow-ups such as "What would you recommend for me?".
  return { allowed: true, reason: "ambiguous" };
}

module.exports = {
  CLINIC_REDIRECT,
  evaluateClinicScope,
};
