import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const source = readFileSync(
  join(root, 'projects/ui-core/tree-select/neu-tree-select.component.ts'),
  'utf8',
);
const types = readFileSync(
  join(root, 'projects/ui-core/tree-select/neu-tree-select.types.ts'),
  'utf8',
);
const publicApi = readFileSync(
  join(root, 'projects/ui-core/tree-select/public_api.ts'),
  'utf8',
);

test('N2-019 exposes the frozen signals-first TreeSelect contracts', () => {
  for (const contract of [
    /implements FormValueControl<NeuSelectionValue<V, M>>/,
    /readonly value = model<NeuSelectionValue<V, M>>/,
    /readonly mode = input<M>/,
    /readonly selectionStrategy = input<NeuTreeSelectSelectionStrategy>/,
    /readonly expandedKeys = input<readonly V\[\]>/,
    /readonly virtualizationOptions = input<Readonly<NeuTreeSelectVirtualizationOptions>>/,
    /readonly expandedKeysChange = output<readonly V\[\]>/,
    /readonly childrenRequest = output<NeuTreeSelectChildrenRequest<V>>/,
    /readonly rangeChange = output<NeuViewportRange>/,
    /readonly touch = output<void>/,
  ]) {
    assert.match(source, contract);
  }
});

test('N2-019 removes the legacy CVA and ambiguous event surface', () => {
  for (const forbidden of [
    /ControlValueAccessor/,
    /NG_VALUE_ACCESSOR/,
    /\bwriteValue\s*\(/,
    /\bregisterOnChange\s*\(/,
    /\bregisterOnTouched\s*\(/,
    /\bsetDisabledState\s*\(/,
    /readonly multiple = input/,
    /readonly selectionChange = output/,
    /readonly nodeExpand = output/,
    /readonly nodeExpansionChange = output/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('N2-019 keeps selection, virtualization and children requests closed and typed', () => {
  assert.match(types, /'independent' \| 'propagated'/);
  assert.match(types, /readonly enabled\?: boolean/);
  assert.match(types, /readonly itemSize\?: number/);
  assert.match(types, /readonly viewportHeight\?: number/);
  assert.match(types, /readonly requestId: number/);
  assert.match(types, /readonly queryRevision: number/);
  assert.match(types, /readonly parentKey: K/);
  assert.match(publicApi, /export \* from '\.\/neu-tree-select\.types'/);
});

test('N2-019 does not couple TreeSelect to Table or TreeTable facades', () => {
  assert.doesNotMatch(source, /@neural-ui\/core\/(?:table|tree-table)/);
  assert.doesNotMatch(source, /Neu(?:Tree)?TableComponent/);
  assert.doesNotMatch(source, /\beffect\s*\(/);
});
