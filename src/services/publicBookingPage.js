const BOOKING_MESSAGE = "Hi Shiloh 👋 I'd like to book an appointment.";

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function buildWhatsAppBookingUrl(number, serviceName = '') {
  const digits = String(number || '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  const message = serviceName ? `Hi Shiloh 👋 I'd like to book ${serviceName}.` : BOOKING_MESSAGE;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function renderServiceCard(number, service) {
  const url = buildWhatsAppBookingUrl(number, service.name);
  const description = service.description ? `<p>${escapeHtml(service.description)}</p>` : '';
  const note = service.bookingNote ? `<p class="note">${escapeHtml(service.bookingNote)}</p>` : '';
  return `<article class="service-card">
    <div class="service-copy"><h3>${escapeHtml(service.name)}</h3><div class="meta"><span>${escapeHtml(service.duration)}</span><span>${escapeHtml(service.price)}</span></div>${description}${note}</div>
    ${url ? `<a class="book-service" href="${escapeHtml(url)}" rel="noopener">Book this treatment <span aria-hidden="true">→</span></a>` : ''}
  </article>`;
}

function renderCatalogue(number, catalogue) {
  if (!catalogue.length) return '<p class="empty">Our service catalogue is temporarily unavailable. Please continue with Shiloh on WhatsApp for assistance.</p>';
  const groups = new Map();
  for (const service of catalogue) {
    if (!groups.has(service.category)) groups.set(service.category, []);
    groups.get(service.category).push(service);
  }
  return [...groups.entries()].map(([category, services], index) => `<section class="category" id="category-${index}"><div class="category-head"><span>Shiloh treatments</span><h2>${escapeHtml(category)}</h2></div><div class="service-grid">${services.map((service) => renderServiceCard(number, service)).join('')}</div></section>`).join('');
}

function renderBookingPage(number, catalogue = []) {
  const whatsappUrl = buildWhatsAppBookingUrl(number);
  const cta = whatsappUrl ? `<a class="cta" href="${escapeHtml(whatsappUrl)}" rel="noopener">Ask Shiloh to help me choose <span aria-hidden="true">→</span></a>` : `<div class="cta unavailable" role="status">WhatsApp booking is temporarily unavailable</div>`;
  const categories = [...new Set(catalogue.map((service) => service.category))];
  const categoryNav = categories.length ? `<nav class="category-nav" aria-label="Treatment categories">${categories.map((name, i) => `<a href="#category-${i}">${escapeHtml(name)}</a>`).join('')}</nav>` : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="description" content="Explore treatments and book with Shiloh Massage Therapy and Aesthetic Clinic in Heidelberg, Gauteng."><title>Book with Shiloh | Massage Therapy & Aesthetic Clinic</title><style>
  :root{--ink:#24352f;--muted:#66756f;--cream:#f7f3eb;--paper:#fff;--sage:#dce8da;--deep:#294b3e;--line:#dce2dd;--gold:#b89861;--shadow:0 20px 60px rgba(36,53,47,.13)}*{box-sizing:border-box}html{scroll-behavior:smooth;background:var(--cream)}body{margin:0;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55}a{color:inherit}.shell{width:min(1180px,calc(100% - 36px));margin:auto}.hero{min-height:620px;display:grid;align-items:end;background:linear-gradient(90deg,rgba(24,45,37,.82),rgba(24,45,37,.25)),url('/assets/booking/reception.webp') center/cover;color:#fff}.hero-inner{padding:86px 0 72px;max-width:720px}.eyebrow,.category-head span{text-transform:uppercase;letter-spacing:.17em;font-size:12px;font-weight:800}.hero h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(46px,8vw,82px);line-height:.98;letter-spacing:-.04em;font-weight:500;margin:18px 0}.hero p{font-size:20px;max-width:640px;color:#eef3ef}.cta{display:inline-flex;align-items:center;gap:28px;margin-top:20px;padding:17px 20px;border-radius:14px;background:#fff;color:var(--deep);text-decoration:none;font-weight:800}.intro{padding:70px 0 48px}.intro-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:46px;align-items:center}.intro h2,.category h2{font-family:Georgia,"Times New Roman",serif;font-weight:500;letter-spacing:-.025em}.intro h2{font-size:clamp(34px,5vw,52px);margin:0 0 16px}.intro-photo{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:24px;box-shadow:var(--shadow)}.category-nav{display:flex;gap:9px;overflow:auto;padding:0 0 26px;scrollbar-width:thin}.category-nav a{white-space:nowrap;text-decoration:none;border:1px solid var(--line);background:#fff;padding:9px 13px;border-radius:999px;font-size:13px;font-weight:700}.catalogue{padding-bottom:90px}.category{scroll-margin-top:18px;padding:38px 0;border-top:1px solid var(--line)}.category-head{margin-bottom:22px}.category-head span{color:var(--gold)}.category h2{font-size:clamp(30px,4vw,42px);margin:5px 0}.service-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.service-card{background:var(--paper);border:1px solid rgba(36,53,47,.08);border-radius:20px;padding:23px;display:flex;flex-direction:column;justify-content:space-between;min-height:230px;box-shadow:0 8px 28px rgba(36,53,47,.05)}.service-card h3{font-family:Georgia,"Times New Roman",serif;font-size:25px;line-height:1.15;margin:0 0 10px}.meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.meta span{background:#f1f4ef;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800}.service-card p{color:var(--muted);font-size:14px;margin:8px 0}.service-card .note{font-size:12px;font-style:italic}.book-service{display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:15px;border-top:1px solid var(--line);color:var(--deep);font-weight:800;text-decoration:none}.clinic{background:var(--deep);color:#fff;padding:70px 0}.clinic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}.clinic-grid img{width:100%;height:280px;object-fit:cover;border-radius:18px}.clinic h2{font-family:Georgia,"Times New Roman",serif;font-size:44px;font-weight:500;margin:0}.clinic p{color:#dce7e1;max-width:620px}.footer{padding:28px 0 42px;color:var(--muted);font-size:13px}.empty{padding:24px;background:#fff;border-radius:16px}@media(max-width:760px){.hero{min-height:560px;background-position:58% center}.hero-inner{padding:64px 0 52px}.intro{padding-top:48px}.intro-grid,.service-grid{grid-template-columns:1fr}.intro-photo{order:-1}.clinic-grid{grid-template-columns:1fr 1fr}.clinic-grid img{height:220px}.clinic-grid img:last-child{grid-column:1/-1}.service-card{min-height:0}}
  </style></head><body><header class="hero"><div class="shell hero-inner"><div class="eyebrow">Shiloh Massage Therapy & Aesthetic Clinic</div><h1>Care designed around you.</h1><p>Explore our current treatments, then continue with Shiloh on WhatsApp to check real clinic availability and complete your booking.</p>${cta}</div></header><main><section class="intro"><div class="shell"><div class="intro-grid"><div><div class="eyebrow">Our treatments</div><h2>Choose a service, or let Shiloh guide you.</h2><p>Everything below comes from Shiloh's active clinic catalogue. Select a treatment to start with it already chosen, or ask our assistant for a recommendation.</p></div><img class="intro-photo" src="/assets/booking/treatment-room.webp" alt="Treatment room at Shiloh Massage Therapy and Aesthetic Clinic"></div>${categoryNav}</div></section><div class="shell catalogue">${renderCatalogue(number, catalogue)}</div><section class="clinic"><div class="shell"><div class="eyebrow">Inside Shiloh</div><h2>A calm space in Heidelberg.</h2><p>Real photographs from our clinic. Treatment-specific photography will be added progressively as our visual catalogue grows.</p><div class="clinic-grid"><img src="/assets/booking/consultation-room.webp" alt="Shiloh consultation room" loading="lazy"><img src="/assets/booking/pedicure-lounge.webp" alt="Shiloh pedicure lounge" loading="lazy"><img src="/assets/booking/clinic-collage.webp" alt="Views of Shiloh clinic" loading="lazy"></div></div></section></main><footer class="footer"><div class="shell">37 Jacobs Street, Heidelberg, Gauteng · Availability is confirmed only after Shiloh completes the appointment flow.</div></footer></body></html>`;
}

module.exports = { BOOKING_MESSAGE, buildWhatsAppBookingUrl, renderBookingPage, renderCatalogue };
