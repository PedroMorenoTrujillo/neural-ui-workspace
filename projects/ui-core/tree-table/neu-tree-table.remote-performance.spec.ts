import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createNeuTreeTableRemoteState,
  destroyNeuTreeTableRemote,
  reduceNeuTreeTableRemote,
} from './internal/remote/neu-tree-table-remote';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type {
  NeuTreeLoadedRelation,
  NeuTreeTableHierarchy,
  NeuTreeTableQuery,
} from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
}
type Field = 'name';

const appliedQuery = (search = ''): NeuTreeTableQuery<Field> => ({
  page: 0,
  pageSize: 25,
  search,
  sort: [],
  filters: null,
});

const loaded = (
  keys: readonly number[],
  total: number | null = keys.length,
): NeuTreeLoadedRelation<number> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total,
  completeness: total === keys.length ? 'complete' : 'partial',
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
      dataMode="remote"
      [data]="rows"
      [hierarchy]="tree"
      [columns]="columns"
      [rowKey]="rowKey"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 16 }"
    />
  `,
})
class RemoteLifecycleHost {
  readonly rows: readonly Row[] = [{ id: 1, name: 'One' }];
  readonly tree: NeuTreeTableHierarchy<number> = {
    hierarchyRevision: 1,
    queryRevision: 0,
    roots: loaded([1]),
    children: [],
  };
  readonly columns = [{ id: 'name', header: 'Name', field: 'name' as const }];
  readonly rowKey = (row: Row) => row.id;
}

describe('NeuTreeTable 2 remote performance', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoteLifecycleHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('captures reproducible F coordinator and lifecycle baselines', () => {
    const roots100 = (): void => {
      let state = createNeuTreeTableRemoteState();
      for (let revision = 1; revision <= 100; revision += 1) {
        state = reduceNeuTreeTableRemote(state, {
          browser: true,
          mode: 'remote',
          hierarchy: {
            hierarchyRevision: revision,
            queryRevision: 0,
            roots: {
              status: 'unloaded',
              keys: [],
              relationRevision: revision,
              appliedRequestId: null,
              total: null,
            },
            children: [],
          },
          query: appliedQuery(),
          expandedKeys: [],
          knownKeys: [],
        }).state;
      }
    };
    const children100 = (): void => {
      let state = createNeuTreeTableRemoteState();
      for (let revision = 1; revision <= 100; revision += 1) {
        state = reduceNeuTreeTableRemote(state, {
          browser: true,
          mode: 'remote',
          hierarchy: {
            hierarchyRevision: revision,
            queryRevision: 0,
            roots: loaded([1]),
            children: [
              {
                parentKey: 1,
                relation: {
                  status: 'unloaded',
                  keys: [],
                  relationRevision: revision,
                  appliedRequestId: null,
                  total: null,
                },
              },
            ],
          },
          query: appliedQuery(),
          expandedKeys: [1],
          knownKeys: [1],
        }).state;
      }
    };
    const concurrent100 = (): void => {
      const keys = Array.from({ length: 100 }, (_, index) => index);
      void reduceNeuTreeTableRemote(createNeuTreeTableRemoteState(), {
        browser: true,
        mode: 'remote',
        hierarchy: {
          hierarchyRevision: 1,
          queryRevision: 0,
          roots: loaded(keys),
          children: [],
        },
        query: appliedQuery(),
        expandedKeys: keys,
        knownKeys: keys,
      });
    };
    const queryCycles100 = (): void => {
      let state = createNeuTreeTableRemoteState();
      for (let revision = 0; revision < 100; revision += 1) {
        state = reduceNeuTreeTableRemote(state, {
          browser: true,
          mode: 'remote',
          hierarchy: {
            hierarchyRevision: revision + 1,
            queryRevision: 0,
            roots: loaded([1]),
            children: [{ parentKey: 1, relation: loaded([]) }],
          },
          query: appliedQuery(`query-${revision}`),
          expandedKeys: [1],
          knownKeys: [1],
        }).state;
      }
    };
    const largeTotal = (): void => {
      void reduceNeuTreeTableRemote(createNeuTreeTableRemoteState(), {
        browser: true,
        mode: 'remote',
        hierarchy: {
          hierarchyRevision: 1,
          queryRevision: 0,
          roots: loaded([1], 1_000_000),
          children: [],
        },
        query: appliedQuery(),
        expandedKeys: [],
        knownKeys: [1],
      });
    };
    const metrics = {
      roots100: samples(roots100),
      children100: samples(children100),
      concurrent100: samples(concurrent100),
      queryCycles100: samples(queryCycles100),
      largeTotal1m: samples(largeTotal),
      destroy50: samples(() => {
        for (let index = 0; index < 50; index += 1) {
          const fixture = TestBed.createComponent(RemoteLifecycleHost);
          fixture.detectChanges();
          fixture.destroy();
        }
      }, 7),
      stateDestroy100: samples(() => {
        for (let index = 0; index < 100; index += 1) {
          void destroyNeuTreeTableRemote(createNeuTreeTableRemoteState());
        }
      }),
    };
    console.info(`N2_TREE_TABLE_F_PERFORMANCE:${JSON.stringify(metrics)}`);
  });
});
