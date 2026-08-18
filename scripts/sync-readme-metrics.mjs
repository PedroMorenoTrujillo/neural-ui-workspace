import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const root = new URL('..', import.meta.url).pathname;
const update = process.argv.includes('--update');
const packageJson = JSON.parse(readFileSync(join(root, 'projects/ui-core/package.json'), 'utf8'));
const coveragePath = join(root, 'coverage/ui-core/coverage-summary.json');
const qualityMatrixPath = join(root, 'projects/ui-core/quality/entrypoint-quality-matrix.json');
const showcaseEvidencePath = join(root, 'projects/ui-core/quality/showcase-evidence.json');
if (!existsSync(coveragePath)) {
  console.error(
    'README audit requires coverage/ui-core/coverage-summary.json. Run npm test first.',
  );
  process.exit(1);
}
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8')).total;
if (!existsSync(qualityMatrixPath) || !existsSync(showcaseEvidencePath)) {
  console.error(
    'README audit requires current quality-matrix and showcase evidence. Run the quality audits first.',
  );
  process.exit(1);
}
const qualityMatrix = JSON.parse(readFileSync(qualityMatrixPath, 'utf8'));
const showcaseEvidence = JSON.parse(readFileSync(showcaseEvidencePath, 'utf8'));
const entryPoints = readdirSync(join(root, 'projects/ui-core'), { withFileTypes: true }).filter(
  (entry) =>
    entry.isDirectory() &&
    existsSync(join(root, 'projects/ui-core', entry.name, 'ng-package.json')),
).length;
const specFiles = readdirSync(join(root, 'projects/ui-core'), { recursive: true }).filter(
  (name) => typeof name === 'string' && name.endsWith('.spec.ts'),
);
let tests = 0;
for (const name of specFiles) {
  const path = join(root, 'projects/ui-core', name);
  const sourceFile = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
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
const qualityStatuses = qualityMatrix.entryPoints
  .flatMap((entryPoint) => Object.values(entryPoint.checks))
  .reduce((summary, check) => {
    summary[check.status] = (summary[check.status] ?? 0) + 1;
    return summary;
  }, {});
const harnesses = qualityMatrix.entryPoints.filter(
  (entryPoint) => entryPoint.checks.harness.status === 'PASS',
).length;
const pendingVisualReviews = qualityMatrix.entryPoints.filter(
  (entryPoint) => entryPoint.checks.visual.status === 'UNVERIFIED',
).length;
const showcaseBaseline = qualityMatrix.metadata.baseline;
const block = [
  '<!-- neural-ui-metrics:start -->',
  `- **Version:** ${packageJson.version}`,
  `- **Entry points:** ${entryPoints}`,
  `- **Automated tests:** ${tests}`,
  `- **Coverage:** ${coverage.statements.pct}% statements · ${coverage.branches.pct}% branches · ${coverage.functions.pct}% functions · ${coverage.lines.pct}% lines`,
  `- **Public component harnesses:** ${harnesses} interactive entry points · ${entryPoints - harnesses} justified N/A`,
  `- **Showcase evidence:** ${showcaseBaseline.showcaseDemoPages} demos · ${showcaseEvidence.docs.apiPages} API pages · ${showcaseEvidence.accessibility.passed}/${showcaseEvidence.accessibility.checks} accessibility · ${showcaseEvidence.rtl.checks} RTL · ${showcaseEvidence.responsive.checks} responsive checks`,
  `- **Quality matrix:** ${qualityStatuses.PASS ?? 0} PASS · ${qualityStatuses['N/A'] ?? 0} N/A · ${qualityStatuses.UNVERIFIED ?? 0} pending human validation`,
  `- **Visual evidence:** ${showcaseBaseline.trackedVisualSnapshots} tracked snapshots · ${pendingVisualReviews ? 'explicit human approval required' : 'human review approved'}`,
  '<!-- neural-ui-metrics:end -->',
].join('\n');
const files = [join(root, 'README.md'), join(root, 'projects/ui-core/README.md')];
let changed = false;
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  const next = source.replace(
    /<!-- neural-ui-metrics:start -->[\s\S]*?<!-- neural-ui-metrics:end -->/,
    block,
  );
  if (next === source) continue;
  changed = true;
  if (update) writeFileSync(path, next);
}
if (changed && !update) {
  console.error('README metrics are stale. Run npm run docs:sync and review the result.');
  process.exit(1);
}
console.log(update ? 'README metrics synchronized.' : 'README metrics audit passed.');
