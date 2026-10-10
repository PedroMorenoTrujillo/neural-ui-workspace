import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconX } from '@neural-icons/core/icons/x';
import { NeuCalendarComponent } from '@neural-ui/core/calendar';
import { NeuDialogComponent } from '@neural-ui/core/modal';

function percentiles(samples: readonly number[]): { readonly p50: number; readonly p95: number } {
  const sorted = [...samples].sort((left, right) => left - right);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
  };
}

describe('N2-022 focused performance baselines', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuDialogComponent, NeuCalendarComponent],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();
  });

  it('captures 100 applied Dialog lifecycle cycles', async () => {
    const fixture = TestBed.createComponent(NeuDialogComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const samples: number[] = [];
    for (let cycle = 0; cycle < 100; cycle += 1) {
      const started = performance.now();
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      fixture.componentRef.setInput('open', false);
      fixture.detectChanges();
      await fixture.whenStable();
      samples.push(performance.now() - started);
    }
    const result = percentiles(samples);
    expect(Number.isFinite(result.p50)).toBe(true);
    expect(Number.isFinite(result.p95)).toBe(true);
    console.warn(
      `N2-022 Dialog 100 cycles p50=${result.p50.toFixed(3)}ms p95=${result.p95.toFixed(3)}ms`,
    );
  });

  it('captures 100 Calendar selection proposals', () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.detectChanges();
    const samples: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      const started = performance.now();
      fixture.componentInstance.selectDate(new Date(2026, 0, (index % 28) + 1));
      samples.push(performance.now() - started);
    }
    const result = percentiles(samples);
    expect(Number.isFinite(result.p50)).toBe(true);
    expect(Number.isFinite(result.p95)).toBe(true);
    console.warn(
      `N2-022 Calendar 100 selections p50=${result.p50.toFixed(3)}ms p95=${result.p95.toFixed(3)}ms`,
    );
  });
});
