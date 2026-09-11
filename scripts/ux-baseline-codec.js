const fs = require('node:fs');
const path = require('node:path');

const mode = process.argv[2];
const baselineDir = path.join(process.cwd(), 'tests', 'ux-baselines');
const expected = ['calendar-desktop.png', 'calendar-phone.png'];

fs.mkdirSync(baselineDir, { recursive: true });

if (mode === 'encode') {
  for (const name of expected) {
    const pngPath = path.join(baselineDir, name);
    if (!fs.existsSync(pngPath)) throw new Error(`Missing generated UX baseline: ${name}`);
    fs.writeFileSync(`${pngPath}.b64`, `${fs.readFileSync(pngPath).toString('base64')}\n`);
  }
  console.log(`Encoded ${expected.length} reviewed UX baseline candidates.`);
} else if (mode === 'decode') {
  for (const name of expected) {
    const encodedPath = path.join(baselineDir, `${name}.b64`);
    if (!fs.existsSync(encodedPath)) {
      throw new Error(`Missing committed UX baseline ${name}.b64. Generate and review the candidate before accepting visual drift.`);
    }
    const value = fs.readFileSync(encodedPath, 'utf8').trim();
    if (!value) throw new Error(`Committed UX baseline ${name}.b64 is empty.`);
    fs.writeFileSync(path.join(baselineDir, name), Buffer.from(value, 'base64'));
  }
  console.log(`Decoded ${expected.length} committed UX baselines for Playwright comparison.`);
} else {
  throw new Error('Usage: node scripts/ux-baseline-codec.js <encode|decode>');
}
