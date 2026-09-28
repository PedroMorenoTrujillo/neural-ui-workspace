import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateN2CoverageHardGate } from './lib/n2-coverage-hard-gate.mjs';

const passing = Object.fromEntries(
  ['statements', 'branches', 'functions', 'lines'].map((name) => [name, { covered: 9501, total: 10000 }]),
);

test('accepts the exact 95.01% fraction for all four metrics', () => {
  const result = evaluateN2CoverageHardGate(passing);
  assert.equal(result.ok, true);
  assert.deepEqual(result.results.map((entry) => entry.missing), [0, 0, 0, 0]);
});

test('rejects each metric independently without rounding a 95.00% fraction up', () => {
  for (const name of Object.keys(passing)) {
    const result = evaluateN2CoverageHardGate({ ...passing,
      [name]: { covered: 9500, total: 10000 } });
    assert.equal(result.ok, false);
    assert.deepEqual(result.results.filter((entry) => !entry.pass).map((entry) => entry.name), [name]);
    assert.equal(result.results.find((entry) => entry.name === name).missing, 1);
  }
});

test('uses the ceiling of the exact required hit count when denominators change', () => {
  const result = evaluateN2CoverageHardGate({ ...passing,
    branches: { covered: 95, total: 100 } });
  assert.equal(result.ok, false);
  assert.equal(result.results[1].required, 96);
  assert.equal(result.results[1].missing, 1);
});

test('rejects malformed or absent coverage counts', () => {
  assert.throws(() => evaluateN2CoverageHardGate({ ...passing, functions: undefined }),
    /Invalid functions coverage counts/);
  assert.throws(() => evaluateN2CoverageHardGate({ ...passing,
    lines: { covered: 2, total: 1 } }), /Invalid lines coverage counts/);
});
