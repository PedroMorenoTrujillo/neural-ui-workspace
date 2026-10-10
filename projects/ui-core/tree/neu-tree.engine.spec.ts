import {
  buildTreeModel,
  deriveTreeCheckboxStates,
  normalizeTreeSearch,
  projectVisibleTree,
  proposeTreeExpansion,
  proposeTreeMove,
  proposeTreeSelection,
  treeToken,
} from './neu-tree.engine';
import type { NeuTreeHierarchy, NeuTreeNode } from './neu-tree.types';

interface Item { readonly name: string }
const nodes: readonly NeuTreeNode<Item, string>[] = [
  { key: 'root', data: { name: 'root' }, label: 'Root' },
  { key: 'a', data: { name: 'a' }, label: 'Alpha' },
  { key: 'b', data: { name: 'b' }, label: 'Beta' },
  { key: 'leaf', data: { name: 'leaf' }, label: 'Needle', description: 'Deep result' },
];
const hierarchy: NeuTreeHierarchy<string> = {
  revision: 1,
  roots: ['root'],
  children: [
    { parentKey: 'root', state: 'loaded', keys: ['a', 'b'] },
    { parentKey: 'a', state: 'loaded', keys: ['leaf'] },
  ],
};

describe('NeuTree pure hierarchy engine', () => {
  it('preserves applied depth-first sibling order and metadata', () => {
    const model = buildTreeModel(nodes, hierarchy);
    expect(model.issue).toBeNull();
    expect(model.entries.map((entry) => [entry.key, entry.level, entry.index, entry.setSize])).toEqual([
      ['root', 1, 0, 1], ['a', 2, 0, 2], ['leaf', 3, 0, 1], ['b', 2, 1, 2],
    ]);
  });

  it('flattens only applied expanded loaded nodes', () => {
    const model = buildTreeModel(nodes, hierarchy);
    expect(projectVisibleTree(model, [], '').map((entry) => entry.key)).toEqual(['root']);
    expect(projectVisibleTree(model, ['root'], '').map((entry) => entry.key)).toEqual(['root', 'a', 'b']);
    expect(projectVisibleTree(model, ['root', 'a'], '').map((entry) => entry.key)).toEqual(['root', 'a', 'leaf', 'b']);
  });

  it('searches normalized loaded fields and reveals ancestor paths without changing applied expansion', () => {
    const model = buildTreeModel(nodes, hierarchy);
    const before = Object.freeze([] as string[]);
    expect(normalizeTreeSearch('  ＮＥＥＤＬＥ   result  ')).toBe('needle result');
    expect(projectVisibleTree(model, before, ' deep   result ').map((entry) => entry.key)).toEqual(['root', 'a', 'leaf']);
    expect(before).toEqual([]);
    expect(projectVisibleTree(model, before, '').map((entry) => entry.key)).toEqual(['root']);
  });

  it('detects duplicate semantic K, including distinct negative zero', () => {
    const data: readonly NeuTreeNode<Item, number>[] = [
      { key: 0, data: { name: 'zero' }, label: 'Zero' },
      { key: -0, data: { name: 'negative' }, label: 'Negative zero' },
    ];
    expect(treeToken(0)).not.toBe(treeToken(-0));
    expect(buildTreeModel(data, { revision: 1, roots: [0, -0], children: [] }).issue).toBeNull();
    expect(buildTreeModel([nodes[0]!, { ...nodes[0]! }], hierarchy).issue?.code).toBe('duplicate-key');
  });

  it.each([
    ['duplicate-root', { ...hierarchy, roots: ['root', 'root'] }],
    ['duplicate-relation', { ...hierarchy, children: [...hierarchy.children, hierarchy.children[0]!] }],
    ['duplicate-child', { ...hierarchy, children: [{ parentKey: 'root', state: 'loaded' as const, keys: ['a', 'a'] }] }],
    ['missing-node', { ...hierarchy, roots: ['missing'] }],
    ['missing-parent', { ...hierarchy, children: [{ parentKey: 'missing', state: 'loaded' as const, keys: [] }] }],
    ['duplicate-parentage', { ...hierarchy, roots: ['root', 'a'] }],
    ['orphan', { ...hierarchy, children: [] }],
  ] as const)('fails closed on %s', (code, candidate) => {
    expect(buildTreeModel(nodes, candidate).issue?.code).toBe(code);
  });

  it('detects a cycle before parentage and never recurses', () => {
    const model = buildTreeModel(nodes.slice(0, 3), {
      revision: 1, roots: ['root'], children: [
        { parentKey: 'root', state: 'loaded', keys: ['a'] },
        { parentKey: 'a', state: 'loaded', keys: ['b'] },
        { parentKey: 'b', state: 'loaded', keys: ['root'] },
      ],
    });
    expect(model.issue?.code).toBe('cycle');
    expect(projectVisibleTree(model, ['root'], '')).toEqual([]);
  });

  it('handles a 1,001-depth chain and 10k wide siblings iteratively', () => {
    const deepNodes = Array.from({ length: 1001 }, (_, index) => ({ key: index, data: index, label: `${index}` }));
    const deepRelations = Array.from({ length: 1000 }, (_, index) => ({ parentKey: index, state: 'loaded' as const, keys: [index + 1] }));
    const deep = buildTreeModel(deepNodes, { revision: 1, roots: [0], children: deepRelations });
    expect(deep.issue).toBeNull();
    expect(projectVisibleTree(deep, deepNodes.map((node) => node.key), '').length).toBe(1001);
    const wideNodes = Array.from({ length: 10000 }, (_, index) => ({ key: index, data: index, label: `${index}` }));
    const wide = buildTreeModel(wideNodes, { revision: 1, roots: wideNodes.map((node) => node.key), children: [] });
    expect(wide.issue).toBeNull();
    expect(projectVisibleTree(wide, [], '').length).toBe(10000);
  });

  it('preserves frozen input and reconstructed identity', () => {
    const frozenNodes = Object.freeze(nodes.map((node) => Object.freeze({ ...node, data: Object.freeze({ ...node.data }) })));
    const frozenHierarchy = Object.freeze({ ...hierarchy, roots: Object.freeze([...hierarchy.roots]), children: Object.freeze([...hierarchy.children]) });
    const first = buildTreeModel(frozenNodes, frozenHierarchy);
    const second = buildTreeModel(frozenNodes.map((node) => ({ ...node })), frozenHierarchy);
    expect(first.entries.map((entry) => entry.key)).toEqual(second.entries.map((entry) => entry.key));
    expect(frozenNodes[0]!.label).toBe('Root');
  });

  it('proposes immutable expansion and single/multiple selection', () => {
    const model = buildTreeModel(nodes, hierarchy);
    expect(proposeTreeExpansion(Object.freeze(['root']), 'a', 'pointer')).toEqual({ keys: ['root', 'a'], key: 'a', expanded: true, source: 'pointer' });
    expect(proposeTreeSelection(model, { mode: 'single', key: 'a' }, 'a', 'keyboard')?.selection).toEqual({ mode: 'single', key: null });
    expect(proposeTreeSelection(model, { mode: 'multiple', keys: ['a'] }, 'b', 'pointer')?.selection).toEqual({ mode: 'multiple', keys: ['a', 'b'] });
  });

  it('propagates checkbox only through loaded enabled descendants, without future keys', () => {
    const data = nodes.map((node) => node.key === 'b' ? { ...node, disabled: true } : node);
    const model = buildTreeModel(data, { ...hierarchy, children: [...hierarchy.children, { parentKey: 'b', state: 'unloaded' }] });
    expect(proposeTreeSelection(model, { mode: 'checkbox', keys: [] }, 'root', 'pointer')?.selection).toEqual({ mode: 'checkbox', keys: ['root', 'a', 'leaf'] });
    expect(proposeTreeSelection(model, { mode: 'checkbox', keys: ['b'] }, 'b', 'pointer')).toBeNull();
    expect(deriveTreeCheckboxStates(model, { mode: 'checkbox', keys: ['root', 'a', 'leaf'] }).get(treeToken('root'))).toBe('checked');
  });

  it('computes mixed when selected known portions have unloaded descendants', () => {
    const model = buildTreeModel(nodes, { ...hierarchy, children: [...hierarchy.children, { parentKey: 'leaf', state: 'unloaded' }] });
    expect(deriveTreeCheckboxStates(model, { mode: 'checkbox', keys: ['root', 'a', 'b', 'leaf'] }).get(treeToken('root'))).toBe('mixed');
    expect(deriveTreeCheckboxStates(model, { mode: 'checkbox', keys: [] }).get(treeToken('root'))).toBe('unchecked');
  });

  it('calculates final-after-removal move indices and rejects no-op/cycle', () => {
    const model = buildTreeModel(nodes, hierarchy);
    expect(proposeTreeMove(model, 'a', 'b', 'after')).toEqual({ sourceKey: 'a', sourceParentKey: 'root', sourceIndex: 0,
      targetKey: 'b', targetParentKey: 'root', targetIndex: 1, position: 'after' });
    expect(proposeTreeMove(model, 'a', 'b', 'before')).toBeNull();
    expect(proposeTreeMove(model, 'root', 'leaf', 'inside')).toBeNull();
    expect(proposeTreeMove(model, 'b', 'a', 'inside')?.targetIndex).toBe(1);
  });
});
