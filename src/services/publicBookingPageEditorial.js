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

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  html = html.replace(oldGallery, '');

  html = insertInsideShilohSignatures(html, catalogue);

  const visualBreakCss = `
.inside-shiloh-break{width:calc(100% + 280px);margin:26px -140px 32px;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(36,53,47,.12);border:1px solid rgba(36,53,47,.08);background:#5f584f}.inside-shiloh-break img{display:block;width:100%;height:auto}.catalogue>.inside-shiloh-break:first-child{margin-top:4px;margin-bottom:30px}.catalogue>.inside-shiloh-break:last-child{margin-top:34px;margin-bottom:8px}@media(max-width:1280px){.inside-shiloh-break{width:100%;margin:24px 0 30px}}@media(max-width:700px){.inside-shiloh-break{border-radius:16px;margin:20px 0 24px}}
`;
  html = html.replace('</style>', `${visualBreakCss}</style>`);
  return html;
}

module.exports = { ...base, renderBookingPage };
