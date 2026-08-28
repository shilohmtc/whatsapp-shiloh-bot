const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { SERVICE_RENAMES, CATEGORY_RENAMES } = require('../src/services/cataloguePolish');
const {
  SERVICE_FAMILIES,
  resolveServiceFamily,
  renderServiceFamilyIcon,
} = require('../src/presentation/calendarServiceFamilyVisuals');
const {
  renderCalendarCreateBookingPage,
  calendarCreateBookingClientScript,
} = require('../src/presentation/calendarCreateBookingUx');
const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');

const ROOT = path.join(__dirname, '..');

const EXPECTED_BY_FAMILY = Object.freeze({
  foot_pedicure: [
    'Medi-Heel Pedicure (No Gel Toes) & Foot Massage',
    'Medi-Heel Pedicure (With Gel Toes) & Foot Massage',
    'Renew & Revive Leg and Foot Massage',
  ],
  facial_skin: [
    'Derma Fusion Clarity Facial',
    'Hydrate & Plump Facial',
    'Formulage Brightening Peel',
    'Dermaplane Facial',
    'Eternal Glow Facial',
    'Derma Peel Brightening',
    'Lip Plump Treatment',
    'Sculpt Deluxe',
    'Contour Lift Facial',
    'Calm & Clear Facial',
    'Hybrid Facial',
    'Firm & Lift',
    'Brightening Facial (Pigmentation)',
    'Acne Detox Facial',
    'Basic Facial - Acne / Congested / Hormonal Breakout',
    'Basic Facial - Hydration / Pigmentation Targeted',
    'Clarity Facial (Blackheads, Whiteheads & Acne)',
    'Stretch Mark Microneedling Consultation',
    'VHC Standard Needling with Vitamins under Local Anesthetic.',
    'GF Needling with Growth Factors under Local Anesthetic',
    'Profosma Jet Plasma',
    'Plasma Fybroblast',
    'Priced according to area',
    '1. SQT Anti-Aging Rejuvenation BioMicroneedling + SQT Revitalizing Beauty BioMicroneedling',
    '2. SQT Resurfacing BioMicroneedling + SQT Nourishing Hydrating BioMicroneedling',
    'HIFU (High-Intensity Focused Ultrasound)',
  ],
  targeted_therapeutic: [
    'Quick Relief: Back & Neck (45 min)',
    'Targeted Area-Specific Sports Massage',
    'Lower Back, Hip & Psoas Release',
    'Cupping Area Specific',
    'Bamboo Sports Massage - Area Specific',
    'Upper Back, Neck & Jaw Release',
    'Ozone & Far Infrared Therapy',
    'Pelvic Floor Strengthening',
    'HIFU',
  ],
  massage_body: [
    'Full Body Swedish',
    'Facial Lymphatic Drainage Massage',
    'Sports Massage Full Body',
    'Hot Stone Massage',
    'Soothing & Restorative Pregnancy Massage',
    'Lymphatic Drainage Reset Package',
    'Sports Massage — Package Session',
    'Couples Massage',
  ],
  permanent_makeup_beauty: [
    'Permanent Makeup - Eyeliner',
    'Permanent Makeup - Brows',
    'Permanent Makeup - Lips',
    'Areola Reconstruction',
  ],
});

function seededServices() {
  const sql = fs.readFileSync(path.join(ROOT, 'migrations', '004_goldie_service_catalogue.sql'), 'utf8');
  const rows = [];
  for (const line of sql.split(/\n/)) {
    const match = line.match(/^\s*\('([0-9a-f-]+)', '((?:''|[^'])*)', .*?, '((?:''|[^'])*)'\),?$/);
    if (!match) continue;
    const sourceName = match[2].replace(/''/g, "'");
    const sourceCategory = match[3].replace(/''/g, "'");
    rows.push({
      name: SERVICE_RENAMES.get(sourceName) || sourceName.trim().replace(/\s+/g, ' '),
      categoryName: CATEGORY_RENAMES.get(sourceCategory) || sourceCategory,
      externalSource: 'goldie',
      externalId: match[1],
    });
  }
  return rows;
}

function canonicalCurrentCatalogue() {
  const descriptionSql = fs.readFileSync(path.join(ROOT, 'migrations', '039_service_customer_descriptions.sql'), 'utf8');
  const activeAt039 = [...descriptionSql.matchAll(/WHEN '((?:''|[^'])+)' THEN/g)]
    .map((match) => match[1].replace(/''/g, "'"));
  const uniqueNames = [...new Set(activeAt039)];
  const seededByName = new Map(seededServices().map((service) => [service.name, service]));
  const catalogue = uniqueNames.map((name) => {
    const service = seededByName.get(name);
    assert.ok(service, `Canonical catalogue service metadata missing for ${name}`);
    return service;
  }).filter((service) => service.externalId !== '1d734e8b-d21e-44c3-9a3f-b2a7165a7787');
  catalogue.push({
    name: 'Sports Massage — Package Session', categoryName: 'Massage',
    externalSource: 'shiloh_package', externalId: 'sports-massage-monthly-session',
  });
  catalogue.push({
    name: 'Couples Massage', categoryName: 'Massage',
    externalSource: 'shiloh_special', externalId: 'couples-massage-v1',
  });
  return catalogue;
}

function model(view, service) {
  const appointment = {
    id: 54501, kind: 'appointment', canonical: true, status: 'scheduled',
    clientName: 'Synthetic Client', serviceName: service.name,
    serviceContexts: [service],
    startsAt: '2026-08-31T08:00:00.000Z', endsAt: '2026-08-31T09:00:00.000Z',
    staffIds: [1], staff: [{ staffId: 1, nameSnapshot: 'Christel' }],
  };
  const dateKeys = ['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06'];
  return {
    view, dateKey: dateKeys[0], selectedStaffId: null,
    permittedStaff: [{ id: 1, displayName: 'Christel' }],
    period: { startKey: dateKeys[0], previousAnchor: '2026-08-24', nextAnchor: '2026-09-07', dateKeys: view === 'day' ? [dateKeys[0]] : dateKeys },
    timeline: {
      staff: [{ id: 1, displayName: 'Christel' }],
      workingWindows: [{ staffId: 1, dayOfWeek: 1, startsLocal: '08:00:00', endsLocal: '17:00:00' }],
      scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], blocks: [],
      appointments: [appointment], events: [appointment],
    },
  };
}

test('the canonical current 50-service catalogue has one exact audited family mapping per service', () => {
  const catalogue = canonicalCurrentCatalogue();
  assert.equal(catalogue.length, 50);
  const actual = Object.fromEntries(Object.keys(SERVICE_FAMILIES).map((key) => [key, []]));
  for (const service of catalogue) {
    const family = resolveServiceFamily(service);
    assert.ok(family, `Unmapped canonical service: ${service.name}`);
    actual[family.key].push(service.name);
  }
  for (const key of Object.keys(EXPECTED_BY_FAMILY)) {
    assert.deepEqual(actual[key].sort(), [...EXPECTED_BY_FAMILY[key]].sort(), key);
  }
});

test('the controlled vocabulary is five restrained SVG icons with decorative accessibility semantics', () => {
  assert.deepEqual(Object.keys(SERVICE_FAMILIES), [
    'facial_skin', 'foot_pedicure', 'targeted_therapeutic', 'massage_body', 'permanent_makeup_beauty',
  ]);
  const markup = Object.keys(SERVICE_FAMILIES).map((key) => renderServiceFamilyIcon(key)).join('\n');
  assert.equal((markup.match(/<svg/g) || []).length, 5);
  assert.equal((markup.match(/aria-hidden="true"/g) || []).length, 5);
  assert.equal((markup.match(/focusable="false"/g) || []).length, 5);
  assert.doesNotMatch(markup, /✨|🦶|🌿|💆|💄/u);
});

test('unknown catalogue authority fails visually safe with normal service text and no guessed icon', () => {
  const unknown = { name: 'Future Unmapped Treatment', categoryName: 'Future Category' };
  assert.equal(resolveServiceFamily(unknown), null);
  assert.equal(renderServiceFamilyIcon(unknown), '');
  const html = renderCalendarPage(model('day', unknown));
  assert.match(html, /Future Unmapped Treatment/);
  assert.doesNotMatch(html, /data-service-family=/);
});

test('Create Booking preserves native Treatment select and carries one family through selection and review', () => {
  const treatment = canonicalCurrentCatalogue().find((service) => service.name === 'Cupping Area Specific');
  const html = renderCalendarCreateBookingPage({
    date: '2026-08-31',
    options: { staff: [{ id: 1, displayName: 'Christel', serviceIds: [33] }], services: [{ id: 33, ...treatment, staffIds: [1] }] },
  });
  const script = calendarCreateBookingClientScript();
  assert.match(html, /<select id="service-select">/);
  assert.doesNotMatch(html, /role="combobox"|listbox/);
  assert.match(html, /Choose the client, treatment, practitioner and time\./);
  assert.match(html, /Name or mobile number/);
  assert.doesNotMatch(html, /CRM V2|canonical client|guarded Shiloh write/);
  assert.match(html, /"serviceFamily":\{"key":"targeted_therapeutic"/);
  assert.match(script, /data-selected-treatment/);
  assert.match(script, /reviewRows/);
  assert.match(script, /serviceValue\(row\[1\],row\[2\]\)/);
});

test('Day, Week and Agenda render the same family SVG beside the still-visible service name', () => {
  const treatment = canonicalCurrentCatalogue().find((service) => service.name === 'Brightening Facial (Pigmentation)');
  for (const view of ['day', 'week', 'agenda']) {
    const html = renderCalendarPage(model(view, treatment));
    assert.match(html, /data-service-family="facial_skin"/);
    assert.match(html, /Brightening Facial \(Pigmentation\)/);
    assert.match(html, /aria-hidden="true"/);
  }
});

test('service visual propagation adds read-only catalogue context without changing booking authority or colour semantics', () => {
  const bookingSource = fs.readFileSync(path.join(ROOT, 'src/services/calendarCreateBooking.js'), 'utf8');
  const schedulingSource = fs.readFileSync(path.join(ROOT, 'src/services/schedulingEngine.js'), 'utf8');
  const calendarSource = fs.readFileSync(path.join(ROOT, 'src/presentation/calendarReadOnlyUx.js'), 'utf8');
  assert.match(bookingSource, /sc\.name AS category_name/);
  assert.match(schedulingSource, /service_contexts/);
  assert.match(schedulingSource, /LEFT JOIN services s ON s\.id=aps\.service_id/);
  assert.doesNotMatch(calendarSource, /event-card\.family-|--service-family-|service-family-icon\.(facial|foot|targeted|massage|beauty)/);
  assert.match(calendarSource, /service-family-icon\{width:16px;height:16px;flex:0 0 16px\}/);
  assert.match(calendarSource, /border-left:4px solid var\(--leaf\)/);
  assert.match(calendarSource, /event-shared\{border-left-color:var\(--clay\)\}/);
});

module.exports = { canonicalCurrentCatalogue, EXPECTED_BY_FAMILY };
