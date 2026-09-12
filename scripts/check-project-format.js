const fs = require('node:fs');

const jsonFiles = [
  'package.json',
  'package-lock.json',
];

for (const file of jsonFiles) {
  const source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const formatted = `${JSON.stringify(JSON.parse(source), null, 2)}\n`;
  if (source !== formatted) {
    throw new Error(`${file} must use canonical two-space JSON formatting and end with one newline.`);
  }
}

console.log(`Checked canonical formatting in ${jsonFiles.length} project configuration files.`);
