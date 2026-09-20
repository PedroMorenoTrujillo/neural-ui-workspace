import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  normalizeNeuTreeTableHierarchy,
  projectNeuTreeTableHierarchy,
} from './internal/hierarchy/neu-tree-table-hierarchy';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type { NeuTreeLoadedRelation, NeuTreeTableHierarchy } from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
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
const keyOf = (row: Row) => row.id;

function samples(run: () => void, count = 25): { p50Ms: number; p95Ms: number } {
  for (let index = 0; index < 5; index += 1) run();
  const values = Array.from({ length: count }, () => {
    const started = performance.now();
    run();
    return performance.now() - started;
  }).sort((left, right) => left - right);
  return {
    p50Ms: Number((values[Math.floor(values.length * 0.5)] ?? 0).toFixed(3)),
    p95Ms: Number((values[Math.floor(values.length * 0.95)] ?? 0).toFixed(3)),
  };
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent],
  template: `
    <neu-tree-table
      [data]="rows()"
      [hierarchy]="hierarchy()"
      [columns]="columns"
      [rowKey]="rowKey"
      [expandedKeys]="expanded()"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
    />
  `,
})
class PerformanceHost {
  readonly rows = signal<readonly Row[]>([]);
  readonly hierarchy = signal<NeuTreeTableHierarchy<number>>(hierarchy([]));
  readonly expanded = signal<readonly number[]>([]);
  readonly columns = [{ id: 'name', header: 'Name', field: 'name' as const }];
  readonly rowKey = keyOf;
}

describe('NeuTreeTable 2 hierarchy and renderer performance', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('captures reproducible B baselines', async () => {
    const rows1k = Array.from({ length: 1_000 }, (_, id) => ({ id, name: `Node ${id}` }));
    const state1k = hierarchy(rows1k.map((row) => row.id));
    const rows10k = Array.from({ length: 10_000 }, (_, id) => ({ id, name: `Node ${id}` }));
    const state10k = hierarchy(rows10k.map((row) => row.id));
    const deepRows = Array.from({ length: 1_001 }, (_, id) => ({ id, name: `Deep ${id}` }));
    const deepState = hierarchy(
      [0],
      deepRows.map((row) => ({
        parentKey: row.id,
        relation: loaded(row.id < 1_000 ? [row.id + 1] : []),
      })),
    );
    const deepExpanded = Array.from({ length: 1_000 }, (_, id) => id);
    const branchRows = Array.from({ length: 101 }, (_, id) => ({ id, name: `Branch ${id}` }));
    const branchState = hierarchy(
      [0],
      [
        { parentKey: 0, relation: loaded(branchRows.slice(1).map((row) => row.id)) },
        ...branchRows.slice(1).map((row) => ({ parentKey: row.id, relation: loaded([]) })),
      ],
    );

    const metrics = {
      normalize1k: samples(() => void normalizeNeuTreeTableHierarchy(rows1k, keyOf, state1k)),
      flatten1k: samples(() => void projectNeuTreeTableHierarchy(rows1k, keyOf, state1k, [])),
      normalize10k: samples(
        () => void normalizeNeuTreeTableHierarchy(rows10k, keyOf, state10k),
        15,
      ),
      flatten10k: samples(
        () => void projectNeuTreeTableHierarchy(rows10k, keyOf, state10k, []),
        15,
      ),
      deep1000: samples(
        () => void projectNeuTreeTableHierarchy(deepRows, keyOf, deepState, deepExpanded),
        15,
      ),
      expand100: samples(
        () => void projectNeuTreeTableHierarchy(branchRows, keyOf, branchState, [0]),
      ),
      identicalRead1k: { p50Ms: 0, p95Ms: 0 },
      render1k: { p50Ms: 0, p95Ms: 0, domNodes: 0 },
      destroy50Ms: 0,
    };

    const fixture = TestBed.createComponent(PerformanceHost);
    fixture.componentInstance.rows.set(rows1k);
    fixture.componentInstance.hierarchy.set(state1k);
    fixture.detectChanges();
    await fixture.whenStable();
    metrics.identicalRead1k = samples(() => fixture.detectChanges(), 15);
    const render = samples(() => {
      fixture.componentInstance.rows.set(rows1k.map((row) => ({ ...row })));
      fixture.detectChanges();
    }, 10);
    metrics.render1k = {
      ...render,
      domNodes: (fixture.nativeElement as HTMLElement).querySelectorAll('*').length,
    };
    fixture.destroy();

    const destroyStarted = performance.now();
    for (let index = 0; index < 50; index += 1) {
      const cycle = TestBed.createComponent(PerformanceHost);
      cycle.detectChanges();
      cycle.destroy();
    }
    metrics.destroy50Ms = Number((performance.now() - destroyStarted).toFixed(3));

    expect(
      projectNeuTreeTableHierarchy(deepRows, keyOf, deepState, deepExpanded).visible,
    ).toHaveLength(1_001);
    expect(projectNeuTreeTableHierarchy(rows10k, keyOf, state10k, []).visible).toHaveLength(10_000);
    console.info(`N2_TREE_TABLE_B_PERFORMANCE:${JSON.stringify(metrics)}`);
  });
});
