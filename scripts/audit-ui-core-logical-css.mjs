import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../projects/ui-core/', import.meta.url).pathname;
const stylesheetFiles = [];
const templateSourceFiles = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.scss')) stylesheetFiles.push(path);
    else if (path.endsWith('.ts') && !path.endsWith('.spec.ts')) templateSourceFiles.push(path);
  }
}
walk(root);

const physical =
  /(?:^|[;{])\s*(?:(?:margin|padding|border)-(?:left|right)(?:-(?:color|style|width))?|(?:left|right))\s*:|text-align\s*:\s*(?:left|right)\b/gm;
const failures = [];
for (const file of stylesheetFiles) {
  const source = readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '');
  const matches = source.match(physical);
  if (matches?.length)
    failures.push(`${file.slice(root.length)}: ${[...new Set(matches)].join(', ')}`);
}

const physicalTemplateBinding =
  /\[style\.(?:(?:margin|padding|border)-(?:left|right)(?:-(?:color|style|width))?|(?:margin|padding|border)(?:Left|Right)(?:Color|Style|Width)?)\b/g;
for (const file of templateSourceFiles) {
  const source = readFileSync(file, 'utf8');
  const matches = source.match(physicalTemplateBinding);
  if (matches?.length) {
    failures.push(`${file.slice(root.length)}: ${[...new Set(matches)].join(', ')}`);
  }
}
if (failures.length) {
  console.error(`Physical directional CSS found:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(
  `Logical CSS audit passed (${stylesheetFiles.length} stylesheets, ${templateSourceFiles.length} inline-template sources)`,
);
