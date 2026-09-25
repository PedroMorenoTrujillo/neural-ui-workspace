import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, 'projects/ui-core/virtual-list/neu-virtual-list.component.ts'), 'utf8');
const engine = readFileSync(join(root, 'projects/ui-core/virtual-list/neu-virtual-list.engine.ts'), 'utf8');
const types = readFileSync(join(root, 'projects/ui-core/virtual-list/neu-virtual-list.types.ts'), 'utf8');
const barrel = readFileSync(join(root, 'projects/ui-core/virtual-list/public_api.ts'), 'utf8');

test('C7 has one list facade, one typed template directive and minimal public commands', () => {
  assert.match(source, /selector: 'neu-virtual-list'/);
  assert.match(source, /selector: 'ng-template\[neuVirtualItem\]'/);
  assert.match(source, /readonly neuVirtualItemKey = input</);
  const component = source.split('export class NeuVirtualListComponent')[1];
  assert.deepEqual([...component.matchAll(/readonly (\w+) = input/g)].map(x=>x[1]),
    ['items', 'itemSize', 'visibleRows', 'itemKey', 'emptyLabel']);
});

test('C7 has only data-oriented range output and no legacy CDK or facade dependency', () => {
  assert.deepEqual([...source.matchAll(/readonly (\w+) = output</g)].map(x=>x[1]), ['rangeChange']);
  assert.doesNotMatch(source, /CdkVirtual|ScrollingModule|@neural-ui\/core\/(?:table|tree-table|tree|tree-select|listbox|scroller)|itemClick|trackBy = input/);
  assert.doesNotMatch(engine, /@angular\/|document\.|window\.|effect\(/);
  assert.match(source, /scrollTo\(target: NeuVirtualListScrollTarget<K>\): boolean/);
  assert.match(source, /role="list"/);
  assert.match(source, /role="listitem"/);
  assert.match(barrel, /NeuVirtualItemDirective/);
  assert.doesNotMatch(types, /\bany\b|\bEvent\b|ElementRef/);
});

test('C7 owns no domain mirror or per-item observer', () => {
  assert.doesNotMatch(source, /localItems|itemsMirror|ResizeObserver\([^)]*item|effect\(/);
  assert.equal((source.match(/afterRenderEffect\(/g) ?? []).length, 1);
  assert.equal((source.match(/new ResizeObserver\(/g) ?? []).length, 1);
  assert.equal((source.match(/addEventListener\('scroll'/g) ?? []).length, 1);
});
