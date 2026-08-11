function normalize(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

const GROUPS = [
  {
    key: "massage",
    matches: ["massage", "cupping", "back & neck", "back, neck", "jaw release", "psoas release", "lymphatic drainage"],
    aftercare: "For the rest of today, keep things gentle, hydrate normally, and follow any therapist-specific advice you were given. Mild temporary tenderness can happen after focused bodywork; if anything feels unusual or concerning, please contact the clinic.",
    rebook: "For ongoing massage goals, many clients prefer a regular rhythm rather than waiting for tension to build up again. A follow-up in about 2–4 weeks can be a useful starting point, adjusted to how you feel and your therapist’s recommendation.",
  },
  {
    key: "facial",
    matches: ["facial", "dermaplane", "peel", "lip plump", "sculpt deluxe", "firm & lift", "contour lift"],
    aftercare: "Keep your skincare gentle after today’s treatment, avoid adding new strong actives immediately, use daily sun protection, and follow the practitioner-specific aftercare you received. If your skin reacts more strongly than expected, contact the clinic before adding products or treatments.",
    rebook: "For routine facial maintenance, a follow-up around 4–6 weeks is often a practical planning point. Peels and advanced facial protocols may need a different interval, so Shiloh can confirm timing from your treatment plan.",
  },
  {
    key: "foot-care",
    matches: ["pedicure", "foot massage"],
    aftercare: "Keep your feet comfortable and clean, moisturise as advised, and avoid picking at treated skin. If you were given product or home-care instructions, follow those first.",
    rebook: "For ongoing foot-care maintenance, many clients plan their next visit in roughly 4–6 weeks, depending on nail growth, skin condition and personal preference.",
  },
  {
    key: "permanent-makeup",
    matches: ["permanent makeup", "areola reconstruction"],
    aftercare: "Please follow the practitioner’s written aftercare exactly for pigment treatments and avoid improvising with additional products on the treated area. Healing and colour development vary by treatment and person; contact the clinic if you are unsure about anything during healing.",
    rebook: "Permanent-makeup follow-up timing is treatment-specific. Please use the review or touch-up timing given by your practitioner rather than booking a generic interval.",
  },
  {
    key: "needling",
    matches: ["microneedling", "needling", "biomicroneedling", "sqt"],
    aftercare: "Use only the post-treatment skincare advised by your practitioner, keep sun protection consistent, and avoid introducing strong or irritating products until your skin has settled. If you have unexpected or worsening symptoms, contact the clinic for treatment-specific guidance.",
    rebook: "Needling programmes are planned around the treatment type, skin response and clinical goal. Please rebook according to the interval set by your practitioner rather than using a fixed generic schedule.",
  },
  {
    key: "advanced-aesthetics",
    matches: ["hifu", "plasma", "profosma", "fibroblast", "ozone & far infrared", "pelvic floor", "vaginal tightening", "rejuvenation"],
    aftercare: "Please follow the practitioner-specific aftercare and suitability guidance you were given for this treatment. Advanced treatments can have different precautions and recovery expectations, so contact the clinic before adding extra treatments or products if you are uncertain.",
    rebook: "Your next session should follow the treatment plan confirmed by your practitioner. Shiloh can help you rebook once that recommended interval is due.",
  },
];

function getTreatmentAftercare(serviceText) {
  const service = normalize(serviceText);
  if (!service) return null;
  const group = GROUPS.find((item) => item.matches.some((needle) => service.includes(needle)));
  if (!group) return null;
  return { key: group.key, aftercare: group.aftercare, rebook: group.rebook };
}

function buildGuidance(serviceText, { includeRebooking = true } = {}) {
  const guidance = getTreatmentAftercare(serviceText);
  if (!guidance) return "";
  const lines = ["", "🌿 *Aftercare*", guidance.aftercare];
  if (includeRebooking) lines.push("", "📅 *When to rebook*", guidance.rebook);
  return lines.join("\n");
}

module.exports = { getTreatmentAftercare, buildGuidance };
