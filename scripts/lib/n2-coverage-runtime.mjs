import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { COVERAGE_METRICS } from './n2-coverage-ratchet.mjs';

const foreign = 'projects/ui-core/tree-table/public_api 2.ts';
const gitBinary = existsSync('/opt/homebrew/bin/git') ? '/opt/homebrew/bin/git' : 'git';
export const coverageDirectory = 'coverage/ui-core';
export const coverageSummaryFile = `${coverageDirectory}/coverage-summary.json`;
export const coverageRunFile = `${coverageDirectory}/n2-coverage-run.json`;

export const sha256 = (content) => createHash('sha256').update(content).digest('hex');
export const git = (root, args) => execFileSync(gitBinary, args, { cwd: root, encoding: 'utf8' }).trim();
export const gitAncestor = (root, ancestor, descendant) =>
  spawnSync(gitBinary, ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: root }).status === 0;

function visit(root, directory, files) {
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (file === foreign) continue;
    if (entry.isDirectory()) visit(root, file, files);
    else if (entry.isFile()) files.push(file);
    else throw new Error(`Unsupported source entry: ${file}`);
  }
}

export function sourceFingerprint(root) {
  const files = [
    'angular.json', 'package.json', 'package-lock.json',
    'vitest.coverage.config.mts', 'projects/ui-core/tsconfig.spec.json',
    'scripts/run-n2-coverage-gate.mjs', 'scripts/audit-n2-coverage-hard-gate.mjs',
    'scripts/n2-coverage-hard-gate.spec.mjs',
    'scripts/lib/n2-coverage-hard-gate.mjs', 'scripts/lib/n2-coverage-runtime.mjs',
    'scripts/verify-release.mjs',
  ];
  visit(root, 'projects/ui-core', files);
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    hash.update(file).update('\0').update(readFileSync(join(root, file))).update('\0');
  }
  return hash.digest('hex');
}

export function installedToolchain(root) {
  const version = (name) => JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
  return {
    angularCore: version('@angular/core'),
    angularBuild: version('@angular/build'),
    vitest: version('vitest'),
    coverageV8: version('@vitest/coverage-v8'),
    nodeMajor: Number(process.versions.node.split('.')[0]),
  };
}

export function activeTestConfig(root) {
  const angular = JSON.parse(readFileSync(join(root, 'angular.json'), 'utf8').replace(/,\s*([}\]])/g, '$1'));
  const test = angular.projects?.['ui-core']?.architect?.test ?? angular.projects?.['ui-core']?.targets?.test;
  if (!test) throw new Error('Missing ui-core Angular test target');
  const options = test.options ?? {};
  const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts ?? {};
  return {
    builder: test.builder,
    tsConfig: options.tsConfig,
    runnerConfig: options.runnerConfig,
    include: options.include ?? null,
    exclude: options.exclude ?? null,
    coverage: options.coverage,
    coverageReporters: options.coverageReporters,
    coverageThresholds: options.coverageThresholds,
    runnerConfigSha256: sha256(readFileSync(join(root, options.runnerConfig))),
    specTsconfigSha256: sha256(readFileSync(join(root, options.tsConfig))),
    packageScripts: {
      test: scripts.test,
      testUnit: scripts['test:unit'],
      testCoverage: scripts['test:coverage'],
      testCoverageGate: scripts['test:coverage:gate'],
      auditCoverage: scripts['audit:coverage'],
    },
    releaseVerifierSha256: sha256(readFileSync(join(root, 'scripts/verify-release.mjs'))),
  };
}

export function readCoverageSummary(root) {
  const summary = JSON.parse(readFileSync(join(root, coverageSummaryFile), 'utf8'));
  const records = Object.entries(summary).filter(([name]) => name !== 'total');
  if (records.length === 0) throw new Error('No production coverage records');
  const paths = new Set();
  for (const [source] of records) {
    const rel = relative(root, resolve(root, source)).replaceAll('\\', '/');
    if (!rel.startsWith('projects/ui-core/') || /\.spec\.ts$/.test(rel) || paths.has(rel)) {
      throw new Error(`Invalid or duplicate production coverage record: ${source}`);
    }
    paths.add(rel);
  }
  const metrics = {};
  for (const name of COVERAGE_METRICS) {
    const total = summary.total?.[name];
    if (!Number.isSafeInteger(total?.covered) || !Number.isSafeInteger(total?.total) ||
        total.covered < 0 || total.total <= 0 || total.covered > total.total) {
      throw new Error(`Unreadable total ${name} coverage`);
    }
    const sumCovered = records.reduce((sum, [, record]) => sum + (record[name]?.covered ?? NaN), 0);
    const sumTotal = records.reduce((sum, [, record]) => sum + (record[name]?.total ?? NaN), 0);
    if (sumCovered !== total.covered || sumTotal !== total.total) {
      throw new Error(`Inconsistent ${name} source population and total`);
    }
    metrics[name] = { covered: total.covered, total: total.total };
  }
  return { metrics, productionRecordCount: records.length };
}

export function readCanonicalRun(root) {
  const run = JSON.parse(readFileSync(join(root, coverageRunFile), 'utf8'));
  const start = Date.parse(run.startedAt);
  const finish = Date.parse(run.finishedAt);
  const summary = join(root, coverageSummaryFile);
  if (run.schemaVersion !== 1 || run.exitCode !== 0 ||
      run.command !== 'ng test ui-core --watch=false --coverage' ||
      !Number.isFinite(start) || !Number.isFinite(finish) || finish < start ||
      Date.now() - finish > 60 * 60 * 1000 || finish > Date.now() + 60 * 1000 ||
      statSync(summary).mtimeMs < start - 1000 ||
      run.summarySha256 !== sha256(readFileSync(summary)) ||
      run.sourceFingerprint !== sourceFingerprint(root) ||
      run.sourceCommit !== git(root, ['rev-parse', 'HEAD'])) {
    throw new Error('Canonical coverage run is stale, incomplete, or changed since collection');
  }
  if (!Number.isSafeInteger(run.testFiles) || run.testFiles <= 0 ||
      !Number.isSafeInteger(run.tests) || run.tests <= 0) {
    throw new Error('Canonical test population was not recorded');
  }
  return run;
}
