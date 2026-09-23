import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuStatsCardComponent } from './neu-stats-card.component';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconTrendingUp } from '@neural-icons/core/icons/trending-up';
import { iconTrendingDown } from '@neural-icons/core/icons/trending-down';
import { iconMinus } from '@neural-icons/core/icons/minus';
import { iconDollarSign } from '@neural-icons/core/icons/dollar-sign';

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuStatsCardComponent);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return f;
}

describe('NeuStatsCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideNeuralIcons(iconTrendingUp, iconTrendingDown, iconMinus, iconDollarSign),
      ],
    }).compileComponents();
  });

  // ── Rendering básico ──────────────────────────────────────────────────────

  it('should render title', () => {
    const f = mk({ title: 'Ventas', value: '1.234' });
    expect(f.nativeElement.textContent).toContain('Ventas');
  });

  it('should render value', () => {
    const f = mk({ title: 'Ventas', value: '1.234' });
    expect(f.nativeElement.textContent).toContain('1.234');
  });

  it('should render change', () => {
    const f = mk({ title: 'Ventas', value: '1.234', change: '+12%' });
    expect(f.nativeElement.textContent).toContain('+12%');
  });

  it('should render label', () => {
    const f = mk({ title: 'Ventas', value: '1.234', label: 'vs. mes anterior' });
    expect(f.nativeElement.textContent).toContain('vs. mes anterior');
  });

  // ── Trend classes ─────────────────────────────────────────────────────────

  it('should apply trend up class', () => {
    const f = mk({ title: 'T', value: 'V', change: '+12%', trend: 'up' });
    expect(f.nativeElement.querySelector('.neu-stats-card__change--up')).toBeTruthy();
  });

  it('should apply trend down class', () => {
    const f = mk({ title: 'T', value: 'V', change: '-5%', trend: 'down' });
    expect(f.nativeElement.querySelector('.neu-stats-card__change--down')).toBeTruthy();
  });

  it('should apply neutral trend class', () => {
    const f = mk({ title: 'T', value: 'V', change: '0%', trend: 'neutral' });
    expect(f.nativeElement.querySelector('.neu-stats-card__change--neutral')).toBeTruthy();
  });

  // ── Empty states ──────────────────────────────────────────────────────────

  it('should NOT render change section when change is empty', () => {
    const f = mk({ title: 'T', value: 'V', change: '' });
    expect(f.nativeElement.querySelector('.neu-stats-card__change')).toBeFalsy();
  });

  it('should NOT render label when not provided', () => {
    const f = mk({ title: 'T', value: 'V' });
    expect(f.nativeElement.querySelector('.neu-stats-card__label')).toBeFalsy();
  });

  // ── Icon ──────────────────────────────────────────────────────────────────

  it('should render icon when icon input is provided', () => {
    const f = mk({ title: 'T', value: 'V', icon: 'dollar-sign' });
    expect(f.nativeElement.querySelector('.neu-stats-card__icon')).toBeTruthy();
  });

  it('should NOT render icon when icon is empty', () => {
    const f = mk({ title: 'T', value: 'V', icon: '' });
    expect(f.nativeElement.querySelector('.neu-stats-card__icon')).toBeFalsy();
  });

  it('has no chart-specific API or built-in SVG', () => {
    const f = mk({ title: 'T', value: 'V' });
    expect('sparkData' in f.componentInstance).toBe(false);
    expect(f.nativeElement.querySelector('svg')).toBeNull();
  });

  // ── Host class ────────────────────────────────────────────────────────────

  it('should have host class neu-stats-card', () => {
    const f = mk({ title: 'T', value: 'V' });
    expect(f.nativeElement.classList.contains('neu-stats-card')).toBe(true);
  });

  it('trend=up renders trending up icon', async () => {
    const f = mk({ title: 'T', value: 'V', trend: 'up', change: '+5%' });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.innerHTML).toContain('neu-stats-card__change--up');
  });

  it('trend=down renders trending down icon', async () => {
    const f = mk({ title: 'T', value: 'V', trend: 'down', change: '-3%' });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.innerHTML).toContain('neu-stats-card__change--down');
  });

  it('trend=neutral renders minus icon', async () => {
    const f = mk({ title: 'T', value: 'V', trend: 'neutral', change: '0%' });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.innerHTML).toContain('neu-stats-card__change--neutral');
  });

  it('change label renders when change is provided', async () => {
    const f = mk({ title: 'T', value: 'V', trend: 'up', change: '+12%', label: 'vs last month' });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('+12%');
    expect(f.nativeElement.textContent).toContain('vs last month');
  });

  it('icon input renders the icon component', async () => {
    const f = mk({ title: 'T', value: 'V', icon: 'dollar-sign' });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-stats-card__icon')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-stats-card__icon neural-icon')?.getAttribute('aria-hidden')).toBe('true');
  });
});

@Component({
  imports: [NeuStatsCardComponent],
  template: `<neu-stats-card title="Revenue" value="$200"><span data-metric-visual>Consumer visual</span></neu-stats-card>`,
})
class StatsProjectionHost {}

describe('NeuStatsCard composition', () => {
  it('projects consumer-owned visual content without interpreting it', () => {
    TestBed.configureTestingModule({ imports: [StatsProjectionHost] });
    const fixture = TestBed.createComponent(StatsProjectionHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-metric-visual]')?.textContent).toBe('Consumer visual');
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });
});
