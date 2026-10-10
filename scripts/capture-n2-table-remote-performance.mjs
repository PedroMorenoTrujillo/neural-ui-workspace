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
const snapshotPath = join(root, 'baselines/n2-table/remote-f-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  vitest,
  [
    'run',
    'projects/ui-core/table/neu-table.remote-performance.spec.ts',
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
const match = output.match(/N2_TABLE_REMOTE_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011F remote performance payload is missing.');
const metrics = JSON.parse(match[1]);
const snapshot = { checkpoint: 'N2-011F', capturedAt: new Date().toISOString(), metrics };
const timed = [
  'initialDecision',
  'sameQueryDecision',
  'queryChangeRequest',
  'retryDecision',
  'metadataResponse',
  'metadataStorm1000',
  'semanticEquality',
];
for (const name of timed) {
  const value = metrics[name];
  if (!value || value.samples !== 25 || value.p50Ms < 0 || value.p95Ms < 0) {
    throw new Error(`Invalid N2-011F performance metric: ${name}`);
  }
}
if (metrics.metadataStormRequests !== 0 || metrics.viewportRequests !== 0) {
  throw new Error('Metadata or deferred viewport work emitted a remote request.');
}
if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011F') throw new Error('Unexpected N2-011F checkpoint.');
  console.log(
    `N2-011F performance passed (initial p95 ${metrics.initialDecision.p95Ms} ms; same-query p95 ${metrics.sameQueryDecision.p95Ms} ms; query request p95 ${metrics.queryChangeRequest.p95Ms} ms; retry p95 ${metrics.retryDecision.p95Ms} ms; 1k metadata p95 ${metrics.metadataStorm1000.p95Ms} ms; zero metadata/viewport requests).`,
  );
}
