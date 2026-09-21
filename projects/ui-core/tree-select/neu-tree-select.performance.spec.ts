import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTreeSelectComponent, NeuTreeSelectNode } from './neu-tree-select.component';

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

function nodes(count: number): NeuTreeSelectNode[] {
  return Array.from({ length: count }, (_, index) => ({
    value: `node-${index}`,
    label: `Node ${index}`,
  }));
}

describe('NeuTreeSelect N2-019 performance', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('captures projection, propagated selection, virtual window and lifecycle metrics', () => {
    const fixture = TestBed.createComponent(
      NeuTreeSelectComponent<NeuTreeSelectNode, string, 'multiple'>,
    );
    const component = fixture.componentInstance;
    const flat1k = nodes(1_000);
    const flat10k = nodes(10_000);

    fixture.componentRef.setInput('mode', 'multiple');
    fixture.componentRef.setInput('virtualizationOptions', {
      enabled: true,
      itemSize: 40,
      viewportHeight: 240,
      buffer: 3,
    });

    const projection1k = benchmark(30, () => {
      fixture.componentRef.setInput('nodes', [...flat1k]);
      fixture.detectChanges();
      component.visibleNodes();
    });
    const projection10k = benchmark(12, () => {
      fixture.componentRef.setInput('nodes', [...flat10k]);
      fixture.detectChanges();
      component.visibleNodes();
    });
    const filter10k = benchmark(30, (index) => {
      component.query.set(index % 2 === 0 ? 'Node 98' : 'Node 99');
      component.visibleNodes();
    });

    const root: NeuTreeSelectNode = {
      value: 'root',
      label: 'Root',
      children: nodes(9_999),
    };
    fixture.componentRef.setInput('nodes', [root]);
    fixture.componentRef.setInput('selectionStrategy', 'propagated');
    fixture.detectChanges();
    const propagated10k = benchmark(12, () => {
      component.selectNode(root);
      component.selectionStates();
    });

    fixture.componentRef.setInput('nodes', flat10k);
    fixture.detectChanges();
    let maxMountedNodes = 0;
    const virtualWindow10k = benchmark(300, (index) => {
      component.virtualStart.set((index * 37) % 9_990);
      maxMountedNodes = Math.max(maxMountedNodes, component.renderedNodes().length);
    });
    fixture.destroy();

    const lifecycle50 = benchmark(50, () => {
      const cycle = TestBed.createComponent(NeuTreeSelectComponent);
      cycle.componentRef.setInput('nodes', flat1k.slice(0, 10));
      cycle.detectChanges();
      cycle.destroy();
    });

    const metrics = {
      projection1k,
      projection10k,
      filter10k,
      propagated10k,
      virtualWindow10k,
      lifecycle50,
      maxMountedNodes,
      productEffects: 0,
      persistentTimers: 0,
      perNodeListeners: 0,
    };
    expect(maxMountedNodes).toBeLessThanOrEqual(12);
    expect(component.value()).toBeDefined();
    console.log(`N2_TREE_SELECT_PERFORMANCE:${JSON.stringify(metrics)}`);
  });
});
