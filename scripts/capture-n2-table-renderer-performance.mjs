import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const snapshotPath = join(root, 'baselines/n2-table/renderer-b-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  ng,
  [
    'test',
    'ui-core',
    '--watch=false',
    '--no-coverage',
    '--include=table/neu-table.performance.spec.ts',
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
const match = output.match(/N2_TABLE_RENDERER_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011B renderer performance payload is missing.');
const metrics = JSON.parse(match[1]);
const snapshot = {
  checkpoint: 'N2-011B',
  capturedAt: new Date().toISOString(),
  metrics,
};

for (const name of ['render100', 'render1000']) {
  const value = metrics[name];
  if (!value || value.p50Ms < 0 || value.p95Ms < 0 || value.domNodes <= 0) {
    throw new Error(`Invalid N2-011B renderer performance metric: ${name}`);
  }
}
for (const name of ['parentReplacement1000Ms', 'reorder1000Ms', 'destroy50Ms']) {
  if (!Number.isFinite(metrics[name]) || metrics[name] < 0) {
    throw new Error(`Invalid N2-011B renderer performance metric: ${name}`);
  }
}

if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011B') throw new Error('Unexpected renderer snapshot checkpoint.');
  console.log(
    `N2-011B renderer performance passed (100 rows p50 ${metrics.render100.p50Ms} ms; 1k rows p50 ${metrics.render1000.p50Ms} ms; destroy x50 ${metrics.destroy50Ms} ms).`,
  );
}
