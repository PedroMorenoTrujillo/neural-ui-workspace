import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateN2CoverageHardGate, N2_COVERAGE_METRICS } from './lib/n2-coverage-hard-gate.mjs';
import { activeTestConfig, readCanonicalRun, readCoverageSummary } from './lib/n2-coverage-runtime.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

try {
  if (process.argv.length !== 2) throw new Error('Coverage hard gate has no update mode');
  const config = activeTestConfig(root);
  if (config.coverage !== true || config.coverageThresholds?.perFile !== false ||
      config.include !== null ||
      JSON.stringify(config.exclude) !== JSON.stringify(['**/*.stress.spec.ts']) ||
      !['text', 'html', 'lcov', 'json', 'json-summary'].every((name) =>
        config.coverageReporters?.includes(name))) {
    throw new Error('Canonical coverage scope or reporters changed');
  }
  for (const name of N2_COVERAGE_METRICS) {
    if (config.coverageThresholds[name] !== 95.01) {
      throw new Error(`${name} built-in threshold differs from 95.01%`);
    }
  }
  const run = readCanonicalRun(root);
  const summary = readCoverageSummary(root);
  if (run.testFiles < 188 || run.tests < 2568 || summary.productionRecordCount < 180) {
    throw new Error('Canonical test or production source population regressed');
  }
  const gate = evaluateN2CoverageHardGate(summary.metrics);
  for (const result of gate.results) {
    const rate = (100 * result.covered / result.total).toFixed(4);
    console.log(`${result.name}: ${result.covered}/${result.total} (${rate}%), ` +
      `required ${result.required}, missing ${result.missing}: ${result.pass ? 'PASS' : 'FAIL'}`);
  }
  if (!gate.ok) process.exitCode = 1;
} catch (error) {
  console.error(`N2 coverage hard gate failed: ${error.message}`);
  process.exitCode = 1;
}
