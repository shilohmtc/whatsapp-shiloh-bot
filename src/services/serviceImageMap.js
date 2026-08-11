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

const deviceFacials = new Set([
  'Derma Fusion Clarity Facial',
]);

function resolveImageKey(serviceName) {
  if (exact.has(serviceName)) return exact.get(serviceName);
  if (massageNames.has(serviceName)) return 'massage-general';
  if (premiumFacials.has(serviceName)) return 'facial-premium';
  if (deviceFacials.has(serviceName)) return 'facial-device';
  if (serviceName === 'Facial Lymphatic Drainage Massage') return 'facial-general';
  // All remaining active names in the current catalogue are facial/skincare services.
  return 'facial-general';
}

function resolveServiceImageUrl(serviceName) {
  return `${IMAGE_BASE}/${resolveImageKey(serviceName)}.webp`;
}

module.exports = { resolveImageKey, resolveServiceImageUrl };
