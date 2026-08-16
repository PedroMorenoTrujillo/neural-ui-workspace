import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const evidencePath = join(
  workspaceRoot,
  'projects/ui-core/quality/performance-evidence.json',
);

if (!existsSync(evidencePath)) {
  throw new Error(`Checked-in performance evidence is missing: ${evidencePath}`);
}

const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
const failures = [];

if (
  evidence.schemaVersion !== 1 ||
  evidence.status !== 'PASS' ||
  Number.isNaN(Date.parse(evidence.capturedAt)) ||
  evidence.failures?.length !== 0
) {
  failures.push('checked-in performance evidence is not a schema-v1 PASS');
}

const browser = evidence.browserApi;
const browserEntries = browser?.entryPoints ?? [];
const browserNames = new Set(browserEntries.map(({ name }) => name));
if (
  browser?.runCount !== 3 ||
  browser?.routeCount !== 81 ||
  browserEntries.length !== 81 ||
  browserNames.size !== 81 ||
  browserEntries.some(
    (entry) => entry.status !== 'PASS' || !entry.route?.startsWith('/en/components/'),
  )
) {
  failures.push('browser Performance API evidence must cover three runs for 81 entry points');
}

const browserBudgets = browser?.budgets ?? {};
for (const entry of browserEntries) {
  const p95 = entry.p95 ?? {};
  const overBudget =
    p95.firstContentfulPaintMs > browserBudgets.firstContentfulPaintMsP95 ||
    p95.domContentLoadedMs > browserBudgets.domContentLoadedMsP95 ||
    p95.loadEventMs > browserBudgets.loadEventMsP95 ||
    p95.cumulativeLayoutShift > browserBudgets.cumulativeLayoutShiftMax ||
    p95.longTaskTotalMs > browserBudgets.longTaskTotalMsP95 ||
    p95.transferredBytes > browserBudgets.transferredBytesP95;
  if (overBudget) failures.push(`${entry.name}: browser performance budget exceeded`);
}

const lighthouse = evidence.lighthouse;
const lighthouseBudgets = lighthouse?.budgets ?? {};
const lighthouseResults = lighthouse?.results ?? [];
if (
  !lighthouse?.version ||
  lighthouseResults.length !== 4 ||
  lighthouseResults.some((result) => result.runs !== 3 || !result.route)
) {
  failures.push('Lighthouse evidence must contain three runs for each of four routes');
}

for (const result of lighthouseResults) {
  const median = result.median ?? {};
  const overBudget =
    median.performanceScore < lighthouseBudgets.performanceScoreMin ||
    median.accessibilityScore < lighthouseBudgets.accessibilityScoreMin ||
    median.bestPracticesScore < lighthouseBudgets.bestPracticesScoreMin ||
    median.seoScore < lighthouseBudgets.seoScoreMin ||
    median.largestContentfulPaintMs > lighthouseBudgets.largestContentfulPaintMsMax ||
    median.cumulativeLayoutShift > lighthouseBudgets.cumulativeLayoutShiftMax ||
    median.totalBlockingTimeMs > lighthouseBudgets.totalBlockingTimeMsMax;
  if (overBudget) failures.push(`${result.route}: Lighthouse budget exceeded`);
}

const sizeLimit = evidence.sizeLimit;
if (
  sizeLimit?.schemaVersion !== 1 ||
  sizeLimit?.status !== 'PASS' ||
  sizeLimit?.results?.length !== 4 ||
  sizeLimit.results.some(
    (result) => result.passed !== true || result.size > result.sizeLimit,
  )
) {
  failures.push('Size Limit evidence is incomplete or over budget');
}

const bundle = evidence.bundle;
if (
  bundle?.formatVersion !== 1 ||
  bundle?.totals?.entries !== 82 ||
  bundle?.totals?.rawBytes > bundle?.budgets?.maxTotalBytes ||
  bundle?.totals?.gzipBytes > bundle?.budgets?.maxTotalGzipBytes ||
  bundle?.entries?.length !== bundle?.totals?.entries ||
  bundle?.entries?.some(
    (entry) =>
      entry.rawBytes > bundle?.budgets?.maxEntryBytes ||
      entry.gzipBytes > bundle?.budgets?.maxEntryGzipBytes,
  ) ||
  bundle?.violations?.length !== 0
) {
  failures.push('compiled bundle evidence is incomplete or over budget');
}

if (failures.length) {
  console.error('Checked-in performance evidence audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Checked-in performance evidence passed (${browserEntries.length} browser routes × ${browser.runCount} runs, ${lighthouseResults.length * 3} Lighthouse reports, ${bundle.totals.entries} bundle entries).`,
);
