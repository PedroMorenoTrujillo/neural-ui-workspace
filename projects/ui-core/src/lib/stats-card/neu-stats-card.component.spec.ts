import { TestBed } from '@angular/core/testing';
import { NeuStatsCardComponent } from './neu-stats-card.component';
import { provideIcons } from '@ng-icons/core';
import {
  lucideTrendingUp,
  lucideTrendingDown,
  lucideMinus,
  lucideDollarSign,
} from '@ng-icons/lucide';

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
        provideIcons({ lucideTrendingUp, lucideTrendingDown, lucideMinus, lucideDollarSign }),
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
    const f = mk({ title: 'T', value: 'V', icon: 'lucideDollarSign' });
    expect(f.nativeElement.querySelector('.neu-stats-card__icon')).toBeTruthy();
  });

  it('should NOT render icon when icon is empty', () => {
    const f = mk({ title: 'T', value: 'V', icon: '' });
    expect(f.nativeElement.querySelector('.neu-stats-card__icon')).toBeFalsy();
  });

  // ── Sparkline ─────────────────────────────────────────────────────────────

  it('should render sparkline when sparkData has 2+ points', () => {
    const f = mk({ title: 'T', value: 'V', sparkData: [10, 20, 15, 30] });
    expect(f.nativeElement.querySelector('.neu-stats-card__sparkline')).toBeTruthy();
  });

  it('should NOT render sparkline when sparkData has less than 2 points', () => {
    const f = mk({ title: 'T', value: 'V', sparkData: [10] });
    expect(f.nativeElement.querySelector('.neu-stats-card__sparkline')).toBeFalsy();
  });

  it('should NOT render sparkline when sparkData is empty', () => {
    const f = mk({ title: 'T', value: 'V', sparkData: [] });
    expect(f.nativeElement.querySelector('.neu-stats-card__sparkline')).toBeFalsy();
  });

  it('sparkPoints computed should return valid SVG polyline points', () => {
    const f = mk({ title: 'T', value: 'V', sparkData: [10, 30, 20] });
    const comp = f.componentInstance as any;
    const points = comp.sparkPoints();
    expect(typeof points).toBe('string');
    expect(points.length).toBeGreaterThan(0);
    // Should contain comma-separated coordinate pairs
    expect(points).toMatch(/\d+/);
  });

  it('sparkPoints handles flat data (all same value)', () => {
    const f = mk({ title: 'T', value: 'V', sparkData: [5, 5, 5] });
    const comp = f.componentInstance as any;
    const points = comp.sparkPoints();
    expect(typeof points).toBe('string');
    expect(points.length).toBeGreaterThan(0);
  });

  // ── Host class ────────────────────────────────────────────────────────────

  it('should have host class neu-stats-card', () => {
    const f = mk({ title: 'T', value: 'V' });
    expect(f.nativeElement.classList.contains('neu-stats-card')).toBe(true);
  });
});
