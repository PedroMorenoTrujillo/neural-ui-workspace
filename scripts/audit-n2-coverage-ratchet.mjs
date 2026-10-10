import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COVERAGE_METRICS, evaluateCoverageRatchet, improvedCoverageBaseline } from './lib/n2-coverage-ratchet.mjs';
import {
  activeTestConfig, git, gitAncestor, installedToolchain, readCanonicalRun, readCoverageSummary,
} from './lib/n2-coverage-runtime.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baselinePath = join(root, 'baselines/n2-release/coverage-ratchet.json');
const update = process.argv.length === 3 && process.argv[2] === '--update';
if (process.argv.length > (update ? 3 : 2)) {
  console.error('Usage: npm run audit:coverage [-- --update]');
  process.exit(1);
}

try {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  if (!existsSync(join(root, baseline.provenance?.report ?? ''))) {
    throw new Error('Coverage provenance report is missing');
  }
  for (const historical of [baseline.provenance?.historicalThresholdCommit,
    baseline.provenance?.historicalAllMetricPassCommit]) {
    if (typeof historical !== 'string') throw new Error('Historical provenance commit is missing');
    git(root, ['cat-file', '-e', `${historical}^{commit}`]);
  }
  const run = readCanonicalRun(root);
  const summary = readCoverageSummary(root);
  const observation = {
    collectionSucceeded: true,
    command: run.command,
    sourceCommit: run.sourceCommit,
    sourceCommitIsDescendant: gitAncestor(root, baseline.sourceCommit, run.sourceCommit),
    testCount: run.tests,
    testFileCount: run.testFiles,
    productionRecordCount: summary.productionRecordCount,
    coverageProvider: 'v8',
    toolchain: installedToolchain(root),
    testConfig: activeTestConfig(root),
    metrics: summary.metrics,
  };
  const result = evaluateCoverageRatchet(baseline, observation);
  if (!result.ok) {
    for (const message of [...result.review, ...result.errors]) console.error(`N2 coverage ratchet: ${message}`);
    process.exitCode = result.code;
  } else {
    if (update) {
      const dirty = spawnSync(existsSync('/opt/homebrew/bin/git') ? '/opt/homebrew/bin/git' : 'git',
        ['diff', '--quiet', 'HEAD', '--'], { cwd: root });
      if (dirty.status !== 0) throw new Error('Commit tracked source and test changes before updating the baseline');
      const improved = improvedCoverageBaseline(baseline, observation);
      writeFileSync(baselinePath, `${JSON.stringify(improved, null, 2)}\n`);
      console.log('N2 coverage baseline updated by the improvement-only rule');
    }
    console.log(`N2 coverage ratchet PASS: ${COVERAGE_METRICS.map((name) => {
      const { covered, total } = observation.metrics[name];
      return `${name} ${covered}/${total} (${(Math.floor(covered * 10000 / total) / 100).toFixed(2)}%)`;
    }).join('; ')}`);
  }
} catch (error) {
  console.error(`N2 coverage audit failed: ${error.message}`);
  process.exitCode = 1;
}
