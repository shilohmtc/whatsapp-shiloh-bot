const base = require('./publicBookingPage');

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  // Keep the approved hero, but remove the standalone clinic gallery/photo blocks.
  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  html = html.replace(oldGallery, '');

  // Apply the clinic collage only to a bounded middle slice of the catalogue.
  // The central surface stays warm/opaque enough for treatment readability while
  // the collage is visible primarily around the edges on wider screens.
  const atmosphereStart = '<section class="category" id="category-2">';
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
.collage-atmosphere{position:relative;isolation:isolate;margin:28px 0 42px;padding:34px 22px}.collage-atmosphere::before{content:"";position:absolute;z-index:-2;left:50%;top:0;bottom:0;width:100vw;transform:translateX(-50%);background:linear-gradient(rgba(247,243,235,.76),rgba(247,243,235,.76)),url('/assets/booking/clinic-collage-bg.jpg') center/cover no-repeat;filter:saturate(.78);opacity:.42}.collage-surface{background:rgba(247,243,235,.94);border:1px solid rgba(36,53,47,.08);border-radius:24px;padding:0 22px;box-shadow:0 12px 34px rgba(36,53,47,.055);backdrop-filter:blur(3px)}@media(max-width:980px){.collage-atmosphere{padding:24px 10px;margin:22px 0 32px}.collage-atmosphere::before{opacity:.24}.collage-surface{padding:0 14px}}@media(max-width:700px){.collage-atmosphere{padding:0;margin:0}.collage-atmosphere::before{display:none}.collage-surface{padding:0;background:transparent;border:0;border-radius:0;box-shadow:none;backdrop-filter:none}}
`;
  html = html.replace('</style>', `${atmosphereCss}</style>`);
  return html;
}

module.exports = { ...base, renderBookingPage };
