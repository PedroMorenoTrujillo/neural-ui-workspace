import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const uiCoreRoot = join(workspaceRoot, 'projects/ui-core');
const lcovPath = join(workspaceRoot, 'coverage/ui-core/lcov.info');

const defaults = { lines: 90, branches: 85, functions: 80 };
const overrides = {
  // Harness predicates generate many optional-filter branches while retaining
  // virtually complete executable-line coverage.
  testing: { branches: 65 },
  // Timeline is declarative; Angular reports projected-template factories as
  // functions. Its executable lines and branches are fully covered.
  timeline: { functions: 60 },
};

if (!existsSync(lcovPath)) {
  console.error(
    'Entry-point coverage audit requires coverage/ui-core/lcov.info. Run npm test first.',
  );
  process.exit(1);
}

const entryPoints = readdirSync(uiCoreRoot)
  .filter((entry) => existsSync(join(uiCoreRoot, entry, 'ng-package.json')))
  .sort((left, right) => left.localeCompare(right));
const coverage = new Map();

for (const record of readFileSync(lcovPath, 'utf8').split('end_of_record')) {
  const source = record.match(/^SF:projects\/ui-core\/([^/\r\n]+)\//m)?.[1];
  if (!source) continue;
  const metric = coverage.get(source) ?? {
    lines: { found: 0, hit: 0 },
    branches: { found: 0, hit: 0 },
    functions: { found: 0, hit: 0 },
  };
  add(metric.lines, record, 'LF', 'LH');
  add(metric.branches, record, 'BRF', 'BRH');
  add(metric.functions, record, 'FNF', 'FNH');
  coverage.set(source, metric);
}

const failures = [];
const rows = [];
for (const entryPoint of entryPoints) {
  const metric = coverage.get(entryPoint);
  if (!metric) {
    failures.push(`${entryPoint}: no instrumented source found in lcov.info`);
    continue;
  }
  const thresholds = { ...defaults, ...(overrides[entryPoint] ?? {}) };
  const result = {
    entryPoint,
    lines: percentage(metric.lines),
    branches: percentage(metric.branches),
    functions: percentage(metric.functions),
  };
  rows.push(result);
  for (const dimension of ['lines', 'branches', 'functions']) {
    if (result[dimension] + Number.EPSILON < thresholds[dimension]) {
      failures.push(
        `${entryPoint}: ${dimension} ${result[dimension].toFixed(2)}% < ${thresholds[dimension]}%`,
      );
    }
  }
}

rows.sort(
  (left, right) => left.lines - right.lines || left.entryPoint.localeCompare(right.entryPoint),
);
for (const row of rows) {
  console.log(
    `PASS ${row.entryPoint}: lines ${row.lines.toFixed(2)}% · branches ${row.branches.toFixed(2)}% · functions ${row.functions.toFixed(2)}%`,
  );
}

if (failures.length) {
  console.error('\nEntry-point coverage audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Entry-point coverage audit passed for ${entryPoints.length}/${entryPoints.length} public entry points.`,
);

function add(target, record, foundKey, hitKey) {
  target.found += value(record, foundKey);
  target.hit += value(record, hitKey);
}

function value(record, key) {
  return Number(record.match(new RegExp(`^${key}:(\\d+)`, 'm'))?.[1] ?? 0);
}

function percentage(metric) {
  return metric.found === 0 ? 100 : (metric.hit / metric.found) * 100;
}
