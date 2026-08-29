const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const migration = source('migrations/075_goldie_wave_a_customer_descriptions.sql');
const bootstrap = source('src/services/goldieWaveAPublicationBootstrap.js');
const ensureScript = source('scripts/ensure-goldie-wave-a-publication.js');
const packageJson = JSON.parse(source('package.json'));
const {
  TARGET_IDS,
  SOURCE_EXPORT_SHA256,
  parseApprovedTargets,
} = require('../src/services/goldieWaveAPublicationBootstrap');

const EXPECTED_IDS = [
  '082a3806-3b46-4469-88b8-68b5df95e82b',
  '592f0d7d-5a54-4f01-a7ee-c10fb0715140',
  '1c7cdc7c-67b2-4c44-b999-1b900d27ca3c',
  '8caf9baa-c5b0-4b8a-b45e-b10ca2367c50',
  '3a5d1f78-4213-401a-b279-e674608c5c5b',
  '178ff19a-a260-4915-af76-09c4f6884c39',
  'ca73086c-7a7a-47f8-90e4-992dfc8dd040',
  'd2adf221-5d19-43ff-bd7b-281aa21b2428',
  'f87d46dc-f525-409e-beb2-784c56769ae6',
  '0dd673be-ab70-4694-8727-08debcae60b5',
  '598c88c9-af8b-47b4-a22f-b2af1a905cfd',
  '975999ce-a6cc-45c4-a0ed-9f4de0f3ec5b',
  '71d29944-2474-4034-a232-5b14503c5eda',
  'a5af84f7-e1d3-4e5f-afef-a1e7a26e4caa',
  '29a37095-3263-4ce2-a3b5-2b6525804de5',
  'f3e682e1-6a03-4623-83e6-935752b27196',
  '7537cf00-0777-44a0-a04a-ce2ff3fbf2a6',
  '175c91c9-562e-4aa7-87eb-8f918462ce7f',
  '3f92913f-e670-4a75-8f0a-fc2d9d401eb5',
  'cf51772d-9dbc-48c4-98d4-4fbc50fefbde',
];

const FORBIDDEN_HELD_IDS = [
  // Wave B / scope / high-risk examples.
  'e4510fa9-579f-46dd-8fff-107c00748597',
  '8814ad67-f670-4c4b-ae22-2cb1233afb96',
  '074c7773-2e78-4761-a9c6-c72dc02f7994',
  '9726c400-234d-489a-9e5c-d247c21e4a85',
  '49730b6c-133d-4e60-b98c-d33a1091d02d',
  'c830d602-0e71-499e-9348-114584c8a985',
  '46043512-d1df-4169-92b4-132160fca809',
  'e8c5bf09-c583-4bcc-9da9-a560180cf776',
  '69805dfe-8238-47d2-8b1d-f154f0033e27',
  '61a0a7db-426d-4ecf-94ff-9fd6855f384d',
  '2d5b6147-ee9f-4a97-8e27-6270751c2673',
  '406d85e9-4d36-42d3-9611-ab1834038662',
  '409ef0e8-2063-47b2-86db-ca0af30787de',
  '367dbc36-5af0-43e3-a3b5-2b6525804de5',
  'c97eda93-c42f-471c-a1fc-5f35207c0c86',
  'c7b12afc-a0ba-497b-affb-ab03b2958a73',
  '068c0963-27db-418c-ad44-3a10431076b7',
  '0c86a08f-68e9-49f6-a33d-6ff5bc9870ea',
  // Wave C truth/blank/corruption gates.
  '46a55851-84cf-491e-a7a3-ed19b2817e1e',
  '7030909c-df55-4c38-bb44-ce7b57b74cd5',
  'f21db849-78c6-45a5-ab87-fa99050fb495',
  '9f2f6452-f1ce-4525-88f2-3dc57f74caa6',
  'b5c96105-f534-406d-89ec-68e78c65cf8b',
  '21a1fc85-6a5b-433e-b689-7bff12c7e2af',
  '729fc549-c353-48ac-9cbc-abba4cc2ed66',
  'b39dcaf1-7894-40e0-8a51-c7ab4eba553a',
  '6a0c9c5e-d7e7-4a82-8795-e8281a0bd526',
  'd42f5e34-b3c1-4ff3-9206-0fc97823d02e',
  '90baece3-1520-4368-b772-eaba08e1a511',
  '1d734e8b-d21e-44c3-9a3f-b2a7165a7787',
];

test('Wave A contract is exactly the 20 PR #441 Goldie IDs and retained source SHA', () => {
  assert.equal(SOURCE_EXPORT_SHA256, 'fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16');
  assert.deepEqual([...TARGET_IDS].sort(), [...EXPECTED_IDS].sort());
  assert.equal(new Set(TARGET_IDS).size, 20);
  assert.match(migration, new RegExp(SOURCE_EXPORT_SHA256));

  const parsed = parseApprovedTargets(migration);
  assert.equal(parsed.size, 20);
  assert.deepEqual([...parsed.keys()].sort(), [...EXPECTED_IDS].sort());
});

test('Wave B and Wave C IDs are structurally unreachable from the publication migration', () => {
  const parsed = parseApprovedTargets(migration);
  for (const id of FORBIDDEN_HELD_IDS) {
    assert.equal(parsed.has(id), false, `held ID ${id} must not be a Wave A target`);
  }
  assert.match(migration, /WHERE s\.external_source = 'goldie'[\s\S]*AND s\.external_id = a\.external_id/);
  assert.doesNotMatch(migration, /SET\s+(?:status|name|price|display_price|duration_minutes|processing_time_minutes|extra_time_minutes|booking_note)\s*=/i);
  assert.doesNotMatch(migration, /(?:INSERT|DELETE)\s+(?:INTO\s+)?(?:staff_services|appointments|appointment_services|clients)\b/i);
});

test('the two mechanical rows contain only the authorized punctuation correction outcome', () => {
  const parsed = parseApprovedTargets(migration);
  const eyeliner = parsed.get('3f92913f-e670-4a75-8f0a-fc2d9d401eb5');
  const brows = parsed.get('cf51772d-9dbc-48c4-98d4-4fbc50fefbde');

  assert.match(eyeliner, /Thick line Top[\s\S]*Touch up – R2150 \(2H00\)/);
  assert.doesNotMatch(eyeliner, /Touch up – R2150 \(2H00\n/);
  assert.match(brows, /Touch up – R2150 \(2H00\)$/);
  assert.doesNotMatch(brows, /R2150\) \(2H00\)/);
});

test('verbatim examples retain exact Goldie source spelling, punctuation and line structure', () => {
  const parsed = parseApprovedTargets(migration);
  assert.equal(parsed.get('7537cf00-0777-44a0-a04a-ce2ff3fbf2a6'), 'Post Reconstructive Surgery –\nConsultation R400 (30Min)\nPrice on Quotation.');
  assert.equal(parsed.get('175c91c9-562e-4aa7-87eb-8f918462ce7f'), 'Brow wax – R80 (15min)\nBrow Tint – R80 (15Min)\nLip Wax Upper – R80 (15Min)\nLip Wax Bottom – R80 (15Min)\nBottom Lip & Chin Wax R120 (20Min)\nFull Face Wax – R500 (1H00)');
  assert.match(parsed.get('592f0d7d-5a54-4f01-a7ee-c10fb0715140'), /^Acne Congested\/Hormonal Break out skin:/);
  assert.match(parsed.get('71d29944-2474-4034-a232-5b14503c5eda'), /\(1h30\)$/);
});

test('bootstrap fails closed on target drift and preserves all non-description catalogue state', () => {
  assert.match(bootstrap, /Expected exactly 20 canonical Wave A service rows/);
  assert.match(bootstrap, /Duplicate canonical Wave A service mapping detected/);
  assert.match(bootstrap, /Unexpected current customer description for Wave A target/);
  assert.match(bootstrap, /Migration target .* inconsistent duplicate descriptions/);
  assert.match(bootstrap, /Migration contains unauthorized Wave A target/);
  assert.match(bootstrap, /Historical Waxing service must remain inactive and non-bookable/);
  assert.match(bootstrap, /Approved active Wave A service .* is not public-catalogue eligible/);
  assert.match(bootstrap, /Wave A target service metadata/);
  assert.match(bootstrap, /Wave A practitioner mappings/);
  assert.match(bootstrap, /Non-target service descriptions/);
  assert.match(bootstrap, /await client\.query\('BEGIN'\)/);
  assert.match(bootstrap, /await client\.query\('COMMIT'\)/);
  assert.match(bootstrap, /await client\.query\('ROLLBACK'\)/);
});

test('Wave A guard is verification-only and global authority gates app startup', () => {
  assert.match(ensureScript, /goldie_wave_a_publication_verified/);
  assert.match(ensureScript, /goldie_wave_a_publication_failed/);
  assert.match(ensureScript, /verifyMigrationFile/);
  assert.doesNotMatch(ensureScript, /ensureGoldieWaveAPublication/);

  const start = packageJson.scripts.start;
  const authority = start.indexOf('node scripts/verify-migrations.js');
  const app = start.lastIndexOf(' app.js');
  assert.ok(authority === 0 && app > authority);
  assert.doesNotMatch(start, /ensure-goldie-wave-a-publication/);
});
