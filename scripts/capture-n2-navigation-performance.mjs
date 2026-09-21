import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const artifact = join(root, 'baselines/n2-navigation/n2-021-performance.json');
const update = process.argv.includes('--update');
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const result = spawnSync(
  ng,
  ['test', 'ui-core', '--watch=false', '--no-coverage', '--include=tabs/neu-navigation.performance.spec.ts'],
  { cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
);
const output = `${result.stdout}\n${result.stderr}`.replace(/\u001b\[[0-9;]*m/g, '');
if (result.status !== 0) {
  console.error(output);
  process.exit(result.status ?? 1);
}
const match = output.match(/N2_NAVIGATION_PERFORMANCE:(\{.*\})/);
if (!match) throw new Error('N2-021 navigation performance payload missing.');
const metrics = JSON.parse(match[1]);
for (const name of ['projection1k', 'membership1k', 'parentWrites1k', 'panelToggle', 'sidebarToggle', 'lifecycle50']) {
  if (!Number.isFinite(metrics[name]?.p50Ms) || !Number.isFinite(metrics[name]?.p95Ms)) {
    throw new Error(`Invalid performance metric: ${name}`);
  }
}
if (metrics.tabsProductEffects !== 0 || metrics.panelProductEffects !== 0 || metrics.tabsObservers !== 0 || metrics.tabsPersistentTimers !== 0) {
  throw new Error('N2-021 navigation resource budget drifted.');
}
const snapshot = { checkpoint: 'N2-021', capturedAt: new Date().toISOString(), metrics };
if (update) {
  mkdirSync(dirname(artifact), { recursive: true });
  writeFileSync(artifact, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated ${artifact}`);
} else {
  const baseline = JSON.parse(readFileSync(artifact, 'utf8'));
  if (baseline.checkpoint !== snapshot.checkpoint) throw new Error('Unexpected checkpoint.');
  console.log(`N2-021 navigation performance verified: ${JSON.stringify(metrics)}`);
}
