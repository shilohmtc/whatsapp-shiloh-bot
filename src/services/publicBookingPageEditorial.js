const base = require('./publicBookingPage');

function renderBookingPage(number, catalogue = []) {
  let html = base.renderBookingPage(number, catalogue);

  const oldGallery = /<section class="clinic-gallery"[\s\S]*?<\/section>/;
  const firstEditorial = `<section class="editorial-photo editorial-photo-primary" aria-label="Inside Shiloh"><img src="/assets/booking/treatment-room-side.webp" alt="Shiloh treatment room" loading="eager"></section>`;
  html = html.replace(oldGallery, firstEditorial);

  const secondEditorial = `<section class="editorial-photo editorial-photo-secondary" aria-label="Inside Shiloh pedicure area"><img src="/assets/booking/pedicure-side.webp" alt="Shiloh pedicure area" loading="lazy"></section>`;
  html = html.replace('</div><section class="clinic">', `</div>${secondEditorial}<section class="clinic">`);

  const editorialCss = `
.editorial-photo{width:min(940px,calc(100% - 48px));margin:10px auto 32px}.editorial-photo img{display:block;width:100%;height:320px;object-fit:cover;border-radius:20px;box-shadow:0 10px 30px rgba(36,53,47,.09);border:1px solid rgba(36,53,47,.08)}.editorial-photo-primary img{object-position:center 55%}.editorial-photo-secondary{width:min(820px,calc(100% - 48px));margin-top:6px;margin-bottom:42px}.editorial-photo-secondary img{height:280px;object-position:center 58%}@media(max-width:980px){.editorial-photo,.editorial-photo-secondary{width:min(100% - 36px,860px)}.editorial-photo img{height:280px}.editorial-photo-secondary img{height:240px}}@media(max-width:700px){.editorial-photo,.editorial-photo-secondary{width:calc(100% - 30px);margin-bottom:24px}.editorial-photo img,.editorial-photo-secondary img{height:210px;border-radius:16px}}
`;
  html = html.replace('</style>', `${editorialCss}</style>`);
  return html;
}

module.exports = { ...base, renderBookingPage };
