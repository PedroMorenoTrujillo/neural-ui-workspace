import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findSourceMapReferences,
  restoreSourceMapReferences,
  stripSourceMapReferences,
} from './lib/release-artifacts.mjs';

test('normalizes external JavaScript source maps and is exactly reversible', () => {
  const source = 'export const value = 1;\n//# sourceMappingURL=value.js.map\n';
  const { stripped, removals } = stripSourceMapReferences(source);
  assert.equal(stripped, 'export const value = 1;\n');
  assert.equal(findSourceMapReferences(stripped).length, 0);
  assert.equal(restoreSourceMapReferences(stripped, removals), source);
});

test('normalizes CSS source map comments and preserves all executable content', () => {
  const source = '.value { color: red; }\n/*# sourceMappingURL=value.css.map */';
  const { stripped, removals } = stripSourceMapReferences(source);
  assert.equal(stripped, '.value { color: red; }\n');
  assert.equal(restoreSourceMapReferences(stripped, removals), source);
});
