import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const showcaseRoot = join(workspaceRoot, '..', 'neural-ui-showcase');
const browserPath = join(showcaseRoot, 'performance/results/browser-api-latest.json');
const lighthousePath = join(showcaseRoot, 'performance/results/lighthouse-summary.json');
const sizeLimitPath = join(workspaceRoot, 'projects/ui-core/quality/size-limit-latest.json');
const bundlePath = join(workspaceRoot, 'test-results/ui-core-bundle-summary.json');
const evidencePath = join(workspaceRoot, 'projects/ui-core/quality/performance-evidence.json');
const update = process.argv.includes('--update');

const requiredPaths = [browserPath, lighthousePath, sizeLimitPath, bundlePath];
for (const path of requiredPaths) {
  if (!existsSync(path)) throw new Error(`Missing performance evidence: ${path}`);
}

const browser = JSON.parse(readFileSync(browserPath, 'utf8'));
const lighthouse = JSON.parse(readFileSync(lighthousePath, 'utf8'));
const sizeLimit = JSON.parse(readFileSync(sizeLimitPath, 'utf8'));
const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

const routeAliases = new Map([
  ['dialog', 'modal'],
  ['toggle-button', 'toggle-button-group'],
]);
const entryPoints = browser.results
  .map((result) => {
    const routeName = result.route.split('/').filter(Boolean).at(-1);
    return {
      name: routeAliases.get(routeName) ?? routeName,
      route: result.route,
      status: 'PASS',
      p95: Object.fromEntries(
        Object.entries(result.summary).map(([metric, values]) => [metric, values.p95]),
      ),
    };
  })
  .sort((left, right) => left.name.localeCompare(right.name));

const failures = [];
if (browser.status !== 'PASS') failures.push('browser Performance API gate is not PASS');
if (lighthouse.status !== 'PASS') failures.push('Lighthouse CI gate is not PASS');
if (sizeLimit.status !== 'PASS') failures.push('Size Limit gate is not PASS');
if (bundle.status && bundle.status !== 'PASS') failures.push('bundle audit is not PASS');
if (entryPoints.length !== 81 || new Set(entryPoints.map((item) => item.name)).size !== 81) {
  failures.push(`expected 81 unique entry-point routes, found ${entryPoints.length}`);
}

const report = {
  schemaVersion: 1,
  capturedAt: [browser.capturedAt, lighthouse.capturedAt, sizeLimit.capturedAt, bundle.capturedAt]
    .filter(Boolean)
    .sort()
    .at(-1),
  status: failures.length ? 'FAIL' : 'PASS',
  sources: {
    browserApi: '../neural-ui-showcase/performance/results/browser-api-latest.json',
    lighthouse: '../neural-ui-showcase/performance/results/lighthouse-summary.json',
    sizeLimit: 'projects/ui-core/quality/size-limit-latest.json',
    bundle: 'test-results/ui-core-bundle-summary.json',
  },
  browserApi: {
    capturedAt: browser.capturedAt,
    runCount: browser.runCount,
    routeCount: entryPoints.length,
    budgets: browser.budgets,
    entryPoints,
  },
  lighthouse: {
    capturedAt: lighthouse.capturedAt,
    version: lighthouse.lighthouseVersion,
    budgets: lighthouse.budgets,
    results: lighthouse.results,
  },
  sizeLimit,
  bundle,
  failures,
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (update) {
  writeFileSync(evidencePath, serialized);
  console.log(`Performance evidence updated (${entryPoints.length} entry points).`);
} else {
  if (!existsSync(evidencePath) || readFileSync(evidencePath, 'utf8') !== serialized) {
    console.error('Performance evidence is stale. Run `npm run performance:sync`.');
    process.exitCode = 1;
  } else {
    console.log(`Performance evidence passed (${entryPoints.length} entry points).`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
