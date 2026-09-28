import { normalizeNeuTreeTableHierarchy, projectNeuTreeTableHierarchy, projectNormalizedNeuTreeTableHierarchy } from './internal/hierarchy/neu-tree-table-hierarchy';
import type { NeuTreeLoadedRelation, NeuTreeTableHierarchy } from './public/neu-tree-table.types';

interface Row {
  readonly id: string | number;
  readonly name: string;
}

const keyOf = (row: Row): string | number => row.id;
const loaded = <K extends string | number>(
  keys: readonly K[],
  total: number | null = keys.length,
  completeness: 'partial' | 'complete' = 'complete',
): NeuTreeLoadedRelation<K> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total,
  completeness,
});

const hierarchy = <K extends string | number>(
  roots: readonly K[],
  children: NeuTreeTableHierarchy<K>['children'] = [],
): NeuTreeTableHierarchy<K> => ({
  hierarchyRevision: 1,
  queryRevision: 0,
  roots: loaded(roots),
  children,
});

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

describe('NeuTreeTable 2 pure hierarchy engine', () => {
  it('projects empty, single and multiple roots with exact identity and known sibling metadata', () => {
    expect(
      projectNeuTreeTableHierarchy<Row, string | number>([], keyOf, hierarchy([]), []).visible,
    ).toEqual([]);

    const rows: readonly Row[] = [
      { id: 1, name: 'numeric' },
      { id: '1', name: 'string' },
    ];
    const projected = projectNeuTreeTableHierarchy(rows, keyOf, hierarchy([1, '1']), []);
    expect(projected.visible.map((node) => node.token)).toEqual(['number:1', 'string:1']);
    expect(projected.visible.map((node) => node.siblingIndex)).toEqual([0, 1]);
    expect(projected.visible.map((node) => node.siblingCount)).toEqual([2, 2]);
    expect(projected.diagnostics).toEqual([]);
  });

  it('flattens applied expansion depth-first with paths, levels and unknown sibling size', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
      { id: 'd', name: 'D' },
    ];
    const state: NeuTreeTableHierarchy<string> = {
      hierarchyRevision: 7,
      queryRevision: 0,
      roots: loaded(['a', 'd']),
      children: [
        { parentKey: 'a', relation: loaded(['b'], null, 'partial') },
        { parentKey: 'b', relation: loaded(['c']) },
        { parentKey: 'c', relation: loaded([]) },
        { parentKey: 'd', relation: loaded([]) },
      ],
    };

    expect(
      projectNeuTreeTableHierarchy(rows, keyOf, state, []).visible.map((node) => node.key),
    ).toEqual(['a', 'd']);
    expect(
      projectNeuTreeTableHierarchy(rows, keyOf, state, ['a']).visible.map((node) => node.key),
    ).toEqual(['a', 'b', 'd']);
    const nested = projectNeuTreeTableHierarchy(rows, keyOf, state, ['a', 'b']);
    expect(nested.visible.map((node) => node.key)).toEqual(['a', 'b', 'c', 'd']);
    expect(nested.visible[2]?.depth).toBe(2);
    expect(nested.visible[2]?.path).toEqual(['a', 'b', 'c']);
    expect(nested.visible[1]?.siblingCount).toBeNull();
    expect(nested.visible[2]?.siblingCount).toBe(1);
    expect(nested.projectionRevision).toBe(7);
  });

  it('bounds duplicate keys, roots, children, parentage, missing references, orphans and cycles', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'A' },
      { id: 'a', name: 'A duplicate' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
      { id: 'orphan', name: 'Orphan' },
    ];
    const state: NeuTreeTableHierarchy<string> = {
      hierarchyRevision: 1,
      queryRevision: 0,
      roots: loaded(['a', 'a', 'missing-root']),
      children: [
        { parentKey: 'a', relation: loaded(['b', 'b', 'missing-child']) },
        { parentKey: 'b', relation: loaded(['c']) },
        { parentKey: 'c', relation: loaded(['a']) },
        { parentKey: 'missing-parent', relation: loaded(['orphan']) },
      ],
    };
    const projected = projectNeuTreeTableHierarchy(rows, keyOf, state, ['a', 'b', 'c']);
    const codes = new Set(projected.diagnostics.map((diagnostic) => diagnostic.code));
    expect(codes).toEqual(
      new Set([
        'duplicate-key',
        'duplicate-child',
        'missing-root',
        'missing-node',
        'duplicate-parent',
        'cycle',
        'orphan',
      ]),
    );
    expect(projected.visible.map((node) => node.key)).toEqual(['a', 'b', 'c']);
    expect(new Set(projected.diagnostics.map((diagnostic) => diagnostic.fingerprint)).size).toBe(
      projected.diagnostics.length,
    );
  });

  it('handles a depth-1000 chain iteratively and a 10k wide root set deterministically', () => {
    const depth = 1001;
    const deepRows = Array.from({ length: depth }, (_, id) => ({ id, name: `N${id}` }));
    const deepChildren = Array.from({ length: depth }, (_, id) => ({
      parentKey: id,
      relation: loaded(id + 1 < depth ? [id + 1] : []),
    }));
    const expanded = Array.from({ length: depth - 1 }, (_, id) => id);
    const deep = projectNeuTreeTableHierarchy(
      deepRows,
      keyOf,
      hierarchy([0], deepChildren),
      expanded,
    );
    expect(deep.visible).toHaveLength(depth);
    expect(deep.visible.at(-1)?.depth).toBe(1000);
    expect(deep.visible.at(-1)?.path).toHaveLength(1001);

    const wideRows = Array.from({ length: 10_000 }, (_, id) => ({ id, name: `N${id}` }));
    const wideState = hierarchy(wideRows.map((row) => row.id));
    const first = projectNeuTreeTableHierarchy(wideRows, keyOf, wideState, []);
    const second = projectNeuTreeTableHierarchy(
      wideRows.map((row) => ({ ...row })),
      keyOf,
      { ...wideState, roots: { ...wideState.roots, keys: [...wideState.roots.keys] } },
      [],
    );
    expect(first.visible).toHaveLength(10_000);
    expect(second.visible.map((node) => node.token)).toEqual(
      first.visible.map((node) => node.token),
    );
  });

  it('does not mutate deeply frozen data, hierarchy, expanded keys or relations', () => {
    const rows = deepFreeze<readonly Row[]>([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    const state = deepFreeze<NeuTreeTableHierarchy<string>>(
      hierarchy(
        ['a'],
        [
          { parentKey: 'a', relation: loaded(['b']) },
          { parentKey: 'b', relation: loaded([]) },
        ],
      ),
    );
    const expanded = deepFreeze<readonly string[]>(['a']);
    const before = JSON.stringify({ rows, state, expanded });
    const projected = projectNeuTreeTableHierarchy(rows, keyOf, state, expanded);
    expect(projected.visible.map((node) => node.key)).toEqual(['a', 'b']);
    expect(JSON.stringify({ rows, state, expanded })).toBe(before);
  });

  it('derives exact sibling counts from a complete relation with unknown total', () => {
    const rows: readonly Row[] = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    const state = hierarchy(['a', 'b']);
    const complete = { ...state, roots: loaded(['a', 'b'], null, 'complete') };
    const partial = { ...state, roots: loaded(['a', 'b'], null, 'partial') };
    expect(projectNeuTreeTableHierarchy(rows, keyOf, complete, []).visible.map((node) => node.siblingCount)).toEqual([2, 2]);
    expect(projectNeuTreeTableHierarchy(rows, keyOf, partial, []).visible.map((node) => node.siblingCount)).toEqual([null, null]);
  });

  it('reports duplicate relation ownership only once for the same parent', () => {
    const rows: readonly Row[] = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    const state = hierarchy(['a'], [
      { parentKey: 'a', relation: loaded(['b']) },
      { parentKey: 'a', relation: loaded([]) },
    ]);
    const projection = projectNeuTreeTableHierarchy(rows, keyOf, state, ['a']);
    expect(projection.visible.map((node) => node.key)).toEqual(['a', 'b']);
    expect(projection.diagnostics.filter((entry) => entry.code === 'duplicate-child')).toHaveLength(1);
  });

  it('keeps orphan diagnostics tied to a known but unreachable parent', () => {
    const rows: readonly Row[] = [
      { id: 'root', name: 'Root' }, { id: 'orphan-parent', name: 'Parent' }, { id: 'child', name: 'Child' },
    ];
    const state = hierarchy(['root'], [{ parentKey: 'orphan-parent', relation: loaded(['child']) }]);
    const projection = projectNeuTreeTableHierarchy(rows, keyOf, state, []);
    expect(projection.visible.map((node) => node.key)).toEqual(['root']);
    expect(projection.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'orphan', key: 'child', parentKey: 'orphan-parent' }),
    ]));
  });

  it('uses filtered root count only for complete loaded roots', () => {
    const rows: readonly Row[] = [{ id: 'a', name: 'A' }];
    const filtered = {
      roots: ['string:a'], children: new Map<string, readonly string[]>(),
      retained: new Set(['string:a']), transientReveal: new Set<string>(), filtering: true,
    };
    const complete = normalizeNeuTreeTableHierarchy(rows, keyOf, hierarchy(['a']));
    expect(projectNormalizedNeuTreeTableHierarchy(complete, [], filtered).visible[0]?.siblingCount).toBe(1);
    const partialState = { ...hierarchy(['a']), roots: loaded(['a'], null, 'partial') };
    const partial = normalizeNeuTreeTableHierarchy(rows, keyOf, partialState);
    expect(projectNormalizedNeuTreeTableHierarchy(partial, [], filtered).visible[0]?.siblingCount).toBeNull();
  });

  it('skips stale query projection roots without fabricating missing rows', () => {
    const rows: readonly Row[] = [{ id: 'a', name: 'A' }];
    const normalized = normalizeNeuTreeTableHierarchy(rows, keyOf, hierarchy(['a']));
    const stale = {
      roots: ['string:missing', 'string:a'], children: new Map<string, readonly string[]>(),
      retained: new Set(['string:a']), transientReveal: new Set<string>(), filtering: true,
    };
    expect(projectNormalizedNeuTreeTableHierarchy(normalized, [], stale).visible.map((node) => node.key)).toEqual(['a']);
  });
});
