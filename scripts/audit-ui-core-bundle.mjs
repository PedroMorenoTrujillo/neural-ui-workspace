import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const fesmRoot = join(root, 'dist/neural-ui/core/fesm2022');

const maxEntryBytes = 260 * 1024;
const maxTotalBytes = 2_000 * 1024;
const heavyDependencyPatterns = [
  { pattern: /jspdf|pdfmake|xlsx\.full|exceljs/i, label: 'heavy export dependency' },
  { pattern: /moment|lodash\/lodash|date-fns\/locale/i, label: 'broad utility/date dependency' },
];

if (!existsSync(fesmRoot)) {
  console.error('FESM output not found. Run npm --prefix neural-ui-workspace run build first.');
  process.exit(1);
}

const files = readdirSync(fesmRoot)
  .filter((file) => file.endsWith('.mjs'))
  .map((file) => join(fesmRoot, file));

let total = 0;
const violations = [];

for (const file of files) {
  const stats = statSync(file);
  total += stats.size;

  if (stats.size > maxEntryBytes) {
    violations.push(`${basename(file)} is ${(stats.size / 1024).toFixed(1)}KB (limit ${(maxEntryBytes / 1024).toFixed(0)}KB)`);
  }

  const source = readFileSync(file, 'utf8');
  for (const check of heavyDependencyPatterns) {
    if (check.pattern.test(source)) {
      violations.push(`${basename(file)} contains ${check.label}`);
    }
  }
}

if (total > maxTotalBytes) {
  violations.push(`total FESM size is ${(total / 1024).toFixed(1)}KB (limit ${(maxTotalBytes / 1024).toFixed(0)}KB)`);
}

if (violations.length) {
  console.error('ui-core bundle audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`ui-core bundle audit passed (${files.length} chunks, ${(total / 1024).toFixed(1)}KB total)`);
