import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const qualityRoot = join(workspaceRoot, 'projects/ui-core/quality');
const matrixPath = join(qualityRoot, 'entrypoint-quality-matrix.json');
const evidencePath = join(qualityRoot, 'showcase-evidence.json');

function load(path, label) {
  if (!existsSync(path)) throw new Error(`${label} is missing: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const matrix = load(matrixPath, 'Entry-point quality matrix');
const evidence = load(evidencePath, 'Checked-in showcase evidence');
const failures = [];
const requiredBrowsers = ['chromium', 'firefox', 'webkit'];
const requiredViewports = [
  'mobile-320',
  'mobile-360',
  'mobile-390',
  'tablet-768',
  'desktop-1440',
];

if (evidence.schemaVersion !== 1 || evidence.status !== 'PASS') {
  failures.push('checked-in showcase evidence is not a schema-v1 PASS');
}

if (
  Number.isNaN(Date.parse(evidence.capturedAt)) ||
  evidence.accessibility?.checks !== 348 ||
  evidence.accessibility?.passed !== evidence.accessibility?.checks ||
  evidence.accessibility?.routes *
      evidence.accessibility?.locales *
      evidence.accessibility?.themes?.length !==
    evidence.accessibility?.checks ||
  !evidence.accessibility?.themes?.includes('light') ||
  !evidence.accessibility?.themes?.includes('dark')
) {
  failures.push('accessibility snapshot is not a complete 348-check pass');
}

if (
  evidence.responsive?.checks !== 2610 ||
  requiredBrowsers.some((browser) => !evidence.responsive?.browsers?.includes(browser)) ||
  requiredViewports.some((viewport) => !evidence.responsive?.viewports?.includes(viewport))
) {
  failures.push('responsive snapshot is not a complete 2,610-check cross-browser pass');
}

if (
  evidence.rtl?.checks !== evidence.rtl?.routes * requiredBrowsers.length ||
  requiredBrowsers.some((browser) => !evidence.rtl?.browsers?.includes(browser))
) {
  failures.push('RTL snapshot is not a complete cross-browser pass');
}

if (
  evidence.docs?.apiPages !== 79 ||
  evidence.docs?.missingInputs !== 0 ||
  evidence.docs?.missingOutputs !== 0
) {
  failures.push('API documentation snapshot is incomplete');
}

const matrixNames = new Set((matrix.entryPoints ?? []).map(({ name }) => name));
const evidenceNames = new Set((evidence.entryPoints ?? []).map(({ name }) => name));
if (
  matrixNames.size !== 81 ||
  evidenceNames.size !== matrixNames.size ||
  [...matrixNames].some((name) => !evidenceNames.has(name))
) {
  failures.push('showcase evidence does not cover all 81 quality-matrix entry points');
}

for (const entry of evidence.entryPoints ?? []) {
  if (
    entry.accessibility !== 'PASS' ||
    entry.responsive !== 'PASS' ||
    entry.rtl !== 'PASS' ||
    entry.docs !== 'PASS' ||
    !entry.route?.startsWith('/components/') ||
    !entry.docsEvidence
  ) {
    failures.push(`${entry.name ?? 'unknown'}: incomplete showcase evidence`);
  }
}

if (!Array.isArray(evidence.limitations) || evidence.limitations.length < 3) {
  failures.push('showcase evidence must disclose its automated-review limitations');
}

if (failures.length) {
  console.error('Checked-in showcase evidence audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Checked-in showcase evidence passed (${evidence.accessibility.passed} accessibility, ${evidence.responsive.checks} responsive, ${evidence.rtl.checks} RTL, ${evidence.docs.apiPages} API documentation checks across ${evidenceNames.size} entry points).`,
);
