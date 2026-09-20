import { computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { runNeuTableClientPipeline } from './internal/client-pipeline/neu-table-client-pipeline';
import { NeuTableComponent } from './public/neu-table.component-contract';
import type { NeuTableColumn } from './public/neu-table.types';

interface PerformanceRow {
  readonly id: number;
  readonly name: string;
  readonly amount: number;
}

interface PerformanceSample {
  readonly durationMs: number;
  readonly domNodes: number;
}

const columns: readonly NeuTableColumn<PerformanceRow, 'id' | 'name' | 'amount'>[] = [
  { id: 'id', header: 'ID', field: 'id' },
  { id: 'name', header: 'Name', field: 'name' },
  { id: 'amount', header: 'Amount', field: 'amount' },
];

function rows(count: number): readonly PerformanceRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    name: `Row ${index}`,
    amount: index * 7,
  }));
}

function summarize(samples: readonly PerformanceSample[]) {
  const values = samples.map((sample) => sample.durationMs).sort((left, right) => left - right);
  const percentile = (ratio: number) =>
    Number(values[Math.max(0, Math.ceil(values.length * ratio) - 1)]?.toFixed(3));
  return {
    samples: samples.length,
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    domNodes: Math.max(...samples.map((sample) => sample.domNodes)),
  };
}

describe('NeuTable 2 N2-011B renderer performance', () => {
  beforeAll(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('captures 100/1k direct render, replacement, reorder and destroy x50', async () => {
    const render = async (data: readonly PerformanceRow[]) => {
      const started = performance.now();
      const fixture = TestBed.createComponent(
        NeuTableComponent<PerformanceRow, number, 'id' | 'name' | 'amount'>,
      );
      fixture.componentRef.setInput('rowKey', (row: PerformanceRow) => row.id);
      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();
      await fixture.whenStable();
      return {
        fixture,
        sample: {
          durationMs: performance.now() - started,
          domNodes: fixture.nativeElement.querySelectorAll('*').length,
        },
      };
    };

    const sample = async (data: readonly PerformanceRow[], count: number) => {
      const samples: PerformanceSample[] = [];
      for (let index = 0; index < count; index += 1) {
        const result = await render(data);
        samples.push(result.sample);
        result.fixture.destroy();
      }
      return summarize(samples);
    };

    const initial = rows(1_000);
    const updateFixture = await render(initial);
    const replacementStarted = performance.now();
    updateFixture.fixture.componentRef.setInput(
      'data',
      initial.map((row) => ({ ...row })),
    );
    updateFixture.fixture.detectChanges();
    await updateFixture.fixture.whenStable();
    const replacementMs = performance.now() - replacementStarted;
    const reorderStarted = performance.now();
    updateFixture.fixture.componentRef.setInput('data', [...initial].reverse());
    updateFixture.fixture.detectChanges();
    await updateFixture.fixture.whenStable();
    const reorderMs = performance.now() - reorderStarted;
    updateFixture.fixture.destroy();

    const destroyStarted = performance.now();
    for (let index = 0; index < 50; index += 1) {
      const result = await render(rows(10));
      result.fixture.destroy();
    }
    const destroy50Ms = performance.now() - destroyStarted;

    console.info(
      `N2_TABLE_RENDERER_PERFORMANCE:${JSON.stringify({
        render100: await sample(rows(100), 5),
        render1000: await sample(initial, 3),
        parentReplacement1000Ms: Number(replacementMs.toFixed(3)),
        reorder1000Ms: Number(reorderMs.toFixed(3)),
        destroy50Ms: Number(destroy50Ms.toFixed(3)),
      })}`,
    );
  }, 180_000);
});

describe('NeuTable 2 N2-011C client pipeline performance', () => {
  it('captures 1k/10k stages and verifies computed invalidation boundaries', () => {
    const data1k = rows(1_000);
    const data10k = rows(10_000);
    const base = {
      dataMode: 'client' as const,
      columns,
      rowKey: (row: PerformanceRow) => row.id,
      rowOptions: { reorderable: false },
      sortOptions: {
        mode: 'multiple' as const,
        removable: true,
        defaultDirection: 'asc' as const,
        resetPageOnChange: true,
      },
      filterOptions: {
        surfaces: [],
        globalFields: ['name', 'amount'] as const,
        predicates: {},
        debounceMs: 0,
        commit: 'immediate' as const,
      },
      paginationOptions: {
        enabled: true,
        pageSizeOptions: [25],
        position: 'bottom' as const,
        report: 'none' as const,
        showPageJump: false,
      },
    };
    const measure = (operation: () => unknown) => {
      for (let index = 0; index < 3; index += 1) operation();
      const samples = Array.from({ length: 15 }, () => {
        const started = performance.now();
        operation();
        return performance.now() - started;
      }).sort((left, right) => left - right);
      const percentile = (ratio: number) =>
        Number(samples[Math.max(0, Math.ceil(samples.length * ratio) - 1)]!.toFixed(3));
      return { samples: samples.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95) };
    };
    const execute = (
      data: readonly PerformanceRow[],
      query: {
        readonly page: number;
        readonly pageSize: number;
        readonly search: string;
        readonly sort: readonly {
          readonly field: 'id' | 'name' | 'amount';
          readonly direction: 'asc' | 'desc';
        }[];
        readonly filters:
          | import('./public/neu-table.types').NeuFilterExpression<'id' | 'name' | 'amount'>
          | null;
      },
    ) => runNeuTableClientPipeline({ ...base, data, query });
    const queries = {
      search: { page: 0, pageSize: 25, search: 'row 99', sort: [], filters: null },
      filter: {
        page: 0,
        pageSize: 25,
        search: '',
        sort: [],
        filters: {
          kind: 'condition' as const,
          field: 'amount' as const,
          rule: 'greaterThan' as const,
          value: 30_000,
        },
      },
      singleSort: {
        page: 0,
        pageSize: 25,
        search: '',
        sort: [{ field: 'amount' as const, direction: 'desc' as const }],
        filters: null,
      },
      multiSort: {
        page: 0,
        pageSize: 25,
        search: '',
        sort: [
          { field: 'name' as const, direction: 'asc' as const },
          { field: 'amount' as const, direction: 'desc' as const },
        ],
        filters: null,
      },
      combined: {
        page: 2,
        pageSize: 25,
        search: 'row',
        sort: [{ field: 'amount' as const, direction: 'desc' as const }],
        filters: {
          kind: 'condition' as const,
          field: 'amount' as const,
          rule: 'greaterThanOrEqual' as const,
          value: 7_000,
        },
      },
      page: { page: 200, pageSize: 25, search: '', sort: [], filters: null },
    };
    const dataSignal = signal(data10k);
    const querySignal = signal(queries.combined);
    const appearance = signal('compact');
    let computations = 0;
    const derived = computed(() => {
      computations += 1;
      return execute(dataSignal(), querySignal());
    });
    const firstRead = derived();
    const repeatedStarted = performance.now();
    const secondRead = derived();
    const repeatedIdenticalReadMs = performance.now() - repeatedStarted;
    expect(secondRead).toBe(firstRead);
    expect(computations).toBe(1);
    appearance.set('relaxed');
    expect(derived()).toBe(firstRead);
    expect(computations).toBe(1);
    const dataReplacementStarted = performance.now();
    dataSignal.set(data10k.map((row) => ({ ...row })));
    derived();
    const dataReplacementMs = performance.now() - dataReplacementStarted;
    const queryReplacementStarted = performance.now();
    querySignal.set({ ...queries.combined, page: 3 });
    derived();
    const queryReplacementMs = performance.now() - queryReplacementStarted;
    expect(computations).toBe(3);

    console.info(
      `N2_TABLE_CLIENT_PERFORMANCE:${JSON.stringify({
        search1k: measure(() => execute(data1k, queries.search)),
        search10k: measure(() => execute(data10k, queries.search)),
        filter10k: measure(() => execute(data10k, queries.filter)),
        singleSort10k: measure(() => execute(data10k, queries.singleSort)),
        multiSort10k: measure(() => execute(data10k, queries.multiSort)),
        combined10k: measure(() => execute(data10k, queries.combined)),
        pageExtraction10k: measure(() => execute(data10k, queries.page)),
        repeatedIdenticalReadMs: Number(repeatedIdenticalReadMs.toFixed(3)),
        dataReplacementMs: Number(dataReplacementMs.toFixed(3)),
        queryReplacementMs: Number(queryReplacementMs.toFixed(3)),
        computedEvaluations: computations,
      })}`,
    );
  }, 180_000);
});
