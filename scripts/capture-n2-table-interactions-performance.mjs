import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vitest = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vitest.cmd' : 'vitest');
const snapshotPath = join(root, 'baselines/n2-table/interactions-h-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  vitest,
  [
    'run',
    'projects/ui-core/table/neu-table.interactions-performance.spec.ts',
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
const match = output.match(/N2_TABLE_H_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011H interaction performance payload is missing.');
const metrics = JSON.parse(match[1]);
for (const name of [
  'startEdit',
  'draftUpdate',
  'commitProjection',
  'startCancel100',
  'expansion100',
  'expansion1k',
  'grouping1k',
  'grouping10k',
]) {
  const value = metrics[name];
  if (!value || value.samples !== 25 || value.p50Ms < 0 || value.p95Ms < 0) {
    throw new Error(`Invalid N2-011H performance metric: ${name}`);
  }
}
if (
  metrics.activeSessionsAfterCleanup !== 0 ||
  metrics.groups1k !== 20 ||
  metrics.groups10k !== 100
) {
  throw new Error('N2-011H cleanup or grouping cardinality invariant failed.');
}
const snapshot = { checkpoint: 'N2-011H', capturedAt: new Date().toISOString(), metrics };
if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011H') throw new Error('Unexpected N2-011H checkpoint.');
  console.log(
    `N2-011H performance passed (edit start p95 ${metrics.startEdit.p95Ms} ms; 1k groups p95 ${metrics.grouping1k.p95Ms} ms; 10k groups p95 ${metrics.grouping10k.p95Ms} ms; active sessions ${metrics.activeSessionsAfterCleanup}).`,
  );
}
