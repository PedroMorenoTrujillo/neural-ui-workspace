import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertButtonIconBoundary,
  assertTableInitialBoundary,
  bytesForOutputs,
  outputClosure,
} from './lib/h9-static-closure.mjs';

const outputs = {
  'out/stdin.js': {
    entryPoint: '<stdin>',
    inputs: { '<stdin>': {} },
    imports: [{ path: 'out/core.js', kind: 'import-statement' }],
  },
  'out/core.js': {
    inputs: { 'dist/neural-ui/core/fesm2022/neural-ui-core-table.mjs': {} },
    imports: [
      { path: 'out/bridge.js', kind: 'import-statement' },
      { path: 'out/filter.js', kind: 'dynamic-import' },
      { path: 'out/editor.js', kind: 'dynamic-import' },
      { path: 'out/csv.js', kind: 'dynamic-import' },
      { path: 'out/json.js', kind: 'dynamic-import' },
      { path: 'out/xlsx.js', kind: 'dynamic-import' },
    ],
  },
  'out/bridge.js': { inputs: {}, imports: [{ path: '@angular/core', external: true }] },
  'out/filter.js': { inputs: { 'dist/neu-table-advanced-filter-builder.component-X.mjs': {} } },
  'out/editor.js': { inputs: { 'dist/neu-table-active-editor.component-X.mjs': {} } },
  'out/csv.js': { inputs: { 'dist/neu-table-csv-export-X.mjs': {} } },
  'out/json.js': { inputs: { 'dist/neu-table-json-export-X.mjs': {} } },
  'out/xlsx.js': { inputs: { 'dist/neu-table-xlsx-export-X.mjs': {} } },
};

test('initial closure recursively retains static chunks but excludes dynamic imports', () => {
  const initial = outputClosure({ outputs });
  assert.deepEqual(initial, ['out/bridge.js', 'out/core.js', 'out/stdin.js']);
  assert.deepEqual(assertTableInitialBoundary({ outputs }, initial).lazyOutputs, 5);
  assert.equal(outputClosure({ outputs }, { includeDynamic: true }).length, 8);
});

test('a lazy implementation retained statically is rejected', () => {
  const contaminated = structuredClone(outputs);
  contaminated['out/core.js'].imports[1].kind = 'import-statement';
  assert.throws(
    () =>
      assertTableInitialBoundary(
        { outputs: contaminated },
        outputClosure({ outputs: contaminated }),
      ),
    /advanced-filter implementation leaked/,
  );
});

test('missing core or lazy implementation is not a false PASS', () => {
  const missingCore = structuredClone(outputs);
  delete missingCore['out/core.js'].inputs['dist/neural-ui/core/fesm2022/neural-ui-core-table.mjs'];
  assert.throws(
    () =>
      assertTableInitialBoundary({ outputs: missingCore }, outputClosure({ outputs: missingCore })),
    /core FESM is absent/,
  );
  const missingLazy = structuredClone(outputs);
  missingLazy['out/core.js'].imports.pop();
  assert.throws(
    () =>
      assertTableInitialBoundary({ outputs: missingLazy }, outputClosure({ outputs: missingLazy })),
    /xlsx implementation missing/,
  );
});

test('missing graph outputs and bytes fail closed', () => {
  assert.throws(
    () =>
      outputClosure({
        outputs: { 'out/stdin.js': { entryPoint: '<stdin>', imports: [{ path: 'out/no.js' }] } },
      }),
    /Missing local output/,
  );
  assert.throws(
    () => bytesForOutputs({ outputFiles: [] }, ['out/stdin.js'], '/tmp'),
    /Missing output bytes/,
  );
});

test('Button component-only closure has no Neural Icons package dependency', () => {
  assert.doesNotThrow(() =>
    assertButtonIconBoundary({
      inputs: { 'dist/neural-ui/core/fesm2022/neural-ui-core-button.mjs': {} },
      outputs: { 'out.js': { imports: [] } },
    }),
  );
  assert.throws(
    () =>
      assertButtonIconBoundary({
        inputs: { 'node_modules/@neural-icons/angular/index.mjs': {} },
        outputs: { 'out.js': { imports: [] } },
      }),
    /retained icon package/,
  );
  assert.throws(
    () =>
      assertButtonIconBoundary({
        inputs: {},
        outputs: { 'out.js': { imports: [{ path: '@neural-icons/angular', external: true }] } },
      }),
    /still imports icon package/,
  );
});
