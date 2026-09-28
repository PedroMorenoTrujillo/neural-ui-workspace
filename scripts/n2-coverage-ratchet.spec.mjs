import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluateCoverageRatchet, improvedCoverageBaseline } from './lib/n2-coverage-ratchet.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = JSON.parse(readFileSync(join(root, 'baselines/n2-release/coverage-ratchet.json'), 'utf8'));
const fixture = () => ({
  collectionSucceeded: true,
  command: baseline.collectionCommand,
  sourceCommit: baseline.sourceCommit,
  sourceCommitIsDescendant: true,
  testCount: baseline.testCount,
  testFileCount: baseline.testFileCount,
  productionRecordCount: baseline.productionRecordCount,
  coverageProvider: baseline.coverageProvider,
  toolchain: structuredClone(baseline.toolchain),
  testConfig: structuredClone(baseline.testConfig),
  metrics: Object.fromEntries(Object.entries(baseline.metrics).map(([name, value]) =>
    [name, { covered: value.covered, total: value.total }])),
});
const verdict = (change, approved = baseline) => {
  const current = fixture();
  change(current);
  return evaluateCoverageRatchet(approved, current);
};

test('current N2 baseline passes the full ratchet', () => {
  assert.equal(evaluateCoverageRatchet(baseline, fixture()).ok, true);
});

test('one fewer covered branch fails', () => {
  const result = verdict((current) => { current.metrics.branches.covered -= 1; });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /branches.*(percentage|debt)/);
});

test('one additional missed statement fails even if display rounding obscures it', () => {
  const result = verdict((current) => { current.metrics.statements.total += 1; });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /statements missed-unit debt increased/);
});

test('a function regression fails', () => {
  const result = verdict((current) => { current.metrics.functions.covered -= 1; });
  assert.equal(result.ok, false);
});

test('lines below 95.01 fail the hard release floor', () => {
  const result = verdict((current) => { current.metrics.lines.covered = 18000; });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /95\.01% hard release floor/);
});

test('an improvement passes without rewriting the stored baseline', () => {
  const result = verdict((current) => { current.metrics.branches.covered += 1; });
  assert.equal(result.ok, true);
  assert.equal(baseline.metrics.branches.covered, 13086);
});

test('an explicit baseline update accepts only improved or equal metrics', () => {
  const current = fixture();
  current.metrics.branches.covered += 1;
  const improved = improvedCoverageBaseline(baseline, current);
  assert.equal(improved.metrics.branches.covered, baseline.metrics.branches.covered + 1);
  assert.equal(improved.metrics.branches.missed, baseline.metrics.branches.missed - 1);
  assert.equal(improved.updates.length, 1);
  assert.equal(baseline.metrics.branches.covered, 13086);
});

test('an explicit baseline update refuses a worse metric', () => {
  const current = fixture();
  current.metrics.functions.covered -= 1;
  assert.throws(() => improvedCoverageBaseline(baseline, current), /functions/);
});

test('mismatched schema or historical provenance fails', () => {
  const changed = structuredClone(baseline);
  changed.schemaVersion = 2;
  changed.provenance.historicalComparability = 'full';
  const result = evaluateCoverageRatchet(changed, fixture());
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /schema/);
  assert.match(result.errors.join(' '), /provenance/);
});

test('material denominator change fails closed for design review', () => {
  const result = verdict((current) => {
    current.metrics.branches.total += 800;
    current.metrics.branches.covered += 800;
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 2);
  assert.match(result.review.join(' '), /denominator change/);
});

test('toolchain version mismatch fails closed for design review', () => {
  const result = verdict((current) => { current.toolchain.angularBuild = '23.0.0'; });
  assert.equal(result.code, 2);
  assert.match(result.review.join(' '), /angularBuild toolchain changed/);
});

test('a new coverage exclusion fails', () => {
  const result = verdict((current) => { current.testConfig.exclude.push('**/date-input/**'); });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /exclusions/);
});

test('a lower exact percentage fails even when missed-unit debt is unchanged', () => {
  const result = verdict((current) => {
    current.metrics.statements.total -= 1;
    current.metrics.statements.covered -= 1;
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /statements percentage regressed/);
});

test('a reduced test population and failed collection cannot pass', () => {
  const result = verdict((current) => {
    current.testCount -= 1;
    current.collectionSucceeded = false;
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /Test population/);
  assert.match(result.errors.join(' '), /collection/);
});
