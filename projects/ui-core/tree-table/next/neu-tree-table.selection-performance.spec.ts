import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { projectNeuTreeTableHierarchy } from './internal/hierarchy/neu-tree-table-hierarchy';
import {
  buildNeuTreeTableSelectionModel,
  proposeNeuTreeTableSelection,
} from './internal/selection/neu-tree-table-selection';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type {
  NeuTreeLoadedRelation,
  NeuTreeTableHierarchy,
  NeuTreeTableSelectionOptions,
} from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
}

const loaded = (keys: readonly number[]): NeuTreeLoadedRelation<number> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: keys.length,
  completeness: 'complete',
});
const hierarchy = (
  roots: readonly number[],
  children: NeuTreeTableHierarchy<number>['children'] = [],
): NeuTreeTableHierarchy<number> => ({
  hierarchyRevision: 1,
  queryRevision: 0,
  roots: loaded(roots),
  children,
});
const selectionOptions: NeuTreeTableSelectionOptions<Row> = {
  mode: 'checkbox',
  indicator: 'checkbox',
  selectOnRowClick: false,
  modifier: 'toggle',
  range: false,
  propagation: 'loaded-subtree',
  toggleAllScope: 'loaded',
};

function samples(run: () => void, count = 31): { p50Ms: number; p95Ms: number } {
  for (let index = 0; index < 7; index += 1) run();
  const values = Array.from({ length: count }, () => {
    const started = performance.now();
    run();
    return performance.now() - started;
  }).sort((left, right) => left - right);
  return {
    p50Ms: Number((values[Math.floor(values.length * 0.5)] ?? 0).toFixed(4)),
    p95Ms: Number((values[Math.floor(values.length * 0.95)] ?? 0).toFixed(4)),
  };
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent],
  template: `
    <neu-tree-table
      [data]="rows"
      [hierarchy]="tree"
      [columns]="columns"
      [rowKey]="rowKey"
      [selectionOptions]="selectionOptions"
      [hierarchyOptions]="{ treeColumnId: 'id', indentSize: 18 }"
    />
  `,
})
class SelectionLifecycleHost {
  readonly rows: readonly Row[] = [{ id: 1 }];
  readonly tree = hierarchy([1], [{ parentKey: 1, relation: loaded([]) }]);
  readonly columns = [{ id: 'id', header: 'Id', value: (row: Row) => row.id }];
  readonly rowKey = (row: Row) => row.id;
  readonly selectionOptions = selectionOptions;
}

describe('NeuTreeTable 2 selection performance', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionLifecycleHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('captures reproducible D selection baselines', () => {
    const wideRows = Array.from({ length: 10_000 }, (_, id) => ({ id }));
    const wideProjection = projectNeuTreeTableHierarchy(
      wideRows,
      (row) => row.id,
      hierarchy(wideRows.map((row) => row.id)),
      [],
    );
    const rows1k = wideRows.slice(0, 1_000);
    const projection1k = projectNeuTreeTableHierarchy(
      rows1k,
      (row) => row.id,
      hierarchy(rows1k.map((row) => row.id)),
      [],
    );
    const half1k = { kind: 'keys' as const, keys: rows1k.slice(0, 500).map((row) => row.id) };
    const half10k = { kind: 'keys' as const, keys: wideRows.slice(0, 5_000).map((row) => row.id) };
    const empty = { kind: 'keys' as const, keys: [] as readonly number[] };
    const model1k = buildNeuTreeTableSelectionModel(projection1k, empty, selectionOptions);
    const model10k = buildNeuTreeTableSelectionModel(wideProjection, empty, selectionOptions);

    const branchRows = Array.from({ length: 101 }, (_, id) => ({ id }));
    const branchProjection = projectNeuTreeTableHierarchy(
      branchRows,
      (row) => row.id,
      hierarchy(
        [0],
        [
          { parentKey: 0, relation: loaded(branchRows.slice(1).map((row) => row.id)) },
          ...branchRows.slice(1).map((row) => ({ parentKey: row.id, relation: loaded([]) })),
        ],
      ),
      [],
    );
    const branchModel = buildNeuTreeTableSelectionModel(branchProjection, empty, selectionOptions);

    const deepRows = Array.from({ length: 1_001 }, (_, id) => ({ id }));
    const deepProjection = projectNeuTreeTableHierarchy(
      deepRows,
      (row) => row.id,
      hierarchy(
        [0],
        deepRows.map((row) => ({
          parentKey: row.id,
          relation: loaded(row.id < 1_000 ? [row.id + 1] : []),
        })),
      ),
      [],
    );
    const deepModel = buildNeuTreeTableSelectionModel(deepProjection, empty, selectionOptions);
    const intent = (key: number) => ({
      kind: 'node' as const,
      key,
      source: 'checkbox' as const,
      anchorKey: null,
      shiftKey: false,
      platformModifier: false,
    });

    const metrics = {
      membership1k: samples(
        () => void buildNeuTreeTableSelectionModel(projection1k, half1k, selectionOptions),
      ),
      membership10k: samples(
        () => void buildNeuTreeTableSelectionModel(wideProjection, half10k, selectionOptions),
        15,
      ),
      toggle1k: samples(
        () =>
          void proposeNeuTreeTableSelection({
            model: model1k,
            selection: empty,
            selectionOptions,
            intent: intent(500),
          }),
      ),
      toggle10k: samples(
        () =>
          void proposeNeuTreeTableSelection({
            model: model10k,
            selection: empty,
            selectionOptions,
            intent: intent(5_000),
          }),
      ),
      propagate100: samples(
        () =>
          void proposeNeuTreeTableSelection({
            model: branchModel,
            selection: empty,
            selectionOptions,
            intent: intent(0),
          }),
      ),
      propagateDeep1k: samples(
        () =>
          void proposeNeuTreeTableSelection({
            model: deepModel,
            selection: empty,
            selectionOptions,
            intent: intent(0),
          }),
        15,
      ),
      indeterminate1k: samples(
        () => void buildNeuTreeTableSelectionModel(projection1k, half1k, selectionOptions),
      ),
      indeterminate10k: samples(
        () => void buildNeuTreeTableSelectionModel(wideProjection, half10k, selectionOptions),
        15,
      ),
      gestures100: samples(() => {
        for (let index = 0; index < 100; index += 1) {
          void proposeNeuTreeTableSelection({
            model: model1k,
            selection: empty,
            selectionOptions,
            intent: intent(index),
          });
        }
      }),
      selection100: samples(() => {
        for (let index = 0; index < 100; index += 1) {
          void buildNeuTreeTableSelectionModel(
            projection1k,
            { kind: 'keys', keys: [index] },
            selectionOptions,
          );
        }
      }, 15),
      propagated100: samples(() => {
        for (let index = 0; index < 100; index += 1) {
          void proposeNeuTreeTableSelection({
            model: branchModel,
            selection: empty,
            selectionOptions,
            intent: intent(0),
          });
        }
      }, 15),
      destroy50: samples(() => {
        for (let index = 0; index < 50; index += 1) {
          const fixture = TestBed.createComponent(SelectionLifecycleHost);
          fixture.detectChanges();
          fixture.destroy();
        }
      }, 7),
    };

    expect(model10k.loadedOrder).toHaveLength(10_000);
    expect(deepModel.loadedOrder).toHaveLength(1_001);
    console.info(`N2_TREE_TABLE_D_PERFORMANCE:${JSON.stringify(metrics)}`);
  });
});
