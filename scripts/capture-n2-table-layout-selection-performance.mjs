import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const snapshotPath = join(root, 'baselines/n2-table/layout-selection-d-performance.json');
const update = process.argv.includes('--update');
const result = spawnSync(
  ng,
  [
    'test',
    'ui-core',
    '--watch=false',
    '--no-coverage',
    '--include=table/next/neu-table.layout-selection-performance.spec.ts',
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
const match = output.match(/N2_TABLE_LAYOUT_SELECTION_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('The N2-011D layout/selection performance payload is missing.');
const metrics = JSON.parse(match[1]);
const snapshot = { checkpoint: 'N2-011D', capturedAt: new Date().toISOString(), metrics };

for (const name of [
  'keysMembership10k',
  'rows10kKeys5k',
  'toggleOneKey',
  'headerState10k',
  'allMatchingExclusions1k',
  'offscreenSelectionPageChange',
  'columns100Projection',
  'visibilityProjection100',
  'reorderProposal100',
  'resizeProposal100',
]) {
  const value = metrics[name];
  if (!value || value.samples !== 15 || value.p50Ms < 0 || value.p95Ms < 0) {
    throw new Error(`Invalid N2-011D performance metric: ${name}`);
  }
}
if (!Number.isFinite(metrics.repeatedUnchangedReadMs) || metrics.repeatedUnchangedReadMs < 0) {
  throw new Error('Invalid N2-011D unchanged-read metric.');
}
if (
  metrics.pipelineComputations !== 1 ||
  metrics.selectionComputations !== 2 ||
  metrics.layoutComputations !== 2
) {
  throw new Error('Unexpected N2-011D computed invalidation count.');
}

if (update) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${snapshotPath}`);
} else {
  const stored = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  if (stored.checkpoint !== 'N2-011D') throw new Error('Unexpected N2-011D snapshot checkpoint.');
  console.log(
    `N2-011D performance passed (10k keys p95 ${metrics.rows10kKeys5k.p95Ms} ms; all-matching p95 ${metrics.allMatchingExclusions1k.p95Ms} ms; 100-column layout p95 ${metrics.columns100Projection.p95Ms} ms).`,
  );
}
