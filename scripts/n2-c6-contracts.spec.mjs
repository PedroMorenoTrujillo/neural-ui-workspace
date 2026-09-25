import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, 'projects/ui-core/tree/neu-tree.component.ts'), 'utf8');
const types = readFileSync(join(root, 'projects/ui-core/tree/neu-tree.types.ts'), 'utf8');
const engine = readFileSync(join(root, 'projects/ui-core/tree/neu-tree.engine.ts'), 'utf8');
const template = readFileSync(join(root, 'projects/ui-core/tree/neu-tree.component.html'), 'utf8');
const barrel = readFileSync(join(root, 'projects/ui-core/tree/public_api.ts'), 'utf8');

test('C6 has one facade, one directive, exact five semantic outputs and no legacy channels', () => {
  assert.match(source, /selector: 'neu-tree'/);
  assert.match(source, /selector: 'ng-template\[neuTreeNode\]'/);
  const outputs = [...source.matchAll(/readonly (\w+) = output</g)].map((match) => match[1]);
  assert.deepEqual(outputs, ['expandedKeysChange', 'selectionChange', 'childrenRequest', 'nodeAction', 'nodeMove']);
  for (const name of ['expansionChange', 'lazyRequest', 'nodeClick', 'nodeDrop', 'contextRequest', 'virtualRangeChange', 'selectionMode', 'dragScope = input']) {
    assert.ok(!source.includes(name), `legacy member ${name} remains`);
  }
  assert.match(barrel, /export \* from '\.\/neu-tree\.types';/);
});

test('C6 public state is readonly, exact-K and data-only', () => {
  assert.match(types, /K extends NeuTreeKey/);
  assert.match(types, /readonly key: K/);
  assert.match(types, /readonly data: T/);
  assert.match(types, /readonly revision: number/);
  assert.match(types, /readonly roots: readonly K\[\]/);
  assert.match(types, /readonly requestId: number/);
  assert.match(types, /readonly hierarchyRevision: number/);
  assert.doesNotMatch(types, /\bany\b|\b(?:MouseEvent|KeyboardEvent|HTMLElement|CdkDragDrop)\b/);
  const nodeSection = types.split('export interface NeuTreeNode<')[1].split('\n}')[0];
  assert.doesNotMatch(nodeSection, /children|expanded|selected|loading|leaf|parent|level|path/);
});

test('C6 has no facade dependency, domain mirror or per-node effects', () => {
  assert.doesNotMatch(source, /@neural-ui\/core\/(?:table|tree-table|table-core|tree-select|virtual-list|menu|router|http)/);
  assert.doesNotMatch(engine, /@angular\/|document\.|window\.|effect\(/);
  assert.doesNotMatch(source, /= model\(|internalExpandedKeys|internalSelectedKeys|localNodes|localHierarchy/);
  assert.equal((source.match(/\beffect\(/g) ?? []).length, 2);
  assert.equal((source.match(/\bafterRenderEffect\(/g) ?? []).length, 1);
  assert.match(template, /role="tree"/);
  assert.match(template, /role="treeitem"/);
  assert.doesNotMatch(template, /\[attr\.aria-level\]=".*node\.__/);
});
