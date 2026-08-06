import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const root = new URL('..', import.meta.url).pathname;
const update = process.argv.includes('--update');
const packageJson = JSON.parse(readFileSync(join(root, 'projects/ui-core/package.json'), 'utf8'));
const coveragePath = join(root, 'coverage/ui-core/coverage-summary.json');
if (!existsSync(coveragePath)) {
  console.error('README audit requires coverage/ui-core/coverage-summary.json. Run npm test first.');
  process.exit(1);
}
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8')).total;
const coverageFloor = {
  statements: Math.floor(coverage.statements.pct),
  branches: Math.floor(coverage.branches.pct),
  functions: Math.floor(coverage.functions.pct),
  lines: Math.floor(coverage.lines.pct),
};
if (Object.values(coverageFloor).some((value) => value < 95)) {
  console.error('README audit requires at least 95% coverage in every metric.');
  process.exit(1);
}
const entryPoints = readdirSync(join(root, 'projects/ui-core'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, 'projects/ui-core', entry.name, 'ng-package.json')))
  .length;
const specFiles = readdirSync(join(root, 'projects/ui-core'), { recursive: true }).filter(
  (name) => typeof name === 'string' && name.endsWith('.spec.ts'),
);
let tests = 0;
for (const name of specFiles) {
  const path = join(root, 'projects/ui-core', name);
  const sourceFile = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      (node.expression.text === 'it' || node.expression.text === 'test')
    ) {
      tests += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}
const block = [
  '<!-- neural-ui-metrics:start -->',
  `- **Version:** ${packageJson.version}`,
  `- **Entry points:** ${entryPoints}`,
  `- **Automated tests:** ${tests}`,
  `- **Coverage:** ≥${coverageFloor.statements}% statements · ≥${coverageFloor.branches}% branches · ≥${coverageFloor.functions}% functions · ≥${coverageFloor.lines}% lines`,
  '<!-- neural-ui-metrics:end -->',
].join('\n');
const files = [join(root, 'README.md'), join(root, 'projects/ui-core/README.md')];
let changed = false;
const blockPattern = /<!-- neural-ui-metrics:start -->[\s\S]*?<!-- neural-ui-metrics:end -->/;
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  const next = source.replace(blockPattern, block);
  if (next === source) continue;
  changed = true;
  if (update) writeFileSync(path, next);
}
if (changed && !update) {
  console.error('README metrics are stale. Run npm run docs:sync and review the result.');
  process.exit(1);
}
console.log(update ? 'README metrics synchronized.' : 'README metrics audit passed.');
