const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { renderHome, renderTreatments } = require('../src/services/publicWebsite');

const catalogue = [
  { id: 1, name: 'Deep Tissue Massage', category: 'Massage', duration: '60 min', price: 'R850', description: 'Focused therapeutic massage.' },
  { id: 2, name: 'Signature Pedicure', category: 'Pedicures & Foot Care', duration: '75 min', price: 'R620', description: 'Foot care with a polished finish.' },
  { id: 3, name: 'Skin Consultation', category: 'Aesthetic Care', duration: '45 min', price: 'R500', description: 'A personal treatment consultation.' },
];

async function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const evidenceDir = path.join(process.cwd(), 'artifacts', 'public-website-v1');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await phone.setContent(renderHome(catalogue), { waitUntil: 'load' });
    await assertCondition(await phone.locator('.mobile-book').isVisible(), 'Phone sticky Book CTA must be visible');
    await assertCondition(await phone.locator('.mobile-menu').isVisible(), 'Phone primary navigation menu must be visible');
    await phone.locator('.mobile-menu summary').click();
    for (const href of ['/', '/treatments', '/about', '/contact', '/book']) {
      await assertCondition(await phone.locator(`.mobile-menu-panel a[href="${href}"]`).isVisible(), `Phone navigation must expose ${href}`);
    }
    const phoneBookHeight = await phone.locator('.mobile-book').evaluate((node) => node.getBoundingClientRect().height);
    await assertCondition(phoneBookHeight >= 44, `Phone Book target must be at least 44px; got ${phoneBookHeight}`);
    await assertCondition((await phone.locator('.hero-grid').evaluate((node) => getComputedStyle(node).gridTemplateColumns)).split(' ').length === 1, 'Phone hero must collapse to one column');
    await phone.screenshot({ path: path.join(evidenceDir, 'phone-home-390x844.png'), fullPage: true });

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await desktop.setContent(renderHome(catalogue), { waitUntil: 'load' });
    await assertCondition(await desktop.locator('.nav a[href="/treatments"]').isVisible(), 'Desktop full navigation must be visible');
    await assertCondition(!(await desktop.locator('.mobile-menu').isVisible()), 'Desktop must not show the Phone menu');
    await assertCondition(!(await desktop.locator('.mobile-book').isVisible()), 'Desktop must not show Phone sticky CTA');
    const columns = await desktop.locator('.hero-grid').evaluate((node) => getComputedStyle(node).gridTemplateColumns);
    await assertCondition(columns.split(' ').filter(Boolean).length === 2, `Desktop hero must retain two columns; got ${columns}`);
    await desktop.screenshot({ path: path.join(evidenceDir, 'desktop-home-1440x1000.png'), fullPage: true });

    await desktop.setContent(renderTreatments(catalogue), { waitUntil: 'load' });
    await assertCondition(await desktop.locator('[data-public-treatment-catalogue] .treatment-card').count() === catalogue.length, 'Desktop Treatments must render exact supplied canonical catalogue fixture');
    await assertCondition(await desktop.locator('.treatment-card a[href="/book"]').count() === catalogue.length, 'Every treatment CTA must route to canonical /book');
    await desktop.screenshot({ path: path.join(evidenceDir, 'desktop-treatments-1440x1000.png'), fullPage: true });

    console.log('Public Website V1 browser proof passed: Phone 390x844 + Desktop 1440x1000.');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
