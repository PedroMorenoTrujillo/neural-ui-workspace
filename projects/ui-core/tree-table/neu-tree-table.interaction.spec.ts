import {
  moveNeuTreeTableFocus,
  proposeNeuTreeTableExpansion,
  reconcileNeuTreeTableFocus,
  snapshotNeuTreeTableFocus,
} from './internal/interaction/neu-tree-table-interaction';
import { projectNeuTreeTableHierarchy } from './internal/hierarchy/neu-tree-table-hierarchy';
import type { NeuTreeLoadedRelation, NeuTreeTableHierarchy } from './public/neu-tree-table.types';

interface Row {
  readonly id: string | number;
}

const loaded = <K extends string | number>(keys: readonly K[]): NeuTreeLoadedRelation<K> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: keys.length,
  completeness: 'complete',
});

function project(
  rows: readonly Row[],
  roots: readonly (string | number)[],
  children: NeuTreeTableHierarchy<string | number>['children'] = [],
  expanded: readonly (string | number)[] = [],
) {
  return projectNeuTreeTableHierarchy(
    rows,
    (row) => row.id,
    { hierarchyRevision: 1, queryRevision: 0, roots: loaded(roots), children },
    expanded,
  );
}

describe('NeuTreeTable 2 pure expansion and focus engine', () => {
  it('creates immutable controlled expansion proposals with exact K identity', () => {
    const applied = Object.freeze<readonly (string | number)[]>([1, '1']);
    expect(proposeNeuTreeTableExpansion(applied, 1, true, 'keyboard')).toEqual({
      next: ['1'],
      source: 'keyboard',
      changedKey: 1,
    });
    expect(proposeNeuTreeTableExpansion(applied, 2, false, 'toggle')).toEqual({
      next: [1, '1', 2],
      source: 'toggle',
      changedKey: 2,
    });
    expect(applied).toEqual([1, '1']);
  });

  it('does not duplicate an already expanded exact key', () => {
    const applied = Object.freeze<readonly (string | number)[]>([1, '1']);
    const proposal = proposeNeuTreeTableExpansion(applied, '1', false, 'toggle');
    expect(proposal.next).toEqual([1, '1']);
    expect(proposal.next).not.toBe(applied);
  });

  it('returns bounded focus targets for an empty tree and a root without children', () => {
    const single = project([{ id: 'root' }], ['root']);
    const root = single.visible[0]!;
    expect(moveNeuTreeTableFocus(single, root, 'previous')).toBeNull();
    expect(moveNeuTreeTableFocus(single, root, 'parent')).toBeNull();
    expect(moveNeuTreeTableFocus(single, root, 'first-child')).toBeNull();
    const empty = project([], []);
    expect(moveNeuTreeTableFocus(empty, root, 'first')).toBeNull();
    expect(moveNeuTreeTableFocus(empty, root, 'last')).toBeNull();
  });

  it('moves over the flattened projection without changing hierarchy state', () => {
    const projection = project(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      ['a', 'd'],
      [
        { parentKey: 'a', relation: loaded(['b']) },
        { parentKey: 'b', relation: loaded(['c']) },
        { parentKey: 'c', relation: loaded([]) },
        { parentKey: 'd', relation: loaded([]) },
      ],
      ['a', 'b'],
    );
    const [a, b, c, d] = projection.visible;
    expect(moveNeuTreeTableFocus(projection, a!, 'next')?.key).toBe('b');
    expect(moveNeuTreeTableFocus(projection, b!, 'previous')?.key).toBe('a');
    expect(moveNeuTreeTableFocus(projection, c!, 'parent')?.key).toBe('b');
    expect(moveNeuTreeTableFocus(projection, a!, 'first-child')?.key).toBe('b');
    expect(moveNeuTreeTableFocus(projection, d!, 'first')?.key).toBe('a');
    expect(moveNeuTreeTableFocus(projection, a!, 'last')?.key).toBe('d');
    expect(moveNeuTreeTableFocus(projection, d!, 'next')).toBeNull();
  });

  it('reconciles removed focus by retained K, ancestor, same index, previous, then container', () => {
    const nested = project(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      ['a', 'c'],
      [
        { parentKey: 'a', relation: loaded(['b']) },
        { parentKey: 'b', relation: loaded([]) },
        { parentKey: 'c', relation: loaded([]) },
      ],
      ['a'],
    );
    const b = nested.visible[1]!;
    expect(reconcileNeuTreeTableFocus(nested, snapshotNeuTreeTableFocus(b))).toMatchObject({
      kind: 'row',
      node: { key: 'b' },
    });
    const collapsed = project(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      ['a', 'c'],
      [
        { parentKey: 'a', relation: loaded(['b']) },
        { parentKey: 'b', relation: loaded([]) },
        { parentKey: 'c', relation: loaded([]) },
      ],
    );
    expect(reconcileNeuTreeTableFocus(collapsed, snapshotNeuTreeTableFocus(b))).toMatchObject({
      kind: 'row',
      node: { key: 'a' },
    });

    const flat = project([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['a', 'b', 'c']);
    const bSnapshot = snapshotNeuTreeTableFocus(flat.visible[1]!);
    const removedMiddle = project([{ id: 'a' }, { id: 'c' }], ['a', 'c']);
    expect(reconcileNeuTreeTableFocus(removedMiddle, bSnapshot)).toMatchObject({
      kind: 'row',
      node: { key: 'c' },
    });

    const cSnapshot = snapshotNeuTreeTableFocus(flat.visible[2]!);
    const removedLast = project([{ id: 'a' }, { id: 'b' }], ['a', 'b']);
    expect(reconcileNeuTreeTableFocus(removedLast, cSnapshot)).toMatchObject({
      kind: 'row',
      node: { key: 'b' },
    });
    expect(reconcileNeuTreeTableFocus(project([], []), cSnapshot)).toEqual({ kind: 'container' });
  });
});
