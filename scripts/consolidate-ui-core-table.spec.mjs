import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { consolidateUiCoreTable } from './consolidate-ui-core-table.mjs';

test('preserves every export and leaves optional features lazy through compatible helper facades', async () => {
  const root = mkdtempSync(join(tmpdir(), 'neural-static-table-test-'));
  const directory = join(root, 'fesm2022');
  mkdirSync(directory);
  writeFileSync(join(root, 'package.json'), JSON.stringify({ exports: {
    './table': { types: './types/table.d.ts', default: './fesm2022/neural-ui-core-table.mjs' },
  } }));
  const entry = join(directory, 'neural-ui-core-table.mjs');
  const helper = join(directory, 'helper.mjs');
  const secondHelper = join(directory, 'second-helper.mjs');
  const lazy = join(directory, 'optional.mjs');
  const before = "export { add } from './helper.mjs'; export { double } from './second-helper.mjs'; export async function optional() { return import('./optional.mjs'); }";
  writeFileSync(entry, before);
  writeFileSync(helper, 'export function add(a, b) { return a + b; }');
  writeFileSync(secondHelper, 'export function double(value) { return value * 2; }');
  for (const file of [helper, secondHelper]) {
    writeFileSync(`${file}.map`, JSON.stringify({
      version: 3, sources: [file], sourcesContent: [readFileSync(file, 'utf8')],
      names: [], mappings: 'AAAA',
    }));
  }
  writeFileSync(lazy, "import { add } from './helper.mjs'; globalThis.__neuralOptionalLoads++; export const value = add(2, 3);");
  globalThis.__neuralOptionalLoads = 0;
  try {
    await consolidateUiCoreTable(root);
    for (const name of readdirSync(directory).filter((name) => name.endsWith('.mjs.map'))) {
      const compiled = readFileSync(join(directory, name.slice(0, -4)), 'utf8');
      assert.ok(compiled.includes(`sourceMappingURL=${name}`), `No orphan map: ${name}`);
    }
    assert.equal(readFileSync(lazy, 'utf8').includes('globalThis.__neuralOptionalLoads++'), true);
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    assert.equal(manifest.exports['./table'].types, './types/table.d.ts');
    const module = await import(pathToFileURL(join(root, manifest.exports['./table'].default)).href);
    assert.deepEqual(Object.keys(module), ['add', 'double', 'optional']);
    assert.equal(module.add(2, 4), 6);
    assert.equal(globalThis.__neuralOptionalLoads, 0);
    const feature = await module.optional();
    assert.equal(feature.value, 5);
    assert.equal(globalThis.__neuralOptionalLoads, 1);
    const facade = await import(pathToFileURL(helper).href);
    assert.equal(facade.add, module.add);
    const runtime = 'neural-ui-core-table.mjs';
    assert.ok(runtime);
    const map = JSON.parse(readFileSync(join(directory, `${runtime}.map`), 'utf8'));
    assert.ok(map.sources.some((name) => name.endsWith('helper.mjs')));
    assert.ok(map.sourcesContent.includes(before));
    const snapshot = readdirSync(directory).sort().map((name) => [name, readFileSync(join(directory, name), 'utf8')]);
    await consolidateUiCoreTable(root);
    assert.deepEqual(readdirSync(directory).sort().map((name) => [name, readFileSync(join(directory, name), 'utf8')]), snapshot);
  } finally {
    delete globalThis.__neuralOptionalLoads;
  }
});
