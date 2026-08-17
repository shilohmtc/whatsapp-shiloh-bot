const base = require('./publicBookingPage');

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  // Keep the approved hero, but remove the standalone clinic gallery/photo blocks.
  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  html = html.replace(oldGallery, '');

  // Start the clinic atmosphere with Massage so it is visible in the first
  // treatment section, while keeping the navigation and approved hero clean.
  // End before category 5 to keep the treatment journey visually bounded.
  const atmosphereStart = '<section class="category" id="category-1">';
  const atmosphereEnd = '<section class="category" id="category-5">';
  if (html.includes(atmosphereStart)) {
    html = html.replace(
      atmosphereStart,
      `<div class="collage-atmosphere" aria-label="Inside Shiloh"><div class="collage-surface">${atmosphereStart}`,
    );
    if (html.includes(atmosphereEnd)) {
      html = html.replace(atmosphereEnd, `</div></div>${atmosphereEnd}`);
    } else {
      html = html.replace('</div><section class="clinic">', '</div></div></div><section class="clinic">');
    }
  }

  const atmosphereCss = `
.collage-atmosphere{position:relative;isolation:isolate;margin:28px 0 42px;padding:38px 24px}.collage-atmosphere::before{content:"";position:absolute;z-index:-2;left:50%;top:0;bottom:0;width:100vw;transform:translateX(-50%);background:linear-gradient(rgba(247,243,235,.52),rgba(247,243,235,.52)),url('/assets/booking/clinic-collage-bg.jpg') center/cover no-repeat;filter:saturate(.9);opacity:.78}.collage-surface{background:rgba(247,243,235,.9);border:1px solid rgba(36,53,47,.08);border-radius:24px;padding:0 22px;box-shadow:0 12px 34px rgba(36,53,47,.055);backdrop-filter:blur(1px)}@media(max-width:980px){.collage-atmosphere{padding:26px 12px;margin:22px 0 32px}.collage-atmosphere::before{opacity:.38;background:linear-gradient(rgba(247,243,235,.62),rgba(247,243,235,.62)),url('/assets/booking/clinic-collage-bg.jpg') center/cover no-repeat}.collage-surface{padding:0 14px;background:rgba(247,243,235,.94)}}@media(max-width:700px){.collage-atmosphere{padding:0;margin:0}.collage-atmosphere::before{display:none}.collage-surface{padding:0;background:transparent;border:0;border-radius:0;box-shadow:none;backdrop-filter:none}}
`;
  html = html.replace('</style>', `${atmosphereCss}</style>`);
  return html;
}

module.exports = { ...base, renderBookingPage };
