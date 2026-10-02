import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { normalizeNeuTreeTableHierarchy } from './internal/hierarchy/neu-tree-table-hierarchy';
import {
  buildNeuTreeTableQueryProjection,
  proposeNeuTreeTableSort,
} from './internal/query/neu-tree-table-query';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type {
  NeuTreeLoadedRelation,
  NeuTreeTableColumn,
  NeuTreeTableHierarchy,
  NeuTreeTableQuery,
} from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly rank: number;
  readonly group: string;
}
type Field = 'name' | 'rank' | 'group';

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
const columns: readonly NeuTreeTableColumn<Row, Field>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    sort: { field: 'name' },
    filter: { field: 'name', rules: ['contains'], defaultRule: 'contains' },
  },
  {
    id: 'rank',
    header: 'Rank',
    field: 'rank',
    sort: { field: 'rank' },
    filter: { field: 'rank', rules: ['greaterThan'], defaultRule: 'greaterThan' },
  },
  {
    id: 'group',
    header: 'Group',
    field: 'group',
    sort: { field: 'group' },
    filter: { field: 'group', rules: ['equals'], defaultRule: 'equals' },
  },
];
const filterOptions = {
  surfaces: ['row'] as const,
  globalFields: ['name'] as const,
  predicates: {},
  debounceMs: 0,
  commit: 'immediate' as const,
};
const sortOptions = {
  mode: 'multiple' as const,
  removable: true,
  defaultDirection: 'asc' as const,
  resetRootPageOnChange: true,
};
const query = (overrides: Partial<NeuTreeTableQuery<Field>> = {}): NeuTreeTableQuery<Field> => ({
  page: 0,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
  ...overrides,
});

function samples(run: () => void, count = 19): { p50Ms: number; p95Ms: number } {
  for (let index = 0; index < 5; index += 1) run();
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
      [query]="query()"
      [filterOptions]="filterOptions"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
    />
  `,
})
class QueryLifecycleHost {
  readonly rows: readonly Row[] = [{ id: 1, name: 'Node 1', rank: 1, group: 'a' }];
  readonly tree = hierarchy([1]);
  readonly columns = columns;
  readonly filterOptions = filterOptions;
  readonly rowKey = (row: Row) => row.id;
  readonly query = signal(query());
}

describe('NeuTreeTable 2 query performance', () => {
  const metrics: Record<string, { p50Ms: number; p95Ms: number }> = {};

  afterAll(() => {
    console.info(`N2_TREE_TABLE_E_PERFORMANCE:${JSON.stringify(metrics)}`);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryLifecycleHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('captures reproducible E search/filter/sort/combined baselines', () => {
    const rows10k = Array.from({ length: 10_000 }, (_, id) => ({
      id,
      name: id % 10 === 0 ? `Needle ${id}` : `Node ${id}`,
      rank: 10_000 - id,
      group: `g${id % 7}`,
    }));
    const rows1k = rows10k.slice(0, 1_000);
    const normalized1k = normalizeNeuTreeTableHierarchy(
      rows1k,
      (row) => row.id,
      hierarchy(rows1k.map((row) => row.id)),
    );
    const normalized10k = normalizeNeuTreeTableHierarchy(
      rows10k,
      (row) => row.id,
      hierarchy(rows10k.map((row) => row.id)),
    );
    const deepRows = Array.from({ length: 1_001 }, (_, id) => ({
      id,
      name: id === 1_000 ? 'Deep needle' : `Deep ${id}`,
      rank: id,
      group: 'deep',
    }));
    const deepNormalized = normalizeNeuTreeTableHierarchy(
      deepRows,
      (row) => row.id,
      hierarchy(
        [0],
        deepRows.map((row) => ({
          parentKey: row.id,
          relation: loaded(row.id < 1_000 ? [row.id + 1] : []),
        })),
      ),
    );
    const run = (normalized: typeof normalized10k, applied: NeuTreeTableQuery<Field>): void => {
      void buildNeuTreeTableQueryProjection({
        normalized,
        query: applied,
        columns,
        filterOptions,
        sortOptions,
        dataMode: 'client',
      });
    };
    const nestedFilter: NeuTreeTableQuery<Field>['filters'] = {
      kind: 'group',
      operator: 'and',
      children: [
        { kind: 'condition', field: 'rank', rule: 'greaterThan', value: 100 },
        {
          kind: 'group',
          operator: 'or',
          children: [
            { kind: 'condition', field: 'group', rule: 'equals', value: 'g1' },
            { kind: 'condition', field: 'group', rule: 'equals', value: 'g2' },
          ],
        },
      ],
    };
    Object.assign(metrics, {
      search1kNoMatch: samples(() => run(normalized1k, query({ search: 'absent' }))),
      search1kSparse: samples(() => run(normalized1k, query({ search: 'needle 990' }))),
      search10kNoMatch: samples(() => run(normalized10k, query({ search: 'absent' })), 11),
      search10kMany: samples(() => run(normalized10k, query({ search: 'node' })), 11),
      searchDeep1k: samples(() => run(deepNormalized, query({ search: 'deep needle' })), 11),
      filter1kSimple: samples(() =>
        run(
          normalized1k,
          query({
            filters: { kind: 'condition', field: 'rank', rule: 'greaterThan', value: 500 },
          }),
        ),
      ),
      filter10kNested: samples(() => run(normalized10k, query({ filters: nestedFilter })), 11),
      sort10kSingle: samples(
        () => run(normalized10k, query({ sort: [{ field: 'rank', direction: 'asc' }] })),
        11,
      ),
      sort10kMulti: samples(
        () =>
          run(
            normalized10k,
            query({
              sort: [
                { field: 'group', direction: 'asc' },
                { field: 'rank', direction: 'desc' },
              ],
            }),
          ),
        11,
      ),
      combined1k: samples(() =>
        run(
          normalized1k,
          query({
            search: 'node',
            filters: nestedFilter,
            sort: [{ field: 'rank', direction: 'desc' }],
          }),
        ),
      ),
      combined10k: samples(
        () =>
          run(
            normalized10k,
            query({
              search: 'node',
              filters: nestedFilter,
              sort: [{ field: 'rank', direction: 'desc' }],
            }),
          ),
        11,
      ),
      proposals100: samples(() => {
        let applied = query();
        for (let index = 0; index < 100; index += 1) {
          applied = proposeNeuTreeTableSort(applied, 'rank', sortOptions);
        }
      }),
      transitions100: samples(() => {
        for (let index = 0; index < 100; index += 1) {
          run(normalized1k, query({ search: index % 2 === 0 ? 'node' : 'needle' }));
        }
      }, 7),
    });

    expect(
      buildNeuTreeTableQueryProjection({
        normalized: deepNormalized,
        query: query({ search: 'deep needle' }),
        columns,
        filterOptions,
        sortOptions,
        dataMode: 'client',
      }).retained.size,
    ).toBe(1_001);
  });

  // Lifecycle rendering is independent of query projection. Keep the original
  // sample counts and per-test timeout, including under coverage instrumentation.
  it('captures the create/render/destroy lifecycle baseline', () => {
    metrics['destroy50'] = samples(() => {
      for (let index = 0; index < 50; index += 1) {
        const fixture = TestBed.createComponent(QueryLifecycleHost);
        fixture.detectChanges();
        fixture.destroy();
      }
    }, 7);
  });
});
