import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuMeterGroupComponent, NeuMeterItem } from './neu-meter-group.component';

const ITEMS: NeuMeterItem[] = [
  { label: 'A', value: 40 },
  { label: 'B', value: 35 },
  { label: 'C', value: 25 },
];

function mk() {
  return TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
}

describe('NeuMeterGroupComponent', () => {
  beforeEach(() => mk().compileComponents());

  it('should render', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-meter-group');
  });

  it('should render correct number of segments', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    await f.whenStable();
    const segments = f.nativeElement.querySelectorAll('.neu-meter-group__segment');
    expect(segments.length).toBe(3);
  });

  it('_usedSum should sum all item values', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp._usedSum()).toBe(100);
  });

  it('_effectiveTotal should use provided total when >0', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('total', 200);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp._effectiveTotal()).toBe(200);
  });

  it('_effectiveTotal should fallback to usedSum when total=0', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('total', 0);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp._effectiveTotal()).toBe(100);
  });

  it('_segments should compute correct percentages summing to 100', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const sum = comp._segments().reduce((s: number, seg: any) => s + seg.pct, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it('should cap segment pct to 100%', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', [{ label: 'X', value: 200 }]);
    f.componentRef.setInput('total', 100);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp._segments()[0].pct).toBe(100);
  });

  it('should render legend when showLegend=true', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('showLegend', true);
    f.detectChanges();
    await f.whenStable();
    const legend = f.nativeElement.querySelector('.neu-meter-group__legend');
    expect(legend).toBeTruthy();
    expect(legend.querySelectorAll('.neu-meter-group__legend-item').length).toBe(3);
  });

  it('should hide legend when showLegend=false', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('showLegend', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-meter-group__legend')).toBeNull();
  });

  it('should apply rounded class by default', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-meter-group--rounded');
  });

  it('_effectiveTotal should be 1 when items is empty and total=0 (avoid divide by zero)', async () => {
    const f = TestBed.createComponent(NeuMeterGroupComponent);
    f.componentRef.setInput('items', []);
    f.componentRef.setInput('total', 0);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp._effectiveTotal()).toBe(1);
  });
});
