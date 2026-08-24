const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const migration = source('migrations/076_goldie_wave_b_customer_descriptions.sql');
const bootstrap = source('src/services/goldieWaveBPublicationBootstrap.js');
const ensureScript = source('scripts/ensure-goldie-wave-b-publication.js');
const packageJson = JSON.parse(source('package.json'));
const {
  TARGET_IDS,
  RETAINED_INACTIVE_IDS,
  SOURCE_EXPORT_SHA256,
  parseApprovedTargets,
} = require('../src/services/goldieWaveBPublicationBootstrap');

const EXPECTED = new Map([
  ['e4510fa9-579f-46dd-8fff-107c00748597', `An Elim MediHeel callus removal pedicure is a premium, 9-step treatment focused on stubborn, thick, and dead skin on the heels without blades. Using a specialized alkaline callus tonic, this restorative, luxurious spa experience includes ingredients like urea and AHA.
Key Features and Treatment Elements
• No Blades/Filing: Uses a keratolytic alkaline solution as part of the callus-care process.
• Tonic Application: A 10-minute application of the tonic forms part of the treatment.
• Treatment Ingredients: Features Alpha
Hydroxy Acids (AHA) and Urea as part of the treatment protocol.`],
  ['8814ad67-f670-4c4b-ae22-2cb1233afb96', `Tone Gel is a lightweight, fast-drying gel application for colour and shine, providing a polished nail finish.
+- 200 colours to choose from`],
  ['b534a8e5-3fe1-46e9-9ca0-bba116e6bf53', 'Medi-Heel Pedicure offers a blade-free 9-step foot-care treatment using AHA and urea, focused on callus care and hydration. Topped up with a Gel Application for colour and a polished finish.'],
  ['074c7773-2e78-4761-a9c6-c72dc02f7994', `Purpose: This is a non-surgical plasma-based aesthetic treatment for the face and body. It uses cold, low-atmospheric plasma. The device works without needles or anesthesia.

Face, Neck, Decolletage treatment:

Face to Jawline R5500 (1 Cycle = 3 treatments) 1h30 per treatment
Neck & decolletage R5500 (1Cycle = 3 treatments) 1h30 per treatment
R8500 (2 Cycles = 6 treatments)
R12500 (3 Cycles = 9 Treatments)

Body Treatment:
Consultation R400 (30Min)`],
  ['9726c400-234d-489a-9e5c-d247c21e4a85', `Plasma Fybroblast
Purpose: Fybroblast therapy is a plasma-based aesthetic treatment using a pen-like device that creates a small electric arc (plasma) just above the skin under local anesthesia. Plasma creates small, controlled superficial treatment points on the skin.

Tiny carbon crusts form on the spots treated, which typically fall off within a few days.`],
  ['49730b6c-133d-4e60-b98c-d33a1091d02d', 'Pressotherapy is a non-invasive compression treatment using a specialized suit fitted over the limbs and abdomen and connected to a controlled air-pressure system. During the session, the suit gently inflates and deflates in a rhythmic sequence, creating a massage-like compression experience.'],
  ['8d5ee63d-8caa-45aa-b2d3-2a91d2478672', `Ozone & Far Infrared Therapy.
Packages available.`],
  ['c830d602-0e71-499e-9348-114584c8a985', `1. SQT Anti-Aging Rejuvenation BioMicroneedling
Treatment focus:
• Mature-skin rejuvenation
• Fine-line and wrinkle appearance
• Firmness-focused skincare

Skin types/concerns considered during consultation:
• Mature Skin
• Dry Skin
• Sensitive Skin
• Combination Skin
R2585 (Full Face to Jawline) (1H30)
R2585 (Jawline to Breast) (1H30)

2. SQT Revitalizing Beauty BioMicroneedling
Treatment focus:
• Texture and tone-focused skincare
• Pigmentation appearance
• Revitalising skincare

Skin types/concerns considered during consultation:
• Hyperpigmentation
• Oily Skin
• Sensitive Skin & Compromised Skin
• Combination Skin
R1785(Full Face to Jawline) (1H30)
R1785 (Jawline to Breast) (1H30)`],
  ['46043512-d1df-4169-92b4-132160fca809', `A full-body sports massage using focused massage and stretch techniques across multiple muscle groups. The session is tailored to the client’s activity level, areas of tension, comfort and treatment goals.
Ideal for athletes, active individuals, or clients seeking focused bodywork across the full body.`],
  ['e8c5bf09-c583-4bcc-9da9-a560180cf776', `Purpose: Consultation to assess stretch-mark or scar concerns, discuss microneedling suitability, treatment planning and pricing.
Pricing on consultation R400 (30 min consultation)`],
  ['69805dfe-8238-47d2-8b1d-f154f0033e27', `Face, Neck & Decolletage
Purpose: HIFU (High Intensity Focused Ultrasound) is an ultrasound-based aesthetic treatment for the face, neck and decolletage. The treatment area, suitability and session plan are confirmed during assessment.

R2950 (Full Face to Jawline)
R900 (Neck)
Pre & Post in salon treatments included.`],
  ['61a0a7db-426d-4ecf-94ff-9fd6855f384d', 'Experience a relaxing 90-minute full body Swedish massage using gentle, rhythmic strokes tailored to your comfort and preferences.'],
  ['2d5b6147-ee9f-4a97-8e27-6270751c2673', 'Targeted Area Specific Sports Massage uses focused sports-massage techniques on a selected body area, tailored to the client’s comfort, activity level and treatment goals.'],
  ['406d85e9-4d36-42d3-9611-ab1834038662', 'A gentle full body soft-touch massage designed for pregnancy. Performed in a side-lying position with pregnancy pillows for comfort, the treatment focuses on areas such as the lower back and hips and uses slow, flowing massage movements for a calm, supportive treatment experience.'],
  ['409ef0e8-2063-47b2-86db-ca0af30787de', 'Experience our Cupping Area Specific therapy, using cupping techniques on a selected body region as part of a focused bodywork session. Treatment is tailored to the client’s comfort and treatment goals.'],
]);

const FORBIDDEN = [
  '367dbc36-5af0-43e3-a3ec-3e382cb4954a',
  'c97eda93-c42f-471c-a1fc-5f35207c0c86',
  'c7b12afc-a0ba-497b-affb-ab03b2958a73',
  '068c0963-27db-418c-ad44-3a10431076b7',
  '0c86a08f-68e9-49f6-a33d-6ff5bc9870ea',
  'b39dcaf1-7894-40e0-8a51-c7ab4eba553a',
  '6a0c9c5e-d7e7-4a82-8795-e8281a0bd526',
  'd42f5e34-b3c1-4ff3-9206-0fc97823d02e',
  '90baece3-1520-4368-b772-eaba08e1a511',
  '1d734e8b-d21e-44c3-9a3f-b2a7165a7787',
];

test('Wave B migration is exactly the 15 PR #447 IDs and exact approved descriptions', () => {
  assert.equal(SOURCE_EXPORT_SHA256, 'fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16');
  assert.equal(new Set(TARGET_IDS).size, 15);
  assert.deepEqual([...TARGET_IDS].sort(), [...EXPECTED.keys()].sort());
  assert.match(migration, new RegExp(SOURCE_EXPORT_SHA256));
  const parsed = parseApprovedTargets(migration);
  assert.equal(parsed.size, 15);
  assert.deepEqual(parsed, EXPECTED);
});

test('scope-gated high-risk and Wave C rows are structurally unreachable', () => {
  const parsed = parseApprovedTargets(migration);
  for (const id of FORBIDDEN) assert.equal(parsed.has(id), false, `held ID ${id} must not be a Wave B target`);
  assert.match(migration, /shiloh\.goldie_wave_b_authority[\s\S]*PR447/);
  assert.doesNotMatch(migration, /PR442/);
  assert.doesNotMatch(migration, /SET\s+(?:status|name|price|display_price|duration_minutes|processing_time_minutes|extra_time_minutes|booking_note)\s*=/i);
  assert.doesNotMatch(migration, /(?:INSERT|DELETE)\s+(?:INTO\s+)?(?:staff_services|appointments|appointment_services|clients)\b/i);
});

test('Toe Gel and Pressotherapy are the only retained inactive Wave B targets', () => {
  assert.deepEqual([...RETAINED_INACTIVE_IDS].sort(), [
    '49730b6c-133d-4e60-b98c-d33a1091d02d',
    '8814ad67-f670-4c4b-ae22-2cb1233afb96',
  ]);
  assert.match(bootstrap, /Retained inactive Wave B service .* must remain inactive, unmapped and non-bookable/);
  assert.match(bootstrap, /unexpectedly has practitioner mappings/);
  assert.match(bootstrap, /Approved active Wave B service .* is not public-catalogue eligible/);
});

test('MediHeel ownership remains exact current Christel-only authority', () => {
  assert.match(bootstrap, /MediHeel Wave B mapping .* must remain Christel-only and client-bookable/);
  assert.match(bootstrap, /e4510fa9-579f-46dd-8fff-107c00748597/);
  assert.match(bootstrap, /b534a8e5-3fe1-46e9-9ca0-bba116e6bf53/);
});

test('bootstrap fails closed on target source description and catalogue drift', () => {
  assert.match(bootstrap, /Expected exactly 15 canonical Wave B service rows/);
  assert.match(bootstrap, /Duplicate canonical Wave B service mapping detected/);
  assert.match(bootstrap, /Wave B canonical service name mismatch/);
  assert.match(bootstrap, /Unexpected current customer description for Wave B target/);
  assert.match(bootstrap, /Migration contains unauthorized Wave B target/);
  assert.match(bootstrap, /Migration is missing approved Wave B target/);
  assert.match(bootstrap, /source SHA does not match retained Goldie authority/);
  assert.match(bootstrap, /Wave B target service metadata/);
  assert.match(bootstrap, /Wave B practitioner mappings/);
  assert.match(bootstrap, /Non-target service descriptions/);
  assert.match(bootstrap, /await client\.query\('BEGIN'\)/);
  assert.match(bootstrap, /await client\.query\('COMMIT'\)/);
  assert.match(bootstrap, /await client\.query\('ROLLBACK'\)/);
});

test('generic migration execution cannot bypass PR #447 guarded bootstrap', () => {
  assert.match(migration, /current_setting\('shiloh\.goldie_wave_b_authority', true\)/);
  assert.match(migration, /requires guarded PR447 authority/);
  assert.match(bootstrap, /SET LOCAL shiloh\.goldie_wave_b_authority = 'PR447'/);
});

test('production start verifies Wave A then Wave B before app startup', () => {
  assert.match(ensureScript, /goldie_wave_b_publication_verified/);
  assert.match(ensureScript, /goldie_wave_b_publication_failed/);
  assert.match(ensureScript, /retainedInactiveUnmappedTargetCount/);
  const start = packageJson.scripts.start;
  const identity = start.indexOf('node scripts/ensure-client-identity-verification.js');
  const waveA = start.indexOf('node scripts/ensure-goldie-wave-a-publication.js');
  const waveB = start.indexOf('node scripts/ensure-goldie-wave-b-publication.js');
  const app = start.lastIndexOf(' app.js');
  assert.ok(identity >= 0 && waveA > identity && waveB > waveA && app > waveB);
});