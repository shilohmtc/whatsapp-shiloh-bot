const base = require('./publicBookingPage');

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  const firstEditorial = `<section class="editorial-photo editorial-photo-primary" aria-label="Inside Shiloh"><img src="/assets/booking/treatment-room-side.webp" alt="Shiloh treatment room" loading="eager"></section>`;
  html = html.replace(oldGallery, firstEditorial);

  const secondEditorial = `<section class="editorial-photo editorial-photo-secondary" aria-label="Inside Shiloh pedicure area"><img src="/assets/booking/pedicure-side.webp" alt="Shiloh pedicure area" loading="lazy"></section>`;
  html = html.replace('</div><section class="clinic">', `</div>${secondEditorial}<section class="clinic">`);

  const editorialCss = `
.editorial-photo{width:min(1160px,calc(100% - 48px));margin:8px auto 34px}.editorial-photo img{display:block;width:100%;height:auto;max-height:none;border-radius:22px;box-shadow:0 12px 34px rgba(36,53,47,.10);border:1px solid rgba(36,53,47,.08)}.editorial-photo-primary{margin-top:4px}.editorial-photo-secondary{margin-top:-6px;margin-bottom:46px}@media(max-width:980px){.editorial-photo{width:min(100% - 36px,1180px)}}@media(max-width:700px){.editorial-photo{width:calc(100% - 30px);margin-bottom:24px}.editorial-photo img{border-radius:16px}}
`;
  html = html.replace('</style>', `${editorialCss}</style>`);
  return html;
}

module.exports = { ...base, renderBookingPage };
