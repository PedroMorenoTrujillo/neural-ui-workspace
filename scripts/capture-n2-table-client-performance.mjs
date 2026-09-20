import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const snapshotPath = join(root, 'baselines/n2-table/client-c-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  ng,
  [
    'test',
    'ui-core',
    '--watch=false',
    '--no-coverage',
    '--include=table/next/neu-table.next-performance.spec.ts',
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
const match = output.match(/N2_TABLE_CLIENT_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011C client pipeline performance payload is missing.');
const metrics = JSON.parse(match[1]);
const snapshot = { checkpoint: 'N2-011C', capturedAt: new Date().toISOString(), metrics };

for (const name of [
  'search1k',
  'search10k',
  'filter10k',
  'singleSort10k',
  'multiSort10k',
  'combined10k',
  'pageExtraction10k',
]) {
  const value = metrics[name];
  if (!value || value.samples !== 15 || value.p50Ms < 0 || value.p95Ms < 0) {
    throw new Error(`Invalid N2-011C client performance metric: ${name}`);
  }
}
for (const name of ['repeatedIdenticalReadMs', 'dataReplacementMs', 'queryReplacementMs']) {
  if (!Number.isFinite(metrics[name]) || metrics[name] < 0) {
    throw new Error(`Invalid N2-011C recompute metric: ${name}`);
  }
}
if (metrics.computedEvaluations !== 3) {
  throw new Error('Unexpected N2-011C computed invalidation count.');
}

if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011C') throw new Error('Unexpected client snapshot checkpoint.');
  console.log(
    `N2-011C client performance passed (10k filter p95 ${metrics.filter10k.p95Ms} ms; single sort p95 ${metrics.singleSort10k.p95Ms} ms; combined p95 ${metrics.combined10k.p95Ms} ms).`,
  );
}
