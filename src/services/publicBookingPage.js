const BOOKING_MESSAGE = "Hi Shiloh 👋 I'd like to book an appointment.";

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildWhatsAppBookingUrl(number) {
  const digits = String(number || '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(BOOKING_MESSAGE)}`;
}

function renderBookingPage(number) {
  const whatsappUrl = buildWhatsAppBookingUrl(number);
  const cta = whatsappUrl
    ? `<a class="cta" href="${escapeHtml(whatsappUrl)}" rel="noopener">Continue with Shiloh on WhatsApp <span aria-hidden="true">→</span></a>`
    : `<div class="cta unavailable" role="status">WhatsApp booking is temporarily unavailable</div>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="index,follow">
  <meta name="description" content="Book an appointment with Shiloh Massage Therapy and Aesthetic Clinic through Shiloh, our WhatsApp booking assistant.">
  <title>Book with Shiloh | Shiloh Massage Therapy and Aesthetic Clinic</title>
  <style>
    :root{--ink:#183028;--muted:#5c6f68;--cream:#f7f4ed;--paper:#fff;--sage:#dfe9df;--deep:#23483b;--line:#d9dfdb;--shadow:0 24px 70px rgba(24,48,40,.14)}
    *{box-sizing:border-box}html{background:var(--cream)}body{margin:0;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55}
    main{min-height:100vh;display:grid;place-items:center;padding:28px 18px}.card{width:min(760px,100%);background:var(--paper);border:1px solid rgba(24,48,40,.08);border-radius:28px;box-shadow:var(--shadow);overflow:hidden}
    .hero{padding:48px 48px 30px;background:linear-gradient(135deg,#fff 0%,#f3f6f1 56%,#e3ece3 100%)}.brand{font-size:13px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:var(--deep)}
    h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(38px,7vw,66px);line-height:1.02;letter-spacing:-.035em;margin:20px 0 18px;font-weight:500}.lead{font-size:19px;max-width:590px;color:var(--muted);margin:0}
    .content{padding:32px 48px 44px}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 28px}.step{border:1px solid var(--line);border-radius:16px;padding:16px}.num{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--sage);font-weight:800;margin-bottom:10px}.step strong{display:block;font-size:14px}.step span{font-size:13px;color:var(--muted)}
    .cta{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;padding:19px 22px;border-radius:16px;background:var(--deep);color:#fff;text-decoration:none;font-weight:800;font-size:17px;transition:transform .12s ease,box-shadow .12s ease}.cta:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(35,72,59,.22)}.cta:focus-visible{outline:4px solid #9db8aa;outline-offset:3px}.unavailable{background:#69766f;cursor:default}
    .trust{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px;color:var(--muted);font-size:13px}.pill{padding:7px 10px;border-radius:999px;background:#f5f6f4;border:1px solid var(--line)}footer{padding:0 48px 38px;color:#7a8781;font-size:12px}
    @media(max-width:620px){.hero{padding:34px 26px 24px}.content{padding:26px}.steps{grid-template-columns:1fr}.step{display:grid;grid-template-columns:36px 1fr;column-gap:8px;align-items:center}.num{grid-row:1/3;margin:0}.cta{font-size:16px}footer{padding:0 26px 28px}}
  </style>
</head>
<body>
  <main>
    <section class="card" aria-labelledby="booking-title">
      <div class="hero">
        <div class="brand">Shiloh Massage Therapy and Aesthetic Clinic</div>
        <h1 id="booking-title">Your appointment starts with Shiloh.</h1>
        <p class="lead">Chat with our WhatsApp assistant to find the right treatment, check real clinic availability and book your appointment.</p>
      </div>
      <div class="content">
        <div class="steps" aria-label="How booking works">
          <div class="step"><div class="num">1</div><strong>Tell Shiloh what you need</strong><span>Choose a treatment or ask for guidance.</span></div>
          <div class="step"><div class="num">2</div><strong>Check availability</strong><span>Shiloh uses the clinic's live booking rules and schedule.</span></div>
          <div class="step"><div class="num">3</div><strong>Confirm your booking</strong><span>Receive your appointment details in WhatsApp.</span></div>
        </div>
        ${cta}
        <div class="trust" aria-label="Booking assurances">
          <span class="pill">Official Shiloh WhatsApp</span>
          <span class="pill">Real clinic availability</span>
          <span class="pill">Secure client matching</span>
        </div>
      </div>
      <footer>37 Jacobs Street, Heidelberg, Gauteng · Booking availability is confirmed only after Shiloh completes the appointment flow.</footer>
    </section>
  </main>
</body>
</html>`;
}

module.exports = { BOOKING_MESSAGE, buildWhatsAppBookingUrl, renderBookingPage };
