import { isDeepStrictEqual } from 'node:util';

export const COVERAGE_METRICS = ['statements', 'branches', 'functions', 'lines'];
export const COVERAGE_POLICY_VERSION = 'n2-ratchet-v1';

const whole = (value) => Number.isSafeInteger(value) && value >= 0;
const percentage = ({ covered, total }) => Math.floor((covered * 10000) / total) / 100;
const sha = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const commit = (value) => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);

export function validateCoverageBaseline(baseline) {
  const errors = [];
  if (!baseline || typeof baseline !== 'object') return ['Missing coverage baseline'];
  if (baseline.schemaVersion !== 1 || baseline.major !== 2 || baseline.policyVersion !== COVERAGE_POLICY_VERSION) {
    errors.push('Mismatched baseline schema, major, or policy version');
  }
  if (!commit(baseline.sourceCommit)) errors.push('Invalid baseline source commit');
  if (!whole(baseline.testCount) || baseline.testCount === 0 || !whole(baseline.testFileCount) || baseline.testFileCount === 0) {
    errors.push('Invalid baseline test population');
  }
  if (!whole(baseline.productionRecordCount) || baseline.productionRecordCount === 0) {
    errors.push('Invalid baseline production record count');
  }
  if (baseline.coverageProvider !== 'v8' || baseline.canonicalCommand !== 'npm run test:coverage' ||
      baseline.collectionCommand !== 'ng test ui-core --watch=false --coverage') {
    errors.push('Invalid coverage provider or canonical command provenance');
  }
  if (baseline.targetAllMetrics !== 95.01 || baseline.hardLineFloor !== 95.01) {
    errors.push('95.01 target or hard line floor changed');
  }
  if (baseline.materialDenominatorChangePercent !== 5 || baseline.materialRecordChangePercent !== 5) {
    errors.push('Material-change review boundaries changed');
  }
  const toolchain = baseline.toolchain ?? {};
  for (const name of ['angularCore', 'angularBuild', 'vitest', 'coverageV8']) {
    if (typeof toolchain[name] !== 'string' || !/^\d+\.\d+\.\d+/.test(toolchain[name])) {
      errors.push(`Invalid baseline ${name} version`);
    }
  }
  if (!whole(toolchain.nodeMajor) || toolchain.nodeMajor === 0) errors.push('Invalid baseline Node major');
  const config = baseline.testConfig ?? {};
  if (config.builder !== '@angular/build:unit-test' || config.tsConfig !== 'projects/ui-core/tsconfig.spec.json' ||
      config.runnerConfig !== 'vitest.coverage.config.mts' || config.include !== null ||
      !Array.isArray(config.exclude) || !Array.isArray(config.coverageReporters) ||
      config.coverage !== true || config.coverageThresholds?.lines !== 95.01 ||
      config.coverageThresholds?.perFile !== false ||
      Object.keys(config.coverageThresholds ?? {}).length !== 2 ||
      !sha(config.runnerConfigSha256) || !sha(config.specTsconfigSha256) ||
      !sha(config.releaseVerifierSha256) ||
      config.packageScripts?.test !== 'npm run test:coverage' ||
      config.packageScripts?.testUnit !== 'ng test ui-core --watch=false --no-coverage' ||
      config.packageScripts?.testCoverage !== 'node scripts/run-n2-coverage-gate.mjs' ||
      config.packageScripts?.testCoverageGate !== 'node --test scripts/n2-coverage-ratchet.spec.mjs' ||
      config.packageScripts?.auditCoverage !== 'node scripts/audit-n2-coverage-ratchet.mjs') {
    errors.push('Invalid baseline test and exclusion configuration');
  }
  if (!baseline.metrics || typeof baseline.metrics !== 'object') {
    errors.push('Missing baseline metrics');
  } else {
    for (const name of COVERAGE_METRICS) {
      const metric = baseline.metrics[name];
      if (!metric || !whole(metric.covered) || !whole(metric.total) || metric.total === 0 ||
          metric.covered > metric.total || metric.missed !== metric.total - metric.covered ||
          metric.percentage !== percentage(metric)) {
        errors.push(`Invalid baseline ${name} counts`);
      }
    }
  }
  const provenance = baseline.provenance ?? {};
  if (provenance.report !== 'N2-REL-02-COVERAGE-ASSURANCE.md' ||
      provenance.historicalThresholdCommit !== '470eaac03144d1c2d2dac3cd887d7cbbde91b79a' ||
      provenance.historicalAllMetricPassCommit !== 'bd1b168a6d2b185e20370225329a2546440a5ab4' ||
      provenance.historicalComparability !== 'partial' || typeof provenance.selection !== 'string') {
    errors.push('Invalid historical coverage provenance');
  }
  if (!Array.isArray(baseline.updates) || baseline.updates.length === 0) {
    if (!Array.isArray(baseline.observedRuns) || baseline.observedRuns.length !== 2) {
      errors.push('Initial baseline requires two canonical observations');
    } else {
      for (const run of baseline.observedRuns) {
        if (run.command !== baseline.collectionCommand || run.testFiles < baseline.testFileCount ||
            run.tests < baseline.testCount) {
          errors.push('Invalid initial baseline test run');
        }
      }
      for (const name of COVERAGE_METRICS) {
        if (baseline.observedRuns.some((run) => run[`${name}Total`] !== baseline.metrics?.[name]?.total) ||
            Math.min(...baseline.observedRuns.map((run) => run[`${name}Covered`])) !== baseline.metrics?.[name]?.covered) {
          errors.push(`Initial ${name} baseline is not the conservative two-run minimum`);
        }
      }
    }
  }
  return errors;
}

export function evaluateCoverageRatchet(baseline, observation) {
  const errors = validateCoverageBaseline(baseline);
  const review = [];
  if (!observation || typeof observation !== 'object') {
    return { ok: false, code: 1, errors: [...errors, 'Missing canonical coverage observation'], review };
  }
  if (observation.collectionSucceeded !== true || observation.command !== baseline?.collectionCommand) {
    errors.push('Canonical coverage collection did not complete successfully');
  }
  if (!whole(observation.testCount) || observation.testCount < (baseline?.testCount ?? Infinity) ||
      !whole(observation.testFileCount) || observation.testFileCount < (baseline?.testFileCount ?? Infinity)) {
    errors.push('Test population is below the approved baseline');
  }
  if (!whole(observation.productionRecordCount) || observation.productionRecordCount === 0) {
    errors.push('Production source population is unreadable');
  } else if (whole(baseline?.productionRecordCount) &&
      Math.abs(observation.productionRecordCount - baseline.productionRecordCount) * 100 >
        baseline.productionRecordCount * baseline.materialRecordChangePercent) {
    review.push('Material production record count change requires design review');
  }
  if (!commit(observation.sourceCommit) || observation.sourceCommitIsDescendant !== true) {
    errors.push('Coverage source commit is not descended from the approved baseline');
  }
  if (observation.coverageProvider !== baseline?.coverageProvider) review.push('Coverage provider changed');
  for (const name of ['angularCore', 'angularBuild', 'vitest', 'coverageV8', 'nodeMajor']) {
    if (observation.toolchain?.[name] !== baseline?.toolchain?.[name]) review.push(`${name} toolchain changed`);
  }
  if (!isDeepStrictEqual(observation.testConfig, baseline?.testConfig)) {
    errors.push('Test configuration, exclusions, or collection settings differ from the approved baseline');
  }
  for (const name of COVERAGE_METRICS) {
    const current = observation.metrics?.[name];
    const approved = baseline?.metrics?.[name];
    if (!current || !whole(current.covered) || !whole(current.total) || current.total === 0 ||
        current.covered > current.total || !approved || !whole(approved.total) || approved.total === 0) {
      errors.push(`Unreadable ${name} coverage counts`);
      continue;
    }
    if (Math.abs(current.total - approved.total) * 100 >
        approved.total * baseline.materialDenominatorChangePercent) {
      review.push(`Material ${name} denominator change requires design review`);
      continue;
    }
    if (current.covered * approved.total < approved.covered * current.total) {
      errors.push(`${name} percentage regressed below the approved baseline`);
    }
    if (current.total - current.covered > approved.missed) {
      errors.push(`${name} missed-unit debt increased above the approved baseline`);
    }
  }
  const lines = observation.metrics?.lines;
  if (lines && whole(lines.covered) && whole(lines.total) && lines.total > 0 &&
      lines.covered * 10000 < lines.total * 9501) {
    errors.push('Lines fell below the 95.01% hard release floor');
  }
  return { ok: errors.length === 0 && review.length === 0, code: review.length ? 2 : errors.length ? 1 : 0,
    errors, review };
}

export function improvedCoverageBaseline(baseline, observation) {
  const result = evaluateCoverageRatchet(baseline, observation);
  if (!result.ok) throw new Error([...result.review, ...result.errors].join('; '));
  return {
    ...baseline,
    sourceCommit: observation.sourceCommit,
    testCount: observation.testCount,
    testFileCount: observation.testFileCount,
    productionRecordCount: observation.productionRecordCount,
    metrics: Object.fromEntries(COVERAGE_METRICS.map((name) => {
      const { covered, total } = observation.metrics[name];
      return [name, { covered, total, percentage: percentage({ covered, total }), missed: total - covered }];
    })),
    provenance: { ...baseline.provenance, selection: 'explicit improvement-only ratchet update' },
    updates: [...(baseline.updates ?? []), { fromCommit: baseline.sourceCommit,
      toCommit: observation.sourceCommit, rule: 'all metrics nonregressive in percentage and missed debt' }],
  };
}
