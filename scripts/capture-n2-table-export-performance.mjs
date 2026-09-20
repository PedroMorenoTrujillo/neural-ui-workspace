import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vitest = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vitest.cmd' : 'vitest');
const snapshotPath = join(root, 'baselines/n2-table/export-i-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  vitest,
  [
    'run',
    'projects/ui-core/table/next/neu-table.export-performance.spec.ts',
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
const match = output.match(/N2_TABLE_I_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011I export performance payload is missing.');
const metrics = JSON.parse(match[1]);
for (const name of ['csv1k', 'csv10k', 'json1k', 'json10k', 'xlsx1k']) {
  const value = metrics[name];
  if (!value || value.samples !== 25 || value.p50Ms < 0 || value.p95Ms < 0 || value.outputBytes <= 0) {
    throw new Error(`Invalid N2-011I performance metric: ${name}`);
  }
}
if (
  metrics.csvLoadMs < 0 ||
  metrics.jsonLoadMs < 0 ||
  metrics.xlsxLoadMs < 0 ||
  metrics.matrixCells1k !== 4_000 ||
  metrics.matrixCells10k !== 40_000
) {
  throw new Error('N2-011I load or projection cardinality invariant failed.');
}
const snapshot = { checkpoint: 'N2-011I', capturedAt: new Date().toISOString(), metrics };
if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011I') throw new Error('Unexpected N2-011I checkpoint.');
  console.log(
    `N2-011I performance passed (CSV 10k p95 ${metrics.csv10k.p95Ms} ms; JSON 10k p95 ${metrics.json10k.p95Ms} ms; XLSX 1k p95 ${metrics.xlsx1k.p95Ms} ms).`,
  );
}
