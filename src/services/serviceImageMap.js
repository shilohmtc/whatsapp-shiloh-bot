const IMAGE_BASE = '/assets/service-images';

const exact = new Map([
  ['Medi-Heel Pedicure (No Gel Toes) & Foot Massage', 'foot-care'],
  ['Medi-Heel Pedicure (With Gel Toes) & Foot Massage', 'foot-care'],
  ['Renew & Revive Leg and Foot Massage', 'foot-care'],
  ['Hot Stone Massage', 'hot-stone'],
  ['Permanent Makeup - Eyeliner', 'permanent-makeup'],
  ['Permanent Makeup - Brows', 'permanent-makeup'],
  ['Permanent Makeup - Lips', 'permanent-makeup'],
  ['Areola Reconstruction', 'consultation'],
  ['Stretch Mark Microneedling Consultation', 'consultation'],
  ['VHC Standard Needling with Vitamins under Local Anesthetic.', 'microneedling'],
  ['GF Needling with Growth Factors under Local Anesthetic', 'microneedling'],
  ['Profosma Jet Plasma', 'advanced-aesthetics'],
  ['Plasma Fybroblast', 'consultation'],
  ['Priced according to area', 'consultation'],
  ['Ozone & Far Infrared Therapy', 'wellness-heat'],
  ['1. SQT Anti-Aging Rejuvenation BioMicroneedling + SQT Revitalizing Beauty BioMicroneedling', 'facial-technology'],
  ['2. SQT Resurfacing BioMicroneedling + SQT Nourishing Hydrating BioMicroneedling', 'facial-technology'],
  ['HIFU (High-Intensity Focused Ultrasound)', 'advanced-aesthetics'],
  ['Pelvic Floor Strengthening', 'consultation'],
  ['HIFU', 'consultation'],
]);

const massageNames = new Set([
  'Full Body Swedish',
  'Sports Massage Full Body',
  'Quick Relief: Back & Neck (45 min)',
  'Targeted Area-Specific Sports Massage',
  'Upper Back, Neck & Jaw Release',
  'Soothing & Restorative Pregnancy Massage',
  'Full Body Sports Massage',
  'Lower Back, Hip & Psoas Release',
  'Cupping Area Specific',
  'Bamboo Sports Massage - Area Specific',
  'Lymphatic Drainage Reset Package',
]);

const premiumFacials = new Set([
  'Eternal Glow Facial',
  'Lip Plump Treatment',
  'Sculpt Deluxe',
  'Contour Lift Facial',
  'Hybrid Facial',
  'Firm & Lift',
]);

const deviceFacials = new Set(['Derma Fusion Clarity Facial']);

const generalFacials = new Set([
  'Hydrate & Plump Facial',
  'Formulage Brightening Peel',
  'Dermaplane Facial',
  'Derma Peel Brightening',
  'Calm & Clear Facial',
  'Brightening Facial (Pigmentation)',
  'Acne Detox Facial',
  'Basic Facial - Acne / Congested / Hormonal Breakout',
  'Basic Facial - Hydration / Pigmentation Targeted',
  'Clarity Facial (Blackheads, Whiteheads & Acne)',
  'Facial Lymphatic Drainage Massage',
]);

function resolveImageKey(serviceName) {
  if (exact.has(serviceName)) return exact.get(serviceName);
  if (massageNames.has(serviceName)) return 'massage-general';
  if (premiumFacials.has(serviceName)) return 'facial-premium';
  if (deviceFacials.has(serviceName)) return 'facial-device';
  if (generalFacials.has(serviceName)) return 'facial-general';
  return null;
}

function resolveServiceImageUrl(serviceName) {
  const key = resolveImageKey(serviceName);
  return key ? `${IMAGE_BASE}/${key}.webp` : null;
}

module.exports = { resolveImageKey, resolveServiceImageUrl };
