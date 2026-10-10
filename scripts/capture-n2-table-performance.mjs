import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { table2Checkpoint } from './n2-table-contract-manifest.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const snapshotPath = join(root, 'baselines', 'n2-table', 'performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  ng,
  [
    'test',
    'ui-core',
    '--watch=false',
    '--no-coverage',
    '--include=table/neu-table.n2-baseline.spec.ts',
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
const match = output.match(/N2_TABLE_PERFORMANCE:(\{.*\})/);
if (!match) {
  console.error('The N2 Table performance fixture did not emit its metrics payload.');
  console.error(output);
  process.exit(1);
}

const live = JSON.parse(match[1]);
const snapshot = {
  checkpoint: table2Checkpoint,
  capturedAt: new Date().toISOString(),
  ...live,
};

if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== table2Checkpoint) {
    console.error(
      `Performance snapshot checkpoint is ${stored.checkpoint}, expected ${table2Checkpoint}.`,
    );
    process.exit(1);
  }
  for (const name of [
    'render1k',
    'render10k',
    'sort10k',
    'filter10k',
    'selection10k',
    'virtual10k',
    'lifecycle50',
  ]) {
    const metric = live.metrics[name];
    if (!metric || metric.p50Ms < 0 || metric.p95Ms < 0 || metric.domNodes < 0) {
      console.error(`Invalid live performance metric: ${name}`);
      process.exit(1);
    }
  }
  console.log(
    `N2 Table performance baseline passed (live 1k/10k + 50 lifecycle cycles; snapshot ${stored.capturedAt}).`,
  );
}
