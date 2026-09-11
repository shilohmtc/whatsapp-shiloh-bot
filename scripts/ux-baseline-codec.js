const fs = require('node:fs');
const path = require('node:path');

const mode = process.argv[2];
const baselineDir = path.join(process.cwd(), 'tests', 'ux-baselines');
const expected = ['calendar-desktop.png', 'calendar-phone.png'];
const PART_SIZE = 12000;

fs.mkdirSync(baselineDir, { recursive: true });

function partPrefix(name) {
  return `${name}.b64.part`;
}

function partFiles(name) {
  const prefix = partPrefix(name);
  return fs.readdirSync(baselineDir)
    .filter((entry) => entry.startsWith(prefix))
    .sort();
}

if (mode === 'encode') {
  for (const name of expected) {
    const pngPath = path.join(baselineDir, name);
    if (!fs.existsSync(pngPath)) throw new Error(`Missing generated UX baseline: ${name}`);
    for (const stale of partFiles(name)) fs.rmSync(path.join(baselineDir, stale));
    const encoded = fs.readFileSync(pngPath).toString('base64');
    const parts = Math.ceil(encoded.length / PART_SIZE);
    for (let index = 0; index < parts; index += 1) {
      const suffix = String(index + 1).padStart(2, '0');
      fs.writeFileSync(path.join(baselineDir, `${partPrefix(name)}${suffix}`), `${encoded.slice(index * PART_SIZE, (index + 1) * PART_SIZE)}\n`);
    }
  }
  console.log(`Encoded ${expected.length} reviewed UX baseline candidates into bounded text parts.`);
} else if (mode === 'decode') {
  for (const name of expected) {
    const parts = partFiles(name);
    if (!parts.length) {
      throw new Error(`Missing committed UX baseline parts for ${name}. Generate and review the candidate before accepting visual drift.`);
    }
    const value = parts.map((entry) => fs.readFileSync(path.join(baselineDir, entry), 'utf8').trim()).join('');
    if (!value) throw new Error(`Committed UX baseline ${name} is empty.`);
    fs.writeFileSync(path.join(baselineDir, name), Buffer.from(value, 'base64'));
  }
  console.log(`Decoded ${expected.length} committed UX baselines for Playwright comparison.`);
} else {
  throw new Error('Usage: node scripts/ux-baseline-codec.js <encode|decode>');
}
