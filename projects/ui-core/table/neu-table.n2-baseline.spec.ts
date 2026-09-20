import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { NeuTableComponent } from './neu-table.component';
import type { NeuTableColumn } from './neu-table.types';

interface BaselineRow {
  readonly id: number;
  readonly name: string;
  readonly status: 'active' | 'paused';
  readonly amount: number;
}

interface Sample {
  readonly durationMs: number;
  readonly domNodes: number;
}

const columns: readonly NeuTableColumn<BaselineRow>[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'status', header: 'Status', filterable: true },
  { key: 'amount', header: 'Amount', sortable: true },
];

function rows(count: number): readonly BaselineRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    name: `Row ${String(count - index).padStart(5, '0')}`,
    status: index % 3 === 0 ? 'paused' : 'active',
    amount: (index * 17) % 10_000,
  }));
}

function percentile(values: readonly number[], ratio: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1);
  return Number(ordered[Math.max(0, index)].toFixed(3));
}

function summarize(samples: readonly Sample[]) {
  return {
    samples: samples.length,
    p50Ms: percentile(
      samples.map((sample) => sample.durationMs),
      0.5,
    ),
    p95Ms: percentile(
      samples.map((sample) => sample.durationMs),
      0.95,
    ),
    domNodes: Math.max(...samples.map((sample) => sample.domNodes)),
  };
}

describe('NeuTable 1.x N2-011A performance baseline', () => {
  beforeAll(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideIcons({ lucidePencil }),
      ],
    }).compileComponents();
  });

  it(
    'captures repeatable 1k/10k render, sort, filter, selection, virtual and lifecycle metrics',
    { timeout: 180_000 },
    async () => {
      const datasets = { small: rows(1_000), large: rows(10_000) };

      async function create(
        data: readonly BaselineRow[],
        inputs: Readonly<Record<string, unknown>> = {},
      ) {
        const started = performance.now();
        const fixture = TestBed.createComponent(NeuTableComponent<BaselineRow>);
        fixture.componentRef.setInput('columns', columns);
        fixture.componentRef.setInput('data', data);
        fixture.componentRef.setInput('urlStateOptions', {
          ...fixture.componentInstance.urlStateOptions(),
          enabled: false,
        });
        for (const [name, value] of Object.entries(inputs)) {
          fixture.componentRef.setInput(name, value);
        }
        fixture.detectChanges();
        await fixture.whenStable();
        return {
          fixture,
          sample: {
            durationMs: performance.now() - started,
            domNodes: fixture.nativeElement.querySelectorAll('*').length,
          },
        };
      }

      async function renderSamples(data: readonly BaselineRow[], count: number) {
        const samples: Sample[] = [];
        for (let index = 0; index < count; index += 1) {
          // The current non-virtual table eagerly renders every visible row. Keep
          // the render scenario bounded to a 100-row page while still measuring
          // ingestion/derivation over the complete 1k/10k client dataset.
          const result = await create(data, { pagination: true, pageSize: 100 });
          samples.push(result.sample);
          result.fixture.destroy();
        }
        return samples;
      }

      async function actionSamples(
        action: (table: NeuTableComponent<BaselineRow>) => void,
        inputs: Readonly<Record<string, unknown>> = {},
      ) {
        const samples: Sample[] = [];
        for (let index = 0; index < 5; index += 1) {
          const result = await create(datasets.large, inputs);
          const started = performance.now();
          action(result.fixture.componentInstance);
          result.fixture.detectChanges();
          await result.fixture.whenStable();
          samples.push({
            durationMs: performance.now() - started,
            domNodes: result.fixture.nativeElement.querySelectorAll('*').length,
          });
          result.fixture.destroy();
        }
        return samples;
      }

      const render1k = await renderSamples(datasets.small, 5);
      const render10k = await renderSamples(datasets.large, 5);
      const sort10k = await actionSamples((table) => table.sortBy('name'), { sortable: true });
      const filter10k = await actionSamples((table) => table.setColumnFilter('status', 'active'), {
        filterOptions: { delay: 0 },
      });
      const selection10k = await actionSamples((table) => table.selectRow(datasets.large[999]), {
        selectable: 'multiple',
      });
      const virtual10k = await actionSamples((table) => table.scrollToIndex(5_000), {
        pagination: false,
        virtualScroll: true,
        virtualizationOptions: { visibleItems: 30 },
      });

      const lifecycle: Sample[] = [];
      for (let index = 0; index < 50; index += 1) {
        const result = await create(datasets.small.slice(0, 50));
        const started = performance.now();
        result.fixture.destroy();
        lifecycle.push({ durationMs: performance.now() - started, domNodes: 0 });
      }

      const memory = (
        performance as Performance & {
          readonly memory?: { readonly usedJSHeapSize: number };
        }
      ).memory;
      const report = {
        environment: 'Angular test builder + jsdom; zoneless',
        datasets: [1_000, 10_000],
        metrics: {
          render1k: summarize(render1k),
          render10k: summarize(render10k),
          sort10k: summarize(sort10k),
          filter10k: summarize(filter10k),
          selection10k: summarize(selection10k),
          virtual10k: summarize(virtual10k),
          lifecycle50: summarize(lifecycle),
        },
        resources: performance.getEntriesByType('resource').length,
        heapBytes: memory?.usedJSHeapSize ?? null,
        listeners: null,
        observers: null,
        effects: null,
        unavailableReason:
          'The current Angular/jsdom harness exposes no stable listener, observer or effect census.',
      };

      const runtime = globalThis as typeof globalThis & {
        readonly process?: { readonly stdout?: { write(value: string): void } };
      };
      runtime.process?.stdout?.write(`N2_TABLE_PERFORMANCE:${JSON.stringify(report)}\n`);
      expect(report.metrics.render1k.domNodes).toBeGreaterThan(0);
      expect(report.metrics.render10k.domNodes).toBeGreaterThan(0);
      expect(report.metrics.lifecycle50.samples).toBe(50);
    },
  );
});
