const base = require('./publicBookingPage');

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  // Keep the approved hero and clean catalogue. Remove the legacy standalone
  // clinic gallery/photo block; photography is no longer layered behind cards.
  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  html = html.replace(oldGallery, '');

  return html;
}

module.exports = { ...base, renderBookingPage };
