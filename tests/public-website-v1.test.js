const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  renderHome,
  renderTreatments,
  renderAbout,
  renderContact,
} = require('../src/services/publicWebsite');

const catalogue = [
  {
    id: 101,
    name: 'Deep Tissue Massage',
    category: 'Massage',
    duration: '60 min',
    price: 'R850',
    description: 'Focused therapeutic massage.',
    bookingNote: '',
  },
  {
    id: 202,
    name: 'Signature Pedicure',
    category: 'Pedicures & Foot Care',
    duration: '75 min',
    price: 'R620',
    description: 'Foot care with a polished finish.',
    bookingNote: '',
  },
];

test('public Treatments renders canonical catalogue fields without creating booking authority', () => {
  const html = renderTreatments(catalogue);
  assert.match(html, /Deep Tissue Massage/);
  assert.match(html, /60 min/);
  assert.match(html, /R850/);
  assert.match(html, /Pedicures &amp; Foot Care/);
  assert.equal((html.match(/href="\/book"/g) || []).length >= 3, true);
  assert.doesNotMatch(html, /wa\.me/);
  assert.doesNotMatch(html, /availability=/);
  assert.match(html, /data-public-treatment-catalogue/);
});

test('public pages share coherent Home Treatments About Contact Book navigation', () => {
  for (const html of [renderHome(catalogue), renderTreatments(catalogue), renderAbout(), renderContact()]) {
    assert.match(html, /href="\/">Home<\/a>/);
    assert.match(html, /href="\/treatments"/);
    assert.match(html, /href="\/about"/);
    assert.match(html, /href="\/contact"/);
    assert.match(html, /href="\/book"/);
    assert.match(html, /name="viewport"/);
  }
});

test('public site keeps Phone-first touch and Desktop layout contracts explicit', () => {
  const html = renderHome(catalogue);
  assert.match(html, /@media\(max-width:700px\)/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /mobile-book/);
  assert.match(html, /grid-template-columns:1\.12fr \.88fr/);
});

test('routing reuses canonical catalogue and leaves canonical /book route intact', () => {
  const websiteRoute = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'publicWebsite.js'), 'utf8');
  const bookRoute = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'book.js'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(websiteRoute, /getPublicServiceCatalogue/);
  assert.match(bookRoute, /router\.get\('\/book'/);
  assert.match(bookRoute, /getPublicServiceCatalogue/);
  assert.match(app, /publicWebsiteRoutes/);
  assert.match(app, /bookRoutes/);
  assert.doesNotMatch(websiteRoute, /INSERT|UPDATE|DELETE|pool\.query/);
});

test('public presentation escapes canonical catalogue text', () => {
  const html = renderTreatments([{ ...catalogue[0], name: '<script>alert(1)</script>', category: 'Massage & Care' }]);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Massage &amp; Care/);
});
