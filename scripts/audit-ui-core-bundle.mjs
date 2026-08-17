import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = new URL('..', import.meta.url).pathname;
const fesmRoot = join(root, 'dist/neural-ui/core/fesm2022');
const reportPath = join(root, 'test-results/ui-core-bundle-summary.json');

const maxEntryBytes = 260 * 1024;
const maxEntryGzipBytes = 48 * 1024;
// Scaled from the 81-entry-point 2,000KB budget for the 90-entry-point catalog.
const maxTotalBytes = 2_250 * 1024;
const maxTotalGzipBytes = 450 * 1024;
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
let totalGzip = 0;
const violations = [];
const entries = [];

for (const file of files) {
  const stats = statSync(file);
  const source = readFileSync(file);
  const gzipBytes = gzipSync(source, { level: 9 }).length;
  total += stats.size;
  totalGzip += gzipBytes;
  entries.push({
    file: basename(file),
    rawBytes: stats.size,
    gzipBytes,
  });

  if (stats.size > maxEntryBytes) {
    violations.push(
      `${basename(file)} is ${(stats.size / 1024).toFixed(1)}KB (limit ${(maxEntryBytes / 1024).toFixed(0)}KB)`,
    );
  }

  if (gzipBytes > maxEntryGzipBytes) {
    violations.push(
      `${basename(file)} is ${(gzipBytes / 1024).toFixed(1)}KB gzip (limit ${(maxEntryGzipBytes / 1024).toFixed(0)}KB)`,
    );
  }

  const sourceText = source.toString('utf8');
  for (const check of heavyDependencyPatterns) {
    if (check.pattern.test(sourceText)) {
      violations.push(`${basename(file)} contains ${check.label}`);
    }
  }
}

if (total > maxTotalBytes) {
  violations.push(
    `total FESM size is ${(total / 1024).toFixed(1)}KB (limit ${(maxTotalBytes / 1024).toFixed(0)}KB)`,
  );
}

if (totalGzip > maxTotalGzipBytes) {
  violations.push(
    `total FESM gzip size is ${(totalGzip / 1024).toFixed(1)}KB (limit ${(maxTotalGzipBytes / 1024).toFixed(0)}KB)`,
  );
}

entries.sort(
  (left, right) => right.gzipBytes - left.gzipBytes || left.file.localeCompare(right.file),
);
mkdirSync(join(root, 'test-results'), { recursive: true });
writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      formatVersion: 1,
      budgets: {
        maxEntryBytes,
        maxEntryGzipBytes,
        maxTotalBytes,
        maxTotalGzipBytes,
      },
      totals: {
        entries: entries.length,
        rawBytes: total,
        gzipBytes: totalGzip,
      },
      entries,
      violations,
    },
    null,
    2,
  )}\n`,
);

if (violations.length) {
  console.error('ui-core bundle audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(
  `ui-core bundle audit passed (${files.length} chunks, ${(total / 1024).toFixed(1)}KB raw, ${(totalGzip / 1024).toFixed(1)}KB gzip; report: ${reportPath})`,
);
