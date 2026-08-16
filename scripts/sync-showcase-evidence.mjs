import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const showcaseRoot = join(workspaceRoot, '../neural-ui-showcase');
const qualityRoot = join(workspaceRoot, 'projects/ui-core/quality');
const matrixPath = join(qualityRoot, 'entrypoint-quality-matrix.json');
const outputPath = join(qualityRoot, 'showcase-evidence.json');

function load(path, label) {
  if (!existsSync(path)) throw new Error(`${label} is missing: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const accessibilityPath = join(showcaseRoot, 'test-results/showcase-a11y-summary.json');
const responsivePath = join(showcaseRoot, 'test-results/showcase-responsive-summary.json');
const rtlPath = join(showcaseRoot, 'test-results/showcase-rtl-summary.json');
const docsPath = join(showcaseRoot, 'test-results/docs-api-summary.json');
const accessibility = load(accessibilityPath, 'Showcase accessibility summary');
const responsive = load(responsivePath, 'Showcase responsive summary');
const rtl = load(rtlPath, 'Showcase RTL summary');
const docs = load(docsPath, 'Showcase API documentation summary');
const matrix = load(matrixPath, 'Entry-point quality matrix');

const failures = [];
const expectedAccessibilityTotal = accessibility.routes?.length * 2 * accessibility.themes?.length;
if (
  accessibility.total !== expectedAccessibilityTotal ||
  accessibility.passed !== accessibility.total ||
  accessibility.failed !== 0 ||
  accessibility.errors?.length !== 0 ||
  accessibility.failures?.length !== 0
) {
  failures.push(
    `accessibility evidence is not a complete pass (${accessibility.passed}/${accessibility.total})`,
  );
}

const requiredBrowsers = ['chromium', 'firefox', 'webkit'];
const requiredViewports = ['mobile-320', 'mobile-360', 'mobile-390', 'tablet-768', 'desktop-1440'];
if (
  responsive.full !== true ||
  responsive.checks !== 2610 ||
  responsive.failures?.length !== 0 ||
  requiredBrowsers.some((browser) => !responsive.browsers?.includes(browser)) ||
  requiredViewports.some((viewport) => !responsive.viewports?.includes(viewport))
) {
  failures.push('responsive evidence is not a complete 2,610-check cross-browser pass');
}

const rtlRouteSet = new Set(rtl.routes ?? []);
if (
  rtl.status !== 'PASS' ||
  rtl.checks !== rtlRouteSet.size * requiredBrowsers.length ||
  rtl.failures?.length !== 0 ||
  requiredBrowsers.some((browser) => !rtl.browsers?.some((entry) => entry.name === browser))
) {
  failures.push('RTL evidence is not a complete cross-browser dynamic-direction pass');
}

const docsByEntryPoint = new Map((docs.summary ?? []).map((entry) => [entry.entry, entry]));
const invalidDocs = (docs.summary ?? []).filter(
  (entry) => entry.missingInputs?.length || entry.missingOutputs?.length,
);
if (docsByEntryPoint.size !== 79 || invalidDocs.length) {
  failures.push(
    `API documentation evidence is incomplete (${docsByEntryPoint.size}/79 pages, ${invalidDocs.length} invalid)`,
  );
}

const routeAliases = new Map([
  ['modal', 'dialog'],
  ['toggle-button-group', 'toggle-button'],
]);
const routeSet = new Set(accessibility.routes ?? []);
const entryPoints = matrix.entryPoints.map(({ name }) => {
  const routeName = routeAliases.get(name) ?? name;
  const route = `/components/${routeName}`;
  const hasRoute = routeSet.has(route);
  const hasRtlRoute = rtlRouteSet.has(`/en${route}`);
  const apiDocs = docsByEntryPoint.get(name);
  const specialDocs =
    name === 'testing'
      ? 'projects/showcase/src/app/pages/testing/testing.component.html'
      : name === 'url-state'
        ? 'projects/showcase/src/app/pages/url-state-demo/url-state-demo.component.html'
        : null;

  if (!hasRoute) failures.push(`${name}: showcase route ${route} is missing`);
  if (!hasRtlRoute) failures.push(`${name}: RTL showcase route /en${route} is missing`);
  if (!apiDocs && !specialDocs) failures.push(`${name}: public documentation evidence is missing`);

  return {
    name,
    route,
    accessibility: hasRoute ? 'PASS' : 'FAIL',
    responsive: hasRoute ? 'PASS' : 'FAIL',
    rtl: hasRtlRoute ? 'PASS' : 'FAIL',
    docs: apiDocs || specialDocs ? 'PASS' : 'FAIL',
    docsEvidence: apiDocs ? 'test-results/docs-api-summary.json' : specialDocs,
  };
});

if (failures.length) {
  console.error('Showcase evidence audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const evidence = {
  schemaVersion: 1,
  capturedAt: accessibility.completedAt,
  status: 'PASS',
  accessibility: {
    standard: 'WCAG 2.2 AA automated axe-core rules',
    routes: accessibility.routes.length,
    locales: 2,
    themes: accessibility.themes,
    checks: accessibility.total,
    passed: accessibility.passed,
    source: 'test-results/showcase-a11y-summary.json',
  },
  responsive: {
    browsers: responsive.browsers,
    viewports: responsive.viewports,
    checks: responsive.checks,
    source: 'test-results/showcase-responsive-summary.json',
  },
  rtl: {
    browsers: rtl.browsers.map((entry) => entry.name),
    routes: rtlRouteSet.size,
    checks: rtl.checks,
    source: 'test-results/showcase-rtl-summary.json',
  },
  docs: {
    apiPages: docsByEntryPoint.size,
    missingInputs: 0,
    missingOutputs: 0,
    source: 'test-results/docs-api-summary.json',
  },
  entryPoints,
  limitations: [
    'Automated axe-core results do not replace keyboard or screen-reader manual validation.',
    'Responsive checks cover layout integrity; visual baseline approval remains a separate human gate.',
    'Dynamic RTL checks verify live inheritance, route stability and overflow; direction-sensitive interaction details additionally require unit contracts.',
  ],
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(
  `Showcase evidence passed (${accessibility.passed} accessibility, ${responsive.checks} responsive, ${rtl.checks} RTL, ${docsByEntryPoint.size} API documentation checks).`,
);
