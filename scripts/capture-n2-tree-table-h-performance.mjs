import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const artifact = join(root, 'baselines/n2-tree-table/final-features-h-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  ng,
  [
    'test',
    'ui-core',
    '--watch=false',
    '--no-coverage',
    '--include=tree-table/neu-tree-table.final-features-performance.spec.ts',
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
const match = output.match(/N2_TREE_TABLE_H_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('N2-015H performance payload missing.');
const metrics = JSON.parse(match[1]);
for (const name of [
  'edit100',
  'project1k',
  'project10k',
  'csv1k',
  'csv10k',
  'json1k',
  'json10k',
  'xlsx1k',
  'xlsx10k',
  'lifecycle100',
]) {
  if (!Number.isFinite(metrics[name]?.p50Ms) || !Number.isFinite(metrics[name]?.p95Ms)) {
    throw new Error(`Invalid performance metric: ${name}`);
  }
}
const snapshot = { checkpoint: 'N2-015H', capturedAt: new Date().toISOString(), metrics };
if (update) {
  mkdirSync(dirname(artifact), { recursive: true });
  writeFileSync(artifact, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${artifact}`);
} else {
  const baseline = JSON.parse(readFileSync(artifact, 'utf8'));
  if (baseline.checkpoint !== snapshot.checkpoint) throw new Error('Unexpected checkpoint.');
  console.log(`N2-015H performance verified: ${JSON.stringify(metrics)}`);
}
