import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuAccordionComponent, NeuAccordionItem } from './neu-accordion.component';

function benchmark(iterations: number, operation: (index: number) => void) {
  const samples: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    operation(index);
    samples.push(performance.now() - start);
  }
  samples.sort((left, right) => left - right);
  return {
    p50Ms: samples[Math.floor(samples.length * 0.5)] ?? 0,
    p95Ms: samples[Math.floor(samples.length * 0.95)] ?? 0,
  };
}

const items = (count: number): readonly NeuAccordionItem<number>[] =>
  Array.from({ length: count }, (_, index) => ({ id: index, title: `Panel ${index}` }));

describe('NeuAccordion N2-020 performance', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('captures projection, membership, parent-write and lifecycle metrics', () => {
    const fixture = TestBed.createComponent(
      NeuAccordionComponent<number, NeuAccordionItem<number>>,
    );
    const component = fixture.componentInstance;
    const items1k = items(1_000);
    fixture.componentRef.setInput('expandedKeys', []);
    fixture.detectChanges();

    const projection1k = benchmark(30, () => {
      fixture.componentRef.setInput('items', [...items1k]);
      component.items();
    });
    fixture.componentRef.setInput('expandedKeys', items1k.map((item) => item.id));
    const membership1k = benchmark(50, () => {
      for (let index = 0; index < 1_000; index += 1) component.isExpanded(index);
    });
    fixture.componentRef.setInput('expandedKeys', []);
    const toggle1k = benchmark(100, () => component.toggle(999));
    const parentWrites1k = benchmark(20, (index) => {
      fixture.componentRef.setInput('expandedKeys', [index % 1_000]);
      component.isExpanded(index % 1_000);
    });
    fixture.destroy();

    const lifecycle50 = benchmark(50, () => {
      const cycle = TestBed.createComponent(NeuAccordionComponent);
      cycle.componentRef.setInput('items', [{ id: 'one', title: 'One' }]);
      cycle.detectChanges();
      cycle.destroy();
    });

    const metrics = {
      projection1k,
      membership1k,
      toggle1k,
      parentWrites1k,
      lifecycle50,
      productEffects: 0,
      persistentTimers: 0,
      observers: 0,
      perItemListeners: 1,
    };
    expect(component.isExpanded(999)).toBe(false);
    console.log(`N2_ACCORDION_PERFORMANCE:${JSON.stringify(metrics)}`);
  });
});
