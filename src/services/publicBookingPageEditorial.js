const base = require('./publicBookingPage');

const VISUAL_BREAK = `<section class="inside-shiloh-break" aria-label="Inside Shiloh"><img src="/assets/booking/inside-shiloh-signature.png" alt="Inside Shiloh — Clinical care. Personal touch. Beautifully you. Shiloh Massage Therapy &amp; Aesthetic Clinic"></section>`;

function insertInsideShilohSignatures(html, catalogue = []) {
  const categories = [...new Set(catalogue.map((service) => service.category))];
  const massageIndex = categories.indexOf('Massage');
  if (massageIndex < 0) return html;

  const massageSection = `<section class="category" id="category-${massageIndex}">`;
  html = html.replace(massageSection, `${VISUAL_BREAK}${massageSection}`);

  if (categories.length > 2) {
    let middleIndex = Math.floor(categories.length / 2);
    if (middleIndex === massageIndex) middleIndex += 1;
    const middleSection = `<section class="category" id="category-${middleIndex}">`;
    html = html.replace(middleSection, `${VISUAL_BREAK}${middleSection}`);
  }

  html = html.replace('</div><section class="clinic">', `${VISUAL_BREAK}</div><section class="clinic">`);
  return html;
}

function extractCategorySection(html, index) {
  const match = html.match(new RegExp(`<section class="category" id="category-${index}">[\\s\\S]*?<\\/section>`));
  return match ? match[0] : null;
}

function groupSpecialtyCategories(html, catalogue = []) {
  const categories = [...new Set(catalogue.map((service) => service.category))];
  const rows = [
    ['Profosma Jet Plasma', 'Plasma Fibroblast Consultation'],
    ['Plasma Fibroblast Prices', 'Ozone & Far Infrared'],
    ['1. SQT BioMicroneedling', '2. SQT BioMicroneedling'],
    ['HIFU', 'Vaginal Tightening & Rejuvenation', 'Neo Pelvic Therapy'],
  ];

  for (const row of rows) {
    const indexes = row.map((name) => categories.indexOf(name));
    if (indexes.some((index) => index < 0)) continue;

    const sortedIndexes = [...indexes].sort((a, b) => a - b);
    const contiguousIndexes = Array.from({ length: sortedIndexes.length }, (_, offset) => sortedIndexes[0] + offset);
    if (!sortedIndexes.every((index, i) => index === contiguousIndexes[i])) continue;

    const originalSections = sortedIndexes.map((index) => extractCategorySection(html, index));
    const desiredSections = indexes.map((index) => extractCategorySection(html, index));
    if (originalSections.some((section) => !section) || desiredSections.some((section) => !section)) continue;

    const originalBlock = originalSections.join('');
    const desiredBlock = desiredSections.join('');
    const columns = row.length === 3 ? ' specialty-category-row--three' : '';
    html = html.replace(originalBlock, `<div class="specialty-category-row${columns}">${desiredBlock}</div>`);
  }
  return html;
}

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  html = html.replace(oldGallery, '');

  html = groupSpecialtyCategories(html, catalogue);
  html = insertInsideShilohSignatures(html, catalogue);

  const visualBreakCss = `
.inside-shiloh-break{width:calc(100% + 280px);margin:26px -140px 32px;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(36,53,47,.12);border:1px solid rgba(36,53,47,.08);background:#5f584f}.inside-shiloh-break img{display:block;width:100%;height:auto}.catalogue>.inside-shiloh-break:first-child{margin-top:4px;margin-bottom:30px}.catalogue>.inside-shiloh-break:last-child{margin-top:34px;margin-bottom:8px}.specialty-category-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:stretch}.specialty-category-row--three{grid-template-columns:repeat(3,minmax(0,1fr))}.specialty-category-row>.category{min-width:0}.specialty-category-row .service-grid{grid-template-columns:1fr}.specialty-category-row .service-card{height:100%}@media(max-width:1280px){.inside-shiloh-break{width:100%;margin:24px 0 30px}.specialty-category-row--three{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.inside-shiloh-break{border-radius:16px;margin:20px 0 24px}.specialty-category-row,.specialty-category-row--three{grid-template-columns:1fr;gap:0}}
`;
  html = html.replace('</style>', `${visualBreakCss}</style>`);
  return html;
}

module.exports = { ...base, renderBookingPage };
