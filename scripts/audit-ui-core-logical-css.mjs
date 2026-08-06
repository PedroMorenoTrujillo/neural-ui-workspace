import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../projects/ui-core/', import.meta.url).pathname;
const files = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.scss')) files.push(path);
  }
}
walk(root);

const physical = /(?:^|[;{])\s*(?:(?:margin|padding|border)-(?:left|right)(?:-(?:color|style|width))?|(?:left|right))\s*:|text-align\s*:\s*(?:left|right)\b/gm;
const failures = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '');
  const matches = source.match(physical);
  if (matches?.length) failures.push(`${file.slice(root.length)}: ${[...new Set(matches)].join(', ')}`);
}
if (failures.length) {
  console.error(`Physical directional CSS found:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Logical CSS audit passed (${files.length} stylesheets)`);
