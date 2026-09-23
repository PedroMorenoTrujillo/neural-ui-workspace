import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuToolbarComponent } from '@neural-ui/core/toolbar';

function percentiles(samples: readonly number[]): { readonly p50: number; readonly p95: number } {
  const sorted = [...samples].sort((left, right) => left - right);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
  };
}

describe('N2-023 focused visual-axis performance baselines', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuButtonComponent, NeuToolbarComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('captures 100 component create/destroy cycles', () => {
    const samples: number[] = [];
    for (let cycle = 0; cycle < 100; cycle += 1) {
      const started = performance.now();
      const fixture = TestBed.createComponent(NeuButtonComponent);
      fixture.detectChanges();
      fixture.destroy();
      samples.push(performance.now() - started);
    }
    const result = percentiles(samples);
    expect(Number.isFinite(result.p50)).toBe(true);
    expect(Number.isFinite(result.p95)).toBe(true);
    console.warn(
      `N2-023 create/destroy 100 cycles p50=${result.p50.toFixed(3)}ms p95=${result.p95.toFixed(3)}ms`,
    );
  });

  it('captures 1,000 tone, variant and density updates', () => {
    const button = TestBed.createComponent(NeuButtonComponent);
    const toolbar = TestBed.createComponent(NeuToolbarComponent);
    button.detectChanges();
    toolbar.detectChanges();
    const samples: number[] = [];
    for (let index = 0; index < 1_000; index += 1) {
      const started = performance.now();
      button.componentRef.setInput('tone', index % 2 === 0 ? 'brand' : 'neutral');
      button.componentRef.setInput('variant', index % 2 === 0 ? 'solid' : 'ghost');
      toolbar.componentRef.setInput('density', index % 2 === 0 ? 'compact' : 'relaxed');
      button.detectChanges();
      toolbar.detectChanges();
      samples.push(performance.now() - started);
    }
    const result = percentiles(samples);
    expect(Number.isFinite(result.p50)).toBe(true);
    expect(Number.isFinite(result.p95)).toBe(true);
    console.warn(
      `N2-023 visual updates 1k p50=${result.p50.toFixed(3)}ms p95=${result.p95.toFixed(3)}ms`,
    );
  });
});
