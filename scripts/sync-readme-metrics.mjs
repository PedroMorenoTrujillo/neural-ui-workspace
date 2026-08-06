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
  `- **Coverage:** ${coverage.statements.pct}% statements · ${coverage.branches.pct}% branches · ${coverage.functions.pct}% functions · ${coverage.lines.pct}% lines`,
  '<!-- neural-ui-metrics:end -->',
].join('\n');
const files = [join(root, 'README.md'), join(root, 'projects/ui-core/README.md')];
let changed = false;
let invalid = false;
const blockPattern = /<!-- neural-ui-metrics:start -->[\s\S]*?<!-- neural-ui-metrics:end -->/;
const coveragePattern = /- \*\*Coverage:\*\* ([\d.]+)% statements · ([\d.]+)% branches · ([\d.]+)% functions · ([\d.]+)% lines/;
const coverageValues = [
  coverage.statements.pct,
  coverage.branches.pct,
  coverage.functions.pct,
  coverage.lines.pct,
];
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  const currentBlock = source.match(blockPattern)?.[0] ?? '';
  const next = source.replace(blockPattern, block);
  if (next === source) continue;
  changed = true;
  if (update) {
    writeFileSync(path, next);
    continue;
  }

  const currentCoverage = currentBlock.match(coveragePattern)?.slice(1).map(Number) ?? [];
  const currentIdentity = currentBlock.replace(coveragePattern, '<coverage>');
  const expectedIdentity = block.replace(coveragePattern, '<coverage>');
  const coverageIsPortable =
    currentCoverage.length === coverageValues.length &&
    currentCoverage.every(
      (value, index) => value >= 95 && Math.abs(value - coverageValues[index]) <= 0.1,
    );
  invalid ||= currentIdentity !== expectedIdentity || !coverageIsPortable;
}
if (changed && !update && invalid) {
  console.error('README metrics are stale. Run npm run docs:sync and review the result.');
  process.exit(1);
}
console.log(update ? 'README metrics synchronized.' : 'README metrics audit passed.');
