import { computed, signal } from '@angular/core';
import {
  projectNeuTableLayout,
  proposeNeuTableReorder,
  proposeNeuTableResize,
  proposeNeuTableVisibility,
} from './internal/layout/neu-table-layout';
import {
  createNeuTableSelectionScope,
  projectNeuTableSelection,
  proposeNeuTableRowSelection,
  selectionRowsFromData,
} from './internal/selection/neu-table-selection';
import type {
  NeuTableColumn,
  NeuTableFilterOptions,
  NeuTableLayoutState,
  NeuTableQuery,
  NeuTableRowOptions,
  NeuTableSelection,
  NeuTableSelectionOptions,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly amount: number;
}

type Field = 'id' | 'name' | 'amount';

function summarize(operation: () => unknown) {
  for (let index = 0; index < 3; index += 1) operation();
  const samples = Array.from({ length: 15 }, () => {
    const started = performance.now();
    operation();
    return performance.now() - started;
  }).sort((left, right) => left - right);
  const percentile = (ratio: number) =>
    Number(samples[Math.max(0, Math.ceil(samples.length * ratio) - 1)]!.toFixed(3));
  return { samples: samples.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95) };
}

describe('NeuTable 2 N2-011D layout and selection performance', () => {
  it('captures selection/layout projections and recomputation boundaries', () => {
    const rows = Array.from({ length: 10_000 }, (_, id): Row => ({
      id,
      name: `Row ${id}`,
      amount: id * 7,
    }));
    const selectionRows = selectionRowsFromData(rows, (row) => row.id);
    const columns: readonly NeuTableColumn<Row, Field>[] = [
      { id: 'id', header: 'ID', field: 'id' },
      { id: 'name', header: 'Name', field: 'name' },
      { id: 'amount', header: 'Amount', field: 'amount' },
    ];
    const filterOptions: NeuTableFilterOptions<Row, Field> = {
      surfaces: [],
      globalFields: ['name'],
      predicates: {},
      debounceMs: 0,
      commit: 'immediate',
    };
    const query: NeuTableQuery<Field> = {
      page: 0,
      pageSize: 25,
      search: '',
      sort: [],
      filters: null,
    };
    const currentScope = createNeuTableSelectionScope(query, filterOptions);
    const rowOptions: NeuTableRowOptions<Row, number> = { reorderable: false };
    const selectionOptions: Extract<NeuTableSelectionOptions<Row>, { mode: 'multiple' }> = {
      mode: 'multiple',
      indicator: 'checkbox',
      selectOnRowClick: true,
      modifier: 'toggle',
      range: true,
      toggleAllScope: 'loaded',
    };
    const keys: NeuTableSelection<number, Field> = {
      kind: 'keys',
      keys: Array.from({ length: 5_000 }, (_, index) => index * 2),
    };
    const exclusions = Array.from({ length: 1_000 }, (_, index) => index * 3);
    const allMatching: NeuTableSelection<number, Field> = {
      kind: 'all-matching',
      scope: currentScope,
      excludedKeys: exclusions,
    };
    const project = (selection: NeuTableSelection<number, Field>, projectedRows = selectionRows) =>
      projectNeuTableSelection({
        selection,
        selectionOptions,
        rowOptions,
        rows: projectedRows,
        headerRows: projectedRows,
        columns,
        filterOptions,
        currentScope,
      });

    const selectionSignal = signal(keys);
    const layoutSignal = signal<NeuTableLayoutState>({
      order: [],
      hidden: [],
      widths: {},
      pinnedStart: [],
      pinnedEnd: [],
    });
    let pipelineComputations = 0;
    let selectionComputations = 0;
    let layoutComputations = 0;
    const pipeline = computed(() => {
      pipelineComputations += 1;
      return selectionRows.slice(0, query.pageSize);
    });
    const selectionProjection = computed(() => {
      selectionComputations += 1;
      return project(selectionSignal(), pipeline());
    });
    const layoutProjection = computed(() => {
      layoutComputations += 1;
      return projectNeuTableLayout(columns, layoutSignal());
    });
    const firstSelection = selectionProjection();
    const firstLayout = layoutProjection();
    const repeatedStarted = performance.now();
    expect(selectionProjection()).toBe(firstSelection);
    expect(layoutProjection()).toBe(firstLayout);
    const repeatedUnchangedReadMs = performance.now() - repeatedStarted;
    selectionSignal.set({ kind: 'keys', keys: [...keys.keys, 9_999] });
    selectionProjection();
    expect(pipelineComputations).toBe(1);
    layoutSignal.set({ ...layoutSignal(), hidden: ['amount'] });
    layoutProjection();
    expect(pipelineComputations).toBe(1);

    const hundredColumns: readonly NeuTableColumn<Record<string, number>, string>[] = Array.from(
      { length: 100 },
      (_, index) => ({ id: `c${index}`, header: `Column ${index}`, field: `c${index}` }),
    );
    const hundredLayout: NeuTableLayoutState = {
      order: [],
      hidden: [],
      widths: {},
      pinnedStart: [],
      pinnedEnd: [],
    };

    console.info(
      `N2_TABLE_LAYOUT_SELECTION_PERFORMANCE:${JSON.stringify({
        keysMembership10k: summarize(() => project(keys)),
        rows10kKeys5k: summarize(() => project(keys)),
        toggleOneKey: summarize(() =>
          proposeNeuTableRowSelection({
            selection: keys,
            selectionOptions,
            rowOptions,
            intent: {
              row: rows[9_999]!,
              key: 9_999,
              source: 'checkbox',
              shiftKey: false,
              platformModifier: false,
            },
            rangeRows: selectionRows,
            loadedRows: selectionRows,
            anchor: null,
            columns,
            filterOptions,
          }),
        ),
        headerState10k: summarize(() => project(keys)),
        allMatchingExclusions1k: summarize(() => project(allMatching)),
        offscreenSelectionPageChange: summarize(() =>
          project(keys, selectionRows.slice(5_000, 5_025)),
        ),
        columns100Projection: summarize(() => projectNeuTableLayout(hundredColumns, hundredLayout)),
        visibilityProjection100: summarize(() =>
          projectNeuTableLayout(hundredColumns, { ...hundredLayout, hidden: ['c2', 'c40', 'c99'] }),
        ),
        reorderProposal100: summarize(() =>
          proposeNeuTableReorder(hundredColumns, hundredLayout, 'c99', 'c0'),
        ),
        resizeProposal100: summarize(() =>
          proposeNeuTableResize(hundredLayout, hundredColumns[50]!, 240),
        ),
        repeatedUnchangedReadMs: Number(repeatedUnchangedReadMs.toFixed(3)),
        pipelineComputations,
        selectionComputations,
        layoutComputations,
      })}`,
    );
  }, 180_000);
});
