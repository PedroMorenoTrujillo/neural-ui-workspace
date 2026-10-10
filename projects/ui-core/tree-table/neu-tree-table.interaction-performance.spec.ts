import {
  moveNeuTreeTableFocus,
  proposeNeuTreeTableExpansion,
} from './internal/interaction/neu-tree-table-interaction';
import { projectNeuTreeTableHierarchy } from './internal/hierarchy/neu-tree-table-hierarchy';
import type { NeuTreeLoadedRelation, NeuTreeTableHierarchy } from './public/neu-tree-table.types';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';

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
      [data]="[]"
      [hierarchy]="emptyHierarchy"
      [columns]="columns"
      [rowKey]="rowKey"
      [hierarchyOptions]="{ treeColumnId: 'id', indentSize: 18 }"
    />
  `,
})
class LifecycleHost {
  readonly emptyHierarchy = hierarchy([]);
  readonly columns = [{ id: 'id', header: 'Id', value: (row: Row) => row.id }];
  readonly rowKey = (row: Row) => row.id;
}

describe('NeuTreeTable 2 expansion and focus performance', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LifecycleHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('captures reproducible C interaction baselines', () => {
    const rows1k = Array.from({ length: 1_000 }, (_, id) => ({ id }));
    const rows10k = Array.from({ length: 10_000 }, (_, id) => ({ id }));
    const projection1k = projectNeuTreeTableHierarchy(
      rows1k,
      (row) => row.id,
      hierarchy(rows1k.map((row) => row.id)),
      [],
    );
    const projection10k = projectNeuTreeTableHierarchy(
      rows10k,
      (row) => row.id,
      hierarchy(rows10k.map((row) => row.id)),
      [],
    );
    const branchRows = Array.from({ length: 101 }, (_, id) => ({ id }));
    const branchHierarchy = hierarchy(
      [0],
      [
        { parentKey: 0, relation: loaded(branchRows.slice(1).map((row) => row.id)) },
        ...branchRows.slice(1).map((row) => ({ parentKey: row.id, relation: loaded([]) })),
      ],
    );
    const nestedRows = Array.from({ length: 101 }, (_, id) => ({ id }));
    const nestedHierarchy = hierarchy(
      [0],
      nestedRows.map((row) => ({
        parentKey: row.id,
        relation: loaded(row.id < 100 ? [row.id + 1] : []),
      })),
    );
    const nestedProjection = projectNeuTreeTableHierarchy(
      nestedRows,
      (row) => row.id,
      nestedHierarchy,
      Array.from({ length: 100 }, (_, id) => id),
    );
    const keys100 = Object.freeze(Array.from({ length: 100 }, (_, id) => id));
    const keys1k = Object.freeze(Array.from({ length: 1_000 }, (_, id) => id));

    const metrics = {
      proposal100: samples(() => void proposeNeuTreeTableExpansion(keys100, 50, true, 'keyboard')),
      proposal1k: samples(() => void proposeNeuTreeTableExpansion(keys1k, 500, true, 'toggle')),
      focusNext1k: samples(
        () => void moveNeuTreeTableFocus(projection1k, projection1k.visible[500]!, 'next'),
      ),
      focusPrevious1k: samples(
        () => void moveNeuTreeTableFocus(projection1k, projection1k.visible[500]!, 'previous'),
      ),
      focusHome1k: samples(
        () => void moveNeuTreeTableFocus(projection1k, projection1k.visible[500]!, 'first'),
      ),
      focusEnd1k: samples(
        () => void moveNeuTreeTableFocus(projection1k, projection1k.visible[500]!, 'last'),
      ),
      focusNext10k: samples(
        () => void moveNeuTreeTableFocus(projection10k, projection10k.visible[5_000]!, 'next'),
      ),
      focusPrevious10k: samples(
        () => void moveNeuTreeTableFocus(projection10k, projection10k.visible[5_000]!, 'previous'),
      ),
      focusHome10k: samples(
        () => void moveNeuTreeTableFocus(projection10k, projection10k.visible[5_000]!, 'first'),
      ),
      focusEnd10k: samples(
        () => void moveNeuTreeTableFocus(projection10k, projection10k.visible[5_000]!, 'last'),
      ),
      focusParentNested: samples(
        () =>
          void moveNeuTreeTableFocus(nestedProjection, nestedProjection.visible[100]!, 'parent'),
      ),
      focusFirstChildNested: samples(
        () =>
          void moveNeuTreeTableFocus(
            nestedProjection,
            nestedProjection.visible[50]!,
            'first-child',
          ),
      ),
      expand100: samples(
        () => void projectNeuTreeTableHierarchy(branchRows, (row) => row.id, branchHierarchy, [0]),
      ),
      collapse100: samples(
        () => void projectNeuTreeTableHierarchy(branchRows, (row) => row.id, branchHierarchy, []),
      ),
      nestedBranch: samples(
        () =>
          void projectNeuTreeTableHierarchy(
            nestedRows,
            (row) => row.id,
            nestedHierarchy,
            Array.from({ length: 100 }, (_, id) => id),
          ),
      ),
      navigation100Cycles: samples(() => {
        let current = projection1k.visible[0]!;
        for (let index = 0; index < 100; index += 1) {
          current = moveNeuTreeTableFocus(projection1k, current, 'next') ?? current;
        }
      }),
      proposal100Cycles: samples(() => {
        let applied: readonly number[] = [];
        for (let index = 0; index < 100; index += 1) {
          applied = proposeNeuTreeTableExpansion(applied, index, false, 'keyboard').next;
        }
      }),
      destroy50: samples(() => {
        for (let index = 0; index < 50; index += 1) {
          const fixture = TestBed.createComponent(LifecycleHost);
          fixture.detectChanges();
          fixture.destroy();
        }
      }, 7),
    };

    expect(projection10k.visible).toHaveLength(10_000);
    expect(
      projectNeuTreeTableHierarchy(branchRows, (row) => row.id, branchHierarchy, [0]).visible,
    ).toHaveLength(101);
    console.info(`N2_TREE_TABLE_C_PERFORMANCE:${JSON.stringify(metrics)}`);
    // Keep all algorithm samples and 700 mount/destroy operations. V8 coverage
    // adds instrumentation cost beyond the ordinary five-second unit timeout.
  }, 20_000);
});
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
