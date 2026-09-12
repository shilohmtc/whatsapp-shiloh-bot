const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { calendarAppointmentDetailsClientScript } = require('../src/presentation/calendarAppointmentDetailsUx');
const { renderCalendarRetrospectiveBookingPage } = require('../src/presentation/calendarRetrospectiveBookingV1Ux');

const output = path.join(process.cwd(), 'artifacts', 'calendar-appointment-authority-v1');
fs.mkdirSync(output, { recursive: true });

const states = [
  { name: 'phone', viewport: { width: 390, height: 844 } },
  { name: 'desktop', viewport: { width: 1440, height: 1000 } },
];

function calendarFixture(editable) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--panel:#fff;--line:#dfe5df;--leaf-soft:#e7eee9;--leaf-deep:#294b3e}body{font-family:system-ui;background:#f7f5ef;padding:20px}.event-card{min-height:64px;border:1px solid #dfe5df;border-radius:14px;background:#fff;padding:14px;max-width:420px}.event-card h4{margin:4px 0}.event-meta{display:flex;gap:8px}.eyebrow{font-size:11px;text-transform:uppercase}</style></head><body><article class="event-card" data-event-id="appointment-42" data-kind="appointment" data-canonical="true" ${editable ? 'data-appointment-management-target="true" data-appointment-id="42"' : ''} data-client-name="Client Example" data-client-mobile="+27 82 000 0000" data-service-name="Treatment Example" data-practitioner-names="Practitioner A" data-appointment-status="confirmed"><div class="event-time"><span class="event-time-range">09:00–10:00</span></div><span class="kind-pill">Appointment</span><h4>Client Example</h4><p class="event-client-mobile">+27 82 000 0000</p><p class="event-meta"><span class="event-practitioners">Practitioner A</span><span class="event-service-context"><span>Treatment Example</span></span><span class="event-state">confirmed</span></p></article><script>${calendarAppointmentDetailsClientScript()}</script></body></html>`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const state of states) {
      const page = await browser.newPage({ viewport: state.viewport });
      await page.setContent(calendarFixture(false));
      const card = page.locator('.event-card');
      if ((await card.getAttribute('role')) !== 'button') throw new Error(`${state.name}: visible appointment is not interactive`);
      await card.click();
      await page.locator('[data-appointment-details-dialog][open]').waitFor();
      if (await page.locator('[data-details-edit]').isVisible()) throw new Error(`${state.name}: read-only viewer received edit action`);
      await page.screenshot({ path: path.join(output, `${state.name}-appointment-details.png`), fullPage: true });

      await page.setContent(calendarFixture(true));
      await page.locator('.event-card').click();
      await page.locator('[data-appointment-details-dialog][open]').waitFor();
      if (!(await page.locator('[data-details-edit]').isVisible())) throw new Error(`${state.name}: editor did not receive edit handoff`);

      const past = renderCalendarRetrospectiveBookingPage({ options: { staff: [{ id: 1, displayName: 'Practitioner A', serviceIds: [1] }], services: [{ id: 1, name: 'Canonical Treatment', durationMinutes: 60, staffIds: [1] }] } });
      await page.setContent(past.replace(/<script src="[^"]+" defer><\/script>/, ''));
      await page.selectOption('#past-service', 'custom');
      await page.locator('[data-custom-service-field]').evaluate(el => { el.hidden = false; });
      if ((await page.locator('#past-custom-service').count()) !== 1) throw new Error(`${state.name}: Custom service field missing`);
      if ((await page.locator('[data-add-past]').count()) !== 1) throw new Error(`${state.name}: Add New Appointment action missing`);
      const minHeight = await page.locator('.button').first().evaluate(el => getComputedStyle(el).minHeight);
      if (state.name === 'phone' && Number.parseFloat(minHeight) < 44) throw new Error('phone: interaction target below 44px');
      await page.screenshot({ path: path.join(output, `${state.name}-past-appointment.png`), fullPage: true });
      await page.close();
    }
  } finally {
    await browser.close();
  }
})();
