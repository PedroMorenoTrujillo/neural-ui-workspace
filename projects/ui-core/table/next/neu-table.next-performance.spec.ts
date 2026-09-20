import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
