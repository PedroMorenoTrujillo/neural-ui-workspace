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
const snapshotPath = join(root, 'baselines/n2-table/virtualization-g-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  vitest,
  [
    'run',
    'projects/ui-core/table/neu-table.virtualization-performance.spec.ts',
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
const match = output.match(/N2_TABLE_VIRTUALIZATION_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011G virtualization performance payload is missing.');
const metrics = JSON.parse(match[1]);
const snapshot = { checkpoint: 'N2-011G', capturedAt: new Date().toISOString(), metrics };
const timed = [
  'pureRangeMath',
  'client10kTop',
  'client10kMiddle',
  'client10kEnd',
  'repeatedScroll1000',
  'remote1MProjection',
  'rangeCoverage',
  'requestDecision',
  'largeJump',
  'createDestroy50',
];
for (const name of timed) {
  const value = metrics[name];
  if (!value || value.samples !== 25 || value.p50Ms < 0 || value.p95Ms < 0) {
    throw new Error(`Invalid N2-011G performance metric: ${name}`);
  }
}
if (
  metrics.maxClientRenderRows > 28 ||
  metrics.remoteLogicalTotal !== 1_000_000 ||
  metrics.repeatedScrollRequests >= 20
) {
  throw new Error('N2-011G DOM/request bounds were exceeded.');
}
if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011G') throw new Error('Unexpected N2-011G checkpoint.');
  console.log(
    `N2-011G performance passed (range p95 ${metrics.pureRangeMath.p95Ms} ms; 10k middle p95 ${metrics.client10kMiddle.p95Ms} ms; remote 1M p95 ${metrics.remote1MProjection.p95Ms} ms; ${metrics.repeatedScrollRequests}/${metrics.repeatedScrollEvents} scroll requests; max ${metrics.maxClientRenderRows} client rows).`,
  );
}
