import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vitest = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vitest.cmd' : 'vitest',
);
const snapshotPath = join(root, 'baselines/n2-table/query-ui-e-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  vitest,
  [
    'run',
    'projects/ui-core/table/neu-table.query-ui-performance.spec.ts',
    '--config',
    'vitest.stress.config.mts',
    '--silent=false',
  ],
  { cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
);
const output = `${result.stdout}\n${result.stderr}`.replace(
  // eslint-disable-next-line no-control-regex
  /\u001b\[[0-9;]*m/g,
  '',
);
if (result.status !== 0) {
  console.error(output);
  process.exit(result.status ?? 1);
}
const match = output.match(/N2_TABLE_QUERY_UI_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011E query UI performance payload is missing.');
const metrics = JSON.parse(match[1]);
const snapshot = { checkpoint: 'N2-011E', capturedAt: new Date().toISOString(), metrics };
const timed = [
  'sortProposal',
  'multiSortProposal',
  'searchProposal',
  'simpleFilterTransform',
  'nestedFilterTransform',
  'pageProposal',
  'pageSizeProposal',
  'sameQuerySuppression',
  'renderPipeline100',
  'queryReplacement100',
];
for (const name of timed) {
  const value = metrics[name];
  if (!value || value.samples !== 25 || value.p50Ms < 0 || value.p95Ms < 0) {
    throw new Error(`Invalid N2-011E performance metric: ${name}`);
  }
}
if (metrics.pipelineEvaluations !== 2) {
  throw new Error('Rejected proposal invalidated the client pipeline.');
}
if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011E') throw new Error('Unexpected N2-011E checkpoint.');
  console.log(
    `N2-011E performance passed (sort proposal p95 ${metrics.sortProposal.p95Ms} ms; nested filter p95 ${metrics.nestedFilterTransform.p95Ms} ms; 100-row pipeline p95 ${metrics.renderPipeline100.p95Ms} ms; rejected proposal zero recompute).`,
  );
}
