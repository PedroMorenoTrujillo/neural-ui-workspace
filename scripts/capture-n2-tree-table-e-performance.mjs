import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const artifact = join(root, 'baselines/n2-tree-table/query-e-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  ng,
  [
    'test',
    'ui-core',
    '--watch=false',
    '--no-coverage',
    '--include=tree-table/neu-tree-table.query-performance.spec.ts',
    '--runner-config=vitest.n2-tree-table.config.mts',
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
const match = output.match(/N2_TREE_TABLE_E_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('N2-015E performance payload missing.');
const metrics = JSON.parse(match[1]);
for (const name of [
  'search1kNoMatch',
  'search1kSparse',
  'search10kNoMatch',
  'search10kMany',
  'searchDeep1k',
  'filter1kSimple',
  'filter10kNested',
  'sort10kSingle',
  'sort10kMulti',
  'combined1k',
  'combined10k',
  'proposals100',
  'transitions100',
  'destroy50',
]) {
  if (!Number.isFinite(metrics[name]?.p50Ms) || !Number.isFinite(metrics[name]?.p95Ms)) {
    throw new Error(`Invalid performance metric: ${name}`);
  }
}
const snapshot = { checkpoint: 'N2-015E', capturedAt: new Date().toISOString(), metrics };
if (update) {
  mkdirSync(dirname(artifact), { recursive: true });
  writeFileSync(artifact, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${artifact}`);
} else {
  const stored = JSON.parse(readFileSync(artifact, 'utf8'));
  if (stored.checkpoint !== 'N2-015E') throw new Error('Unexpected TreeTable E baseline.');
  console.log(
    `N2-015E performance passed (search 10k p50 ${metrics.search10kMany.p50Ms} ms; nested filter 10k ${metrics.filter10kNested.p50Ms} ms; multi-sort 10k ${metrics.sort10kMulti.p50Ms} ms; combined 10k ${metrics.combined10k.p50Ms} ms; 50 create/destroy ${metrics.destroy50.p50Ms} ms).`,
  );
}
