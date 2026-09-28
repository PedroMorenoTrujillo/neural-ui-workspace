import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const update = process.argv.includes('--update');
const packageJson = JSON.parse(readFileSync(join(root, 'projects/ui-core/package.json'), 'utf8'));
const coveragePath = join(root, 'coverage/ui-core/coverage-summary.json');
const runPath = join(root, 'coverage/ui-core/n2-coverage-run.json');
if (!existsSync(coveragePath) || !existsSync(runPath)) {
  console.error('README audit requires a complete N2 coverage run. Run npm run test:coverage first.');
  process.exit(1);
}
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8')).total;
const run = JSON.parse(readFileSync(runPath, 'utf8'));
if (run.exitCode !== 0 || !Number.isSafeInteger(run.tests) || run.tests < 1) {
  throw new Error('Canonical N2 test count is missing from the coverage run');
}
const entryPoints = readdirSync(join(root, 'projects/ui-core'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, 'projects/ui-core', entry.name, 'ng-package.json')))
  .length;
const tests = run.tests;
const block = [
  '<!-- neural-ui-metrics:start -->',
  `- **Version:** ${packageJson.version}`,
  `- **Entry points:** ${entryPoints}`,
  `- **Automated tests:** ${tests}`,
  `- **Coverage:** ${coverage.statements.pct}% statements · ${coverage.branches.pct}% branches · ${coverage.functions.pct}% functions · ${coverage.lines.pct}% lines`,
  '<!-- neural-ui-metrics:end -->',
].join('\n');
const files = [join(root, 'README.md'), join(root, 'projects/ui-core/README.md')];
let changed = false;
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  const next = source.replace(/<!-- neural-ui-metrics:start -->[\s\S]*?<!-- neural-ui-metrics:end -->/, block);
  if (next === source) continue;
  changed = true;
  if (update) writeFileSync(path, next);
}
if (changed && !update) {
  console.error('README metrics are stale. Run npm run docs:sync and review the result.');
  process.exit(1);
}
console.log(update ? 'README metrics synchronized.' : 'README metrics audit passed.');
