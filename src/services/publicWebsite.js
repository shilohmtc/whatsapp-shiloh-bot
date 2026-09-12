function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const NAV_ITEMS = [
  ['/', 'Home'],
  ['/treatments', 'Treatments'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/book', 'Book'],
];

const TOKENS = `
:root{--ink:#24352f;--muted:#66756f;--cream:#f7f3eb;--paper:#fff;--sage:#dce8da;--deep:#294b3e;--line:#dce2dd;--gold:#b89861;--shadow:0 12px 34px rgba(36,53,47,.09);--radius:20px}
*{box-sizing:border-box}html{scroll-behavior:smooth;background:var(--cream)}body{margin:0;color:var(--ink);background:var(--cream);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.5}a{color:inherit}.shell{width:min(1180px,calc(100% - 40px));margin:auto}.site-header{position:sticky;top:0;z-index:20;background:rgba(247,243,235,.94);backdrop-filter:blur(14px);border-bottom:1px solid rgba(36,53,47,.09)}.header-row{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{text-decoration:none;font-family:Georgia,"Times New Roman",serif;font-size:26px;letter-spacing:-.03em}.nav{display:flex;align-items:center;gap:6px}.nav a{padding:10px 12px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:750}.nav a[aria-current="page"]{background:var(--sage);color:var(--deep)}.nav a.book{background:var(--deep);color:#fff;padding-inline:18px}.hero{padding:70px 0 56px}.hero-grid{display:grid;grid-template-columns:1.12fr .88fr;gap:40px;align-items:center}.eyebrow{text-transform:uppercase;letter-spacing:.17em;font-size:11px;font-weight:850;color:var(--gold)}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;font-weight:500;letter-spacing:-.028em}h1{font-size:clamp(46px,6vw,76px);line-height:.98;margin:14px 0 20px}h2{font-size:clamp(34px,4vw,50px);line-height:1.02;margin:8px 0 14px}h3{font-size:24px;line-height:1.15;margin:0 0 10px}.lede{font-size:18px;color:var(--muted);max-width:680px}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.button{min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:850;border:1px solid var(--deep)}.button.primary{background:var(--deep);color:#fff}.button.secondary{background:transparent;color:var(--deep)}.hero-card{min-height:340px;border-radius:28px;background:linear-gradient(145deg,rgba(41,75,62,.94),rgba(41,75,62,.70)),url('/assets/booking/reception.svg') center/cover;box-shadow:var(--shadow);padding:34px;color:#fff;display:flex;align-items:flex-end}.hero-card p{color:#e9f0ec;margin:7px 0 0}.section{padding:54px 0}.section.alt{background:#eef2eb;border-block:1px solid rgba(36,53,47,.06)}.section-head{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:24px}.section-head p{max-width:600px;color:var(--muted);margin:0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{background:var(--paper);border:1px solid rgba(36,53,47,.08);border-radius:var(--radius);padding:22px;box-shadow:0 6px 22px rgba(36,53,47,.04)}.card p{color:var(--muted);font-size:14px}.meta{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.pill{background:#f1f4ef;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800}.pill.price{background:#e4eee1;color:var(--deep)}.card-link{display:inline-flex;margin-top:10px;font-weight:850;color:var(--deep);text-decoration:none}.category{padding:30px 0;border-top:1px solid var(--line)}.category:first-child{border-top:0}.category-label{display:flex;align-items:baseline;justify-content:space-between;gap:20px;margin-bottom:16px}.category-label h2{font-size:34px}.category-label small{color:var(--muted)}.fact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.fact{border-radius:18px;padding:20px;background:rgba(255,255,255,.65);border:1px solid rgba(36,53,47,.07)}.fact strong{display:block;margin-bottom:6px}.fact span{color:var(--muted);font-size:14px}.prose{max-width:760px}.prose p{color:var(--muted);font-size:17px}.contact-panel{display:grid;grid-template-columns:1fr 1fr;gap:18px}.contact-panel .card{min-height:190px}.footer{background:var(--deep);color:#fff;padding:34px 0}.footer-row{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.footer span{color:#dce7e1;font-size:13px}.mobile-book{display:none}.mobile-menu{display:none;position:relative}.mobile-menu summary{list-style:none;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;padding:9px 14px;background:#fff;color:var(--deep);font-size:14px;font-weight:850;cursor:pointer}.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu summary::after{content:'+';margin-left:8px;font-size:18px;line-height:1}.mobile-menu[open] summary::after{content:'−'}.mobile-menu-panel{position:absolute;right:0;top:calc(100% + 8px);width:min(260px,calc(100vw - 30px));display:grid;gap:4px;padding:8px;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow)}.mobile-menu-panel a{min-height:44px;display:flex;align-items:center;padding:10px 12px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:800}.mobile-menu-panel a[aria-current="page"]{background:var(--sage);color:var(--deep)}.mobile-menu-panel a.book{background:var(--deep);color:#fff}
@media(max-width:850px){.hero-grid{grid-template-columns:1fr}.hero-card{min-height:250px}.grid,.fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.contact-panel{grid-template-columns:1fr}.nav{display:none}.mobile-menu{display:block}}
@media(max-width:700px){body{padding-bottom:74px}.shell{width:calc(100% - 30px)}.header-row{min-height:62px}.brand{font-size:23px}.nav a.book{min-height:44px;display:inline-flex;align-items:center}.hero{padding:42px 0 38px}.hero-grid{gap:24px}h1{font-size:46px}.lede{font-size:16px}.hero-card{min-height:218px;border-radius:20px;padding:24px}.section{padding:38px 0}.section-head{display:block}.grid,.fact-grid{grid-template-columns:1fr}.category{padding:24px 0}.category-label{display:block}.category-label h2{font-size:30px}.button{width:100%}.mobile-book{position:fixed;z-index:30;display:flex;left:10px;right:10px;bottom:10px;min-height:54px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 10px 35px rgba(20,40,32,.22);align-items:center;justify-content:space-between;padding:9px 14px;text-decoration:none}.mobile-book span{font-size:11px;color:var(--muted)}.mobile-book strong{font-size:13px;color:var(--deep)}}
`;

function nav(currentPath) {
  return `<nav class="nav" aria-label="Primary navigation">${NAV_ITEMS.map(([href, label]) => {
    const current = currentPath === href ? ' aria-current="page"' : '';
    const className = href === '/book' ? ' class="book"' : '';
    return `<a href="${href}"${className}${current}>${label}</a>`;
  }).join('')}</nav>`;
}

function mobileNav(currentPath) {
  return `<details class="mobile-menu"><summary aria-label="Open primary navigation">Menu</summary><nav class="mobile-menu-panel" aria-label="Phone primary navigation">${NAV_ITEMS.map(([href, label]) => {
    const current = currentPath === href ? ' aria-current="page"' : '';
    const className = href === '/book' ? ' class="book"' : '';
    return `<a href="${href}"${className}${current}>${label}</a>`;
  }).join('')}</nav></details>`;
}

function layout({ title, description, currentPath, body }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)} | Shiloh</title><style>${TOKENS}</style></head><body><header class="site-header"><div class="shell header-row"><a class="brand" href="/" aria-label="Shiloh home">Shiloh</a>${nav(currentPath)}${mobileNav(currentPath)}</div></header>${body}<footer class="footer"><div class="shell footer-row"><strong>Shiloh Massage Therapy &amp; Aesthetic Clinic</strong><span>37 Jacobs Street, Heidelberg, Gauteng</span><span>Bookings continue through Shiloh’s canonical booking journey.</span></div></footer><a class="mobile-book" href="/book"><span>Ready when you are</span><strong>Book with Shiloh →</strong></a></body></html>`;
}

function serviceGroups(catalogue = []) {
  const groups = new Map();
  for (const service of catalogue) {
    if (!groups.has(service.category)) groups.set(service.category, []);
    groups.get(service.category).push(service);
  }
  return groups;
}

function serviceCard(service) {
  const description = service.description ? `<p>${escapeHtml(service.description)}</p>` : '';
  return `<article class="card treatment-card" data-service-id="${escapeHtml(service.id)}"><h3>${escapeHtml(service.name)}</h3><div class="meta"><span class="pill">${escapeHtml(service.duration)}</span><span class="pill price">${escapeHtml(service.price)}</span></div>${description}<a class="card-link" href="/book">Book this treatment →</a></article>`;
}

function renderHome(catalogue = []) {
  const featured = catalogue.slice(0, 3);
  const featuredMarkup = featured.length
    ? featured.map(serviceCard).join('')
    : '<article class="card"><h3>Treatments</h3><p>Our current treatment catalogue is temporarily unavailable. You can still continue to the booking journey for assistance.</p></article>';
  return layout({
    title: 'Massage Therapy & Aesthetic Clinic',
    description: 'Discover Shiloh Massage Therapy & Aesthetic Clinic in Heidelberg and continue into the canonical Shiloh booking journey.',
    currentPath: '/',
    body: `<main><section class="hero"><div class="shell hero-grid"><div><div class="eyebrow">Shiloh Massage Therapy &amp; Aesthetic Clinic</div><h1>Care that feels personal from the first hello.</h1><p class="lede">Explore current treatments, understand what to expect, and move naturally into Shiloh’s booking journey when you are ready.</p><div class="actions"><a class="button primary" href="/book">Book with Shiloh</a><a class="button secondary" href="/treatments">Explore treatments</a></div></div><div class="hero-card" aria-label="Inside Shiloh"><div><div class="eyebrow" style="color:#e7d3af">Inside Shiloh</div><h2>Clinical care. Personal touch.</h2><p>Massage therapy and aesthetic care in Heidelberg, Gauteng.</p></div></div></div></section><section class="section alt"><div class="shell"><div class="section-head"><div><div class="eyebrow">Current treatments</div><h2>Start with what you need.</h2></div><p>Treatment names, timing and pricing come from Shiloh’s existing public service catalogue—the same authority used by booking.</p></div><div class="grid">${featuredMarkup}</div><div class="actions"><a class="button secondary" href="/treatments">See all treatments</a></div></div></section><section class="section"><div class="shell fact-grid"><div class="fact"><strong>Current catalogue</strong><span>Only active, client-bookable treatment authority is presented.</span></div><div class="fact"><strong>Canonical booking</strong><span>Every booking action continues to the existing /book journey.</span></div><div class="fact"><strong>Real availability</strong><span>Availability remains owned and checked by Shiloh’s booking system.</span></div></div></section></main>`,
  });
}

function renderTreatments(catalogue = []) {
  const groups = serviceGroups(catalogue);
  const content = groups.size
    ? [...groups.entries()].map(([category, services]) => `<section class="category"><div class="category-label"><h2>${escapeHtml(category)}</h2><small>${services.length} treatment${services.length === 1 ? '' : 's'}</small></div><div class="grid">${services.map(serviceCard).join('')}</div></section>`).join('')
    : '<section class="card"><h2>Treatments are temporarily unavailable</h2><p>Please continue to Book for assistance. We have not substituted a second catalogue.</p></section>';
  return layout({
    title: 'Treatments',
    description: 'Browse Shiloh’s current client-bookable treatments and pricing, sourced from the canonical Shiloh service catalogue.',
    currentPath: '/treatments',
    body: `<main><section class="hero"><div class="shell"><div class="eyebrow">Treatments</div><h1>Choose with clarity.</h1><p class="lede">Browse Shiloh’s current client-bookable treatments. When you choose Book, you continue into the existing canonical booking journey.</p><div class="actions"><a class="button primary" href="/book">Book with Shiloh</a></div></div></section><section class="section alt"><div class="shell" data-public-treatment-catalogue>${content}</div></section></main>`,
  });
}

function renderAbout() {
  return layout({
    title: 'About',
    description: 'Learn about Shiloh Massage Therapy & Aesthetic Clinic and our approach to personal, practical care.',
    currentPath: '/about',
    body: `<main><section class="hero"><div class="shell prose"><div class="eyebrow">About Shiloh</div><h1>Care designed around the person in front of us.</h1><p class="lede">Shiloh brings massage therapy and aesthetic care together in a calm Heidelberg clinic, with a practical focus on clear treatment choices and a personal client experience.</p><div class="actions"><a class="button primary" href="/book">Book with Shiloh</a><a class="button secondary" href="/treatments">View treatments</a></div></div></section><section class="section alt"><div class="shell fact-grid"><div class="fact"><strong>Personal</strong><span>A focused clinic experience rather than a one-size-fits-all journey.</span></div><div class="fact"><strong>Clear</strong><span>Current treatment information leads into one booking authority.</span></div><div class="fact"><strong>Local</strong><span>Based at 37 Jacobs Street in Heidelberg, Gauteng.</span></div></div></section></main>`,
  });
}

function renderContact() {
  return layout({
    title: 'Contact',
    description: 'Visit Shiloh Massage Therapy & Aesthetic Clinic at 37 Jacobs Street, Heidelberg, Gauteng, or continue to booking.',
    currentPath: '/contact',
    body: `<main><section class="hero"><div class="shell"><div class="eyebrow">Contact</div><h1>Come find Shiloh in Heidelberg.</h1><p class="lede">For treatment selection and appointment availability, continue to Book so your request stays inside Shiloh’s canonical booking journey.</p></div></section><section class="section alt"><div class="shell contact-panel"><article class="card"><div class="eyebrow">Visit</div><h2>37 Jacobs Street</h2><p>Heidelberg, Gauteng</p></article><article class="card"><div class="eyebrow">Appointments</div><h2>Ready to book?</h2><p>Use the existing Shiloh booking path for current treatments and real availability.</p><a class="button primary" href="/book">Book with Shiloh</a></article></div></section></main>`,
  });
}

module.exports = { NAV_ITEMS, escapeHtml, renderHome, renderTreatments, renderAbout, renderContact, serviceGroups };
