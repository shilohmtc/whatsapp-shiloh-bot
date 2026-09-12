const fs = require('node:fs');
const path = require('node:path');

const mode = process.argv[2];
const baselineDir = path.join(process.cwd(), 'tests', 'ux-baselines');
const expected = [
  'calendar-desktop.png',
  'calendar-phone.png',
  'dashboard-desktop.png',
  'dashboard-phone.png',
  'client-history-desktop.png',
  'client-history-phone.png',
  'messages-desktop.png',
  'messages-phone.png',
  'appointment-editor-desktop.png',
  'appointment-editor-phone.png',
];
const PART_SIZE = 12000;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

fs.mkdirSync(baselineDir, { recursive: true });

function partPrefix(name) {
  return `${name}.b64.part`;
}

function validatePartNames(name, entries) {
  const prefix = partPrefix(name);
  const candidates = entries.filter((entry) => entry.startsWith(prefix));
  if (!candidates.length) {
    throw new Error(`Missing committed UX baseline parts for ${name}. Generate and review the candidate before accepting visual drift.`);
  }

  const groups = new Map();
  for (const entry of candidates) {
    const suffix = entry.slice(prefix.length);
    const match = suffix.match(/^(\d{2})([a-z]?)(\d*)$/);
    if (!match) throw new Error(`Malformed UX baseline part for ${name}: ${entry}`);
    const index = Number(match[1]);
    const subpart = match[2];
    const segmentText = match[3];
    if (index < 1) throw new Error(`UX baseline part numbering must start at 01 for ${name}: ${entry}`);
    if (!subpart && segmentText) throw new Error(`Malformed UX baseline part for ${name}: ${entry}`);
    const segment = segmentText ? Number(segmentText) : null;
    if (segmentText && segment < 1) throw new Error(`UX baseline nested segment numbering must start at 1 for ${name}: ${entry}`);
    if (!groups.has(index)) groups.set(index, []);
    groups.get(index).push({ entry, subpart, segment });
  }

  const indices = [...groups.keys()].sort((a, b) => a - b);
  for (let position = 0; position < indices.length; position += 1) {
    const expectedIndex = position + 1;
    if (indices[position] !== expectedIndex) {
      throw new Error(`Non-contiguous UX baseline parts for ${name}: expected part${String(expectedIndex).padStart(2, '0')} before part${String(indices[position]).padStart(2, '0')}`);
    }
  }

  const ordered = [];
  for (const index of indices) {
    const parts = groups.get(index);
    const primary = parts.filter(({ subpart }) => subpart === '');
    const split = parts.filter(({ subpart }) => subpart !== '');
    if (primary.length && split.length) {
      throw new Error(`Mixed full and split UX baseline part${String(index).padStart(2, '0')} for ${name}`);
    }
    if (primary.length !== 0 && primary.length !== 1) {
      throw new Error(`Duplicate UX baseline part${String(index).padStart(2, '0')} for ${name}`);
    }
    if (primary.length === 1) {
      ordered.push(primary[0].entry);
      continue;
    }

    const byLetter = new Map();
    for (const item of split) {
      if (!byLetter.has(item.subpart)) byLetter.set(item.subpart, []);
      byLetter.get(item.subpart).push(item);
    }
    const letters = [...byLetter.keys()].sort();
    for (let position = 0; position < letters.length; position += 1) {
      const expectedLetter = String.fromCharCode(97 + position);
      const letter = letters[position];
      if (letter !== expectedLetter) {
        throw new Error(`Non-contiguous UX baseline subparts for ${name} part${String(index).padStart(2, '0')}: expected ${expectedLetter}`);
      }
      const items = byLetter.get(letter);
      const unsplit = items.filter(({ segment }) => segment === null);
      const nested = items.filter(({ segment }) => segment !== null).sort((a, b) => a.segment - b.segment);
      if (unsplit.length && nested.length) {
        throw new Error(`Mixed full and nested UX baseline subpart ${letter} for ${name} part${String(index).padStart(2, '0')}`);
      }
      if (unsplit.length !== 0 && unsplit.length !== 1) {
        throw new Error(`Duplicate UX baseline subpart ${letter} for ${name} part${String(index).padStart(2, '0')}`);
      }
      if (unsplit.length === 1) {
        ordered.push(unsplit[0].entry);
        continue;
      }
      for (let nestedPosition = 0; nestedPosition < nested.length; nestedPosition += 1) {
        const expectedSegment = nestedPosition + 1;
        if (nested[nestedPosition].segment !== expectedSegment) {
          throw new Error(`Non-contiguous UX baseline nested segments for ${name} part${String(index).padStart(2, '0')}${letter}: expected ${expectedSegment}`);
        }
        ordered.push(nested[nestedPosition].entry);
      }
    }
  }
  return ordered;
}

function partFiles(name) {
  return validatePartNames(name, fs.readdirSync(baselineDir));
}

function decodeBase64Png(name, value) {
  if (!value) throw new Error(`Committed UX baseline ${name} is empty.`);
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`Committed UX baseline ${name} is not valid base64.`);
  }
  const png = Buffer.from(value, 'base64');
  if (png.length < PNG_SIGNATURE.length + PNG_IEND.length || !png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(`Committed UX baseline ${name} is not a valid PNG stream.`);
  }
  if (!png.subarray(png.length - PNG_IEND.length).equals(PNG_IEND)) {
    throw new Error(`Committed UX baseline ${name} is truncated or missing the PNG IEND marker.`);
  }
  return png;
}

function encodeBaselines() {
  for (const name of expected) {
    const pngPath = path.join(baselineDir, name);
    if (!fs.existsSync(pngPath)) throw new Error(`Missing generated UX baseline: ${name}`);
    const prefix = partPrefix(name);
    for (const stale of fs.readdirSync(baselineDir).filter((entry) => entry.startsWith(prefix))) {
      fs.rmSync(path.join(baselineDir, stale));
    }
    const encoded = fs.readFileSync(pngPath).toString('base64');
    const parts = Math.ceil(encoded.length / PART_SIZE);
    for (let index = 0; index < parts; index += 1) {
      const suffix = String(index + 1).padStart(2, '0');
      fs.writeFileSync(path.join(baselineDir, `${prefix}${suffix}`), `${encoded.slice(index * PART_SIZE, (index + 1) * PART_SIZE)}\n`);
    }
  }
  console.log(`Encoded ${expected.length} reviewed UX baseline candidates into bounded text parts.`);
}

function decodeBaselines() {
  for (const name of expected) {
    const parts = partFiles(name);
    const value = parts.map((entry) => fs.readFileSync(path.join(baselineDir, entry), 'utf8').trim()).join('');
    fs.writeFileSync(path.join(baselineDir, name), decodeBase64Png(name, value));
  }
  console.log(`Decoded ${expected.length} committed UX baselines for Playwright comparison.`);
}

function main() {
  if (mode === 'encode') encodeBaselines();
  else if (mode === 'decode') decodeBaselines();
  else throw new Error('Usage: node scripts/ux-baseline-codec.js <encode|decode>');
}

if (require.main === module) main();

module.exports = { PART_SIZE, validatePartNames, decodeBase64Png };
