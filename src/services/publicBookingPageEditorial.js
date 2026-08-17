const base = require('./publicBookingPage');

const VISUAL_BREAK = `<section class="inside-shiloh-break" aria-label="Inside Shiloh"><div class="inside-shiloh-copy"><h3>Inside Shiloh</h3><span class="inside-shiloh-rule" aria-hidden="true"></span><p>Clinical care. Personal touch. Beautifully you.</p><strong>Shiloh</strong><small>Massage Therapy &amp; Aesthetic Clinic</small></div></section>`;

function insertInsideShilohSignatures(html, catalogue = []) {
  const categories = [...new Set(catalogue.map((service) => service.category))];
  const massageIndex = categories.indexOf('Massage');
  if (massageIndex < 0) return html;

  // Signature 1: immediately above Massage.
  const massageSection = `<section class="category" id="category-${massageIndex}">`;
  html = html.replace(massageSection, `${VISUAL_BREAK}${massageSection}`);

  // Signature 2: around the midpoint, between complete category groups.
  if (categories.length > 2) {
    let middleIndex = Math.floor(categories.length / 2);
    if (middleIndex === massageIndex) middleIndex += 1;
    const middleSection = `<section class="category" id="category-${middleIndex}">`;
    html = html.replace(middleSection, `${VISUAL_BREAK}${middleSection}`);
  }

  // Signature 3: at the end of the catalogue, before the confidence section.
  html = html.replace('</div><section class="clinic">', `${VISUAL_BREAK}</div><section class="clinic">`);
  return html;
}

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  // Keep the approved hero and remove the old standalone clinic gallery.
  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  html = html.replace(oldGallery, '');

  html = insertInsideShilohSignatures(html, catalogue);

  const visualBreakCss = `
.inside-shiloh-break{position:relative;isolation:isolate;overflow:hidden;width:calc(100% + 280px);margin:26px -140px 32px;height:245px;border-radius:20px;display:grid;place-items:center;text-align:center;color:#fff;box-shadow:0 10px 30px rgba(36,53,47,.12);border:1px solid rgba(36,53,47,.08)}.inside-shiloh-break::before{content:"";position:absolute;inset:-18px;z-index:-2;background:url('/assets/booking/clinic-collage-bg.jpg') center 52%/cover no-repeat;filter:blur(5px) saturate(.82) brightness(.72);transform:scale(1.04)}.inside-shiloh-break::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(48,42,34,.34),rgba(48,42,34,.2) 45%,rgba(48,42,34,.3)),linear-gradient(rgba(115,85,52,.08),rgba(115,85,52,.2))}.inside-shiloh-copy{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 28px;text-shadow:0 1px 12px rgba(0,0,0,.2)}.inside-shiloh-copy h3{font-family:Georgia,"Times New Roman",serif;font-size:36px;line-height:1;margin:0;font-weight:500;letter-spacing:-.02em}.inside-shiloh-rule{display:block;width:31px;height:2px;background:#d0a45e;margin:13px 0 10px}.inside-shiloh-copy p{margin:0;color:#fff;font-size:15px}.inside-shiloh-copy strong{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-weight:500;color:#d8ad67;font-size:44px;line-height:1;margin-top:14px}.inside-shiloh-copy small{text-transform:uppercase;letter-spacing:.08em;color:#d8ad67;font-size:10px;margin-top:6px}.catalogue>.inside-shiloh-break:first-child{margin-top:4px;margin-bottom:30px}.catalogue>.inside-shiloh-break:last-child{margin-top:34px;margin-bottom:8px}@media(max-width:1280px){.inside-shiloh-break{width:100%;margin:24px 0 30px}}@media(max-width:700px){.inside-shiloh-break{height:190px;border-radius:16px;margin:20px 0 24px}.inside-shiloh-break::before{filter:blur(4px) saturate(.8) brightness(.68)}.inside-shiloh-copy{padding:14px 18px}.inside-shiloh-copy h3{font-size:30px}.inside-shiloh-copy p{font-size:13px}.inside-shiloh-copy strong{font-size:36px;margin-top:10px}.inside-shiloh-copy small{font-size:9px}}
`;
  html = html.replace('</style>', `${visualBreakCss}</style>`);
  return html;
}

module.exports = { ...base, renderBookingPage };
