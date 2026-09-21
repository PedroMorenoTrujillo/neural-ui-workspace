import { projectNeuTreeTableHierarchy } from './internal/hierarchy/neu-tree-table-hierarchy';
import {
  buildNeuTreeTableSelectionModel,
  proposeNeuTreeTableSelection,
  type TreeSelectionIntent,
} from './internal/selection/neu-tree-table-selection';
import type {
  NeuTreeLoadedRelation,
  NeuTreeTableHierarchy,
  NeuTreeTableSelection,
  NeuTreeTableSelectionOptions,
} from './public/neu-tree-table.types';

interface Row {
  readonly id: string | number;
  readonly name: string;
  readonly disabled?: boolean;
}

const keyOf = (row: Row): string | number => row.id;
const loaded = <K extends string | number>(
  keys: readonly K[],
  completeness: 'partial' | 'complete' = 'complete',
  total: number | null = keys.length,
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
type MultiSelectionOptions<T> = Extract<
  NeuTreeTableSelectionOptions<T>,
  { readonly mode: 'multiple' | 'checkbox' }
>;
const checkboxOptions = <T>(
  overrides: Partial<MultiSelectionOptions<T>> = {},
): MultiSelectionOptions<T> => ({
  mode: 'checkbox',
  indicator: 'checkbox',
  selectOnRowClick: true,
  modifier: 'toggle',
  range: false,
  propagation: 'loaded-subtree',
  toggleAllScope: 'loaded',
  ...overrides,
});

function fixture(
  selection: readonly (string | number)[] = [],
  expanded: readonly (string | number)[] = [],
  options: NeuTreeTableSelectionOptions<Row> = checkboxOptions<Row>(),
) {
  const rows: readonly Row[] = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
    { id: 'd', name: 'D' },
  ];
  const tree = hierarchy<string | number>(
    ['a', 'd'],
    [
      { parentKey: 'a', relation: loaded(['b', 'c']) },
      { parentKey: 'b', relation: loaded([]) },
      { parentKey: 'c', relation: loaded([]) },
      { parentKey: 'd', relation: loaded([]) },
    ],
  );
  const applied: NeuTreeTableSelection<string | number> = { kind: 'keys', keys: selection };
  const projection = projectNeuTreeTableHierarchy(rows, keyOf, tree, expanded);
  return {
    rows,
    tree,
    projection,
    applied,
    options,
    model: buildNeuTreeTableSelectionModel(projection, applied, options),
  };
}

const nodeIntent = (
  key: string | number,
  source: 'row' | 'radio' | 'checkbox' | 'keyboard' = 'checkbox',
  extras: Partial<Extract<TreeSelectionIntent<string | number>, { kind: 'node' }>> = {},
): Extract<TreeSelectionIntent<string | number>, { kind: 'node' }> => ({
  kind: 'node',
  key,
  source,
  anchorKey: null,
  shiftKey: false,
  platformModifier: false,
  ...extras,
});

describe('NeuTreeTable 2 pure selection engine', () => {
  it('uses exact K identity and keeps numeric and string keys distinct', () => {
    const rows: readonly Row[] = [
      { id: 1, name: 'numeric' },
      { id: '1', name: 'string' },
    ];
    const tree = hierarchy<string | number>(
      [1, '1'],
      [
        { parentKey: 1, relation: loaded([]) },
        { parentKey: '1', relation: loaded([]) },
      ],
    );
    const projection = projectNeuTreeTableHierarchy(rows, keyOf, tree, []);
    const options = checkboxOptions<Row>({ propagation: 'none' });
    const applied = { kind: 'keys' as const, keys: [1] as readonly (string | number)[] };
    const model = buildNeuTreeTableSelectionModel(projection, applied, options);
    expect(model.byToken.get('number:1')?.selected).toBe(true);
    expect(model.byToken.get('string:1')?.selected).toBe(false);
  });

  it('blocks none mode and implements controlled single select/clear proposals', () => {
    const none = fixture([], [], { mode: 'none' });
    expect(
      proposeNeuTreeTableSelection({
        model: none.model,
        selection: none.applied,
        selectionOptions: none.options,
        intent: nodeIntent('a', 'row'),
      }),
    ).toBeNull();

    const singleOptions: NeuTreeTableSelectionOptions<Row> = {
      mode: 'single',
      indicator: 'radio',
      selectOnRowClick: true,
      allowClear: true,
    };
    const single = fixture([], [], singleOptions);
    const select = proposeNeuTreeTableSelection({
      model: single.model,
      selection: single.applied,
      selectionOptions: single.options,
      intent: nodeIntent('b', 'radio'),
    });
    expect(select?.next.keys).toEqual(['b']);
    expect(select?.addedKeys).toEqual(['b']);
    expect(select?.source).toBe('radio');

    const selected = fixture(['b'], [], singleOptions);
    expect(
      proposeNeuTreeTableSelection({
        model: selected.model,
        selection: selected.applied,
        selectionOptions: selected.options,
        intent: nodeIntent('b', 'radio'),
      })?.next.keys,
    ).toEqual([]);
  });

  it('propagates only across the loaded subtree, including collapsed descendants', () => {
    const state = fixture([], []);
    const change = proposeNeuTreeTableSelection({
      model: state.model,
      selection: state.applied,
      selectionOptions: state.options,
      intent: nodeIntent('a'),
    });
    expect(change?.next.keys).toEqual(['a', 'b', 'c']);
    expect(change?.loadedValues.map((row) => row.id)).toEqual(['a', 'b', 'c']);
    expect(change?.propagation).toBe('loaded-subtree');
    expect(state.projection.visible.map((node) => node.key)).toEqual(['a', 'd']);
  });

  it('reports partial and unloaded relations as mixed without inventing keys', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
    const tree = hierarchy<string>(
      ['a'],
      [
        { parentKey: 'a', relation: loaded(['b'], 'partial', 10) },
        {
          parentKey: 'b',
          relation: {
            status: 'unloaded',
            keys: [],
            relationRevision: 1,
            appliedRequestId: null,
            total: null,
          },
        },
      ],
    );
    const options = checkboxOptions<Row>();
    const applied = { kind: 'keys' as const, keys: ['a', 'b'] as readonly string[] };
    const projection = projectNeuTreeTableHierarchy(rows, keyOf, tree, ['a']);
    const model = buildNeuTreeTableSelectionModel(projection, applied, options);
    expect(model.byToken.get('string:a')).toMatchObject({
      selected: true,
      checked: false,
      indeterminate: true,
      complete: false,
    });
    expect(model.loadedOrder).toEqual(['string:a', 'string:b']);
  });

  it('treats disabled nodes as propagation and aggregation boundaries', () => {
    const rows: readonly Row[] = [
      { id: 'a', name: 'A' },
      { id: 'blocked', name: 'Blocked', disabled: true },
      { id: 'inside', name: 'Inside' },
      { id: 'free', name: 'Free' },
    ];
    const tree = hierarchy<string>(
      ['a'],
      [
        { parentKey: 'a', relation: loaded(['blocked', 'free']) },
        { parentKey: 'blocked', relation: loaded(['inside']) },
        { parentKey: 'inside', relation: loaded([]) },
        { parentKey: 'free', relation: loaded([]) },
      ],
    );
    const options = checkboxOptions<Row>({ isNodeDisabled: (row) => row.disabled === true });
    const applied = { kind: 'keys' as const, keys: ['blocked'] as readonly string[] };
    const projection = projectNeuTreeTableHierarchy(rows, keyOf, tree, ['a', 'blocked']);
    const model = buildNeuTreeTableSelectionModel(projection, applied, options);
    const parent = proposeNeuTreeTableSelection({
      model,
      selection: applied,
      selectionOptions: options,
      intent: nodeIntent('a'),
    });
    expect(parent?.next.keys).toEqual(['blocked', 'a', 'free']);
    expect(parent?.next.keys).not.toContain('inside');
    expect(
      proposeNeuTreeTableSelection({
        model,
        selection: applied,
        selectionOptions: options,
        intent: nodeIntent('blocked'),
      }),
    ).toBeNull();
    expect(
      proposeNeuTreeTableSelection({
        model,
        selection: applied,
        selectionOptions: options,
        intent: nodeIntent('inside'),
      })?.next.keys,
    ).toEqual(['blocked', 'inside']);
  });

  it('supports replace, platform toggle and visible range proposals without DOM identity', () => {
    const replaceOptions = checkboxOptions<Row>({
      mode: 'multiple',
      indicator: 'none',
      propagation: 'none',
      modifier: 'replace',
      range: true,
    });
    const state = fixture(['d'], ['a'], replaceOptions);
    const replaced = proposeNeuTreeTableSelection({
      model: state.model,
      selection: state.applied,
      selectionOptions: state.options,
      intent: nodeIntent('b', 'row'),
    });
    expect(replaced?.next.keys).toEqual(['b']);

    const platformOptions = { ...replaceOptions, modifier: 'platform' as const };
    const platform = fixture(['d'], ['a'], platformOptions);
    expect(
      proposeNeuTreeTableSelection({
        model: platform.model,
        selection: platform.applied,
        selectionOptions: platform.options,
        intent: nodeIntent('b', 'row', { platformModifier: true }),
      })?.next.keys,
    ).toEqual(['d', 'b']);

    const range = fixture([], ['a'], replaceOptions);
    expect(
      proposeNeuTreeTableSelection({
        model: range.model,
        selection: range.applied,
        selectionOptions: range.options,
        intent: nodeIntent('c', 'row', { anchorKey: 'a', shiftKey: true }),
      })?.next.keys,
    ).toEqual(['a', 'b', 'c']);
  });

  it('toggles visible or loaded scopes exactly and preserves applied unknown keys', () => {
    const visibleOptions = checkboxOptions<Row>({ toggleAllScope: 'visible', propagation: 'none' });
    const visible = fixture(['external'], [], visibleOptions);
    expect(
      proposeNeuTreeTableSelection({
        model: visible.model,
        selection: visible.applied,
        selectionOptions: visible.options,
        intent: { kind: 'toggle-all', source: 'toggle-all' },
      })?.next.keys,
    ).toEqual(['external', 'a', 'd']);

    const loadedState = fixture([], [], checkboxOptions<Row>({ toggleAllScope: 'loaded' }));
    const all = proposeNeuTreeTableSelection({
      model: loadedState.model,
      selection: loadedState.applied,
      selectionOptions: loadedState.options,
      intent: { kind: 'toggle-all', source: 'toggle-all' },
    });
    expect(all?.next.keys).toEqual(['a', 'b', 'c', 'd']);
    const selected = fixture(all?.next.keys ?? [], [], loadedState.options);
    expect(selected.model.header.checked).toBe(true);
    expect(
      proposeNeuTreeTableSelection({
        model: selected.model,
        selection: selected.applied,
        selectionOptions: selected.options,
        intent: { kind: 'toggle-all', source: 'toggle-all' },
      })?.next.keys,
    ).toEqual([]);
  });

  it('is deterministic and does not mutate frozen applied state', () => {
    const options = Object.freeze(checkboxOptions<Row>());
    const state = fixture(Object.freeze(['a']), Object.freeze(['a']), options);
    Object.freeze(state.applied);
    const before = JSON.stringify({ selection: state.applied, options });
    const first = proposeNeuTreeTableSelection({
      model: state.model,
      selection: state.applied,
      selectionOptions: options,
      intent: nodeIntent('a'),
    });
    const second = proposeNeuTreeTableSelection({
      model: state.model,
      selection: state.applied,
      selectionOptions: options,
      intent: nodeIntent('a'),
    });
    expect(first).toEqual(second);
    expect(JSON.stringify({ selection: state.applied, options })).toBe(before);
  });
});
