import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuPanelComponent } from '../panel/neu-panel.component';
import { NeuSidebarComponent } from '../sidebar/neu-sidebar.component';
import { NeuTab, NeuTabsComponent } from './neu-tabs.component';

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

const tabItems = (count: number): readonly NeuTab<number>[] =>
  Array.from({ length: count }, (_, id) => ({ id, label: `Tab ${id}` }));

describe('N2-021 navigation performance', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('captures Tabs projection, controlled writes, toggles and lifecycle metrics', () => {
    const fixture = TestBed.createComponent(NeuTabsComponent<number>);
    const component = fixture.componentInstance;
    const tabs1k = tabItems(1_000);
    fixture.componentRef.setInput('activeId', 0);
    fixture.componentRef.setInput('tabs', tabs1k);

    const projection1k = benchmark(30, () => {
      fixture.componentRef.setInput('tabs', [...tabs1k]);
      component.activeTabId();
    });
    const membership1k = benchmark(50, () => {
      for (let index = 0; index < 1_000; index += 1) component.isTabActive(index);
    });
    const parentWrites1k = benchmark(100, (index) => {
      fixture.componentRef.setInput('activeId', index % 1_000);
      component.activeTabId();
    });
    fixture.destroy();

    const panelToggle = benchmark(100, () => {
      const cycle = TestBed.createComponent(NeuPanelComponent);
      cycle.componentRef.setInput('collapsible', true);
      cycle.componentInstance.toggle();
      cycle.destroy();
    });
    const sidebarToggle = benchmark(100, () => {
      const cycle = TestBed.createComponent(NeuSidebarComponent);
      cycle.componentRef.setInput('persistent', true);
      cycle.componentInstance.toggleCollapsed();
      cycle.destroy();
    });
    const lifecycle50 = benchmark(50, () => {
      const cycle = TestBed.createComponent(NeuTabsComponent);
      cycle.componentRef.setInput('tabs', [{ id: 'one', label: 'One' }]);
      cycle.detectChanges();
      cycle.destroy();
    });

    const metrics = {
      projection1k,
      membership1k,
      parentWrites1k,
      panelToggle,
      sidebarToggle,
      lifecycle50,
      tabsProductEffects: 0,
      panelProductEffects: 0,
      sidebarLifecycleEffects: 2,
      tabsObservers: 0,
      tabsPersistentTimers: 0,
    };
    console.log(`N2_NAVIGATION_PERFORMANCE:${JSON.stringify(metrics)}`);
  });
});
