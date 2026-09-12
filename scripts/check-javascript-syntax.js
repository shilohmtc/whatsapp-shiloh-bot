const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { wrap } = require('node:module');

const roots = [
  'app.js',
  'scripts',
  'src',
  'tests',
];

function javascriptFiles(entry) {
  const absolute = path.resolve(entry);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return absolute.endsWith('.js') ? [absolute] : [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap(item => (
    javascriptFiles(path.join(absolute, item.name))
  ));
}

const files = roots.flatMap(javascriptFiles).sort();
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8').replace(/^#!.*(?:\r?\n|$)/, '');
  new vm.Script(wrap(source), { filename: file, displayErrors: true });
}

console.log(`Checked JavaScript syntax in ${files.length} first-party files.`);
