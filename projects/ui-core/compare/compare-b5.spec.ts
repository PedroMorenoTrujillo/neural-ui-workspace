import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi } from 'vitest';
import { NeuCompareComponent, NeuCompareHandleComponent, NeuCompareIndicatorComponent, NeuCompareItemComponent } from './neu-compare.component';

@Component({
  imports: [NeuCompareComponent, NeuCompareHandleComponent, NeuCompareIndicatorComponent, NeuCompareItemComponent],
  template: `<div [attr.dir]="direction()"><neu-compare [value]="value()" [defaultValue]="fallback()" [min]="min()" [max]="max()" [step]="step()" [orientation]="orientation()" [disabled]="disabled()" (valueChange)="onChange($event.value)" (valueChangeEnd)="ends.push($event.value)">
    <neu-compare-item position="before"><img alt="Before" /></neu-compare-item>
    <neu-compare-item position="after"><img alt="After" /></neu-compare-item>
    <neu-compare-indicator />
    <neu-compare-handle ariaLabel="Reveal comparison" />
  </neu-compare></div>`,
})
class Host {
  readonly value = signal<number | undefined>(20);
  readonly fallback = signal(50);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(10);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly direction = signal<'ltr' | 'rtl'>('ltr');
  readonly disabled = signal(false);
  accept = false;
  changes: number[] = [];
  ends: number[] = [];
  onChange(next: number): void { this.changes.push(next); if (this.accept) this.value.set(next); }
}

describe('Compare B5 controlled interaction', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let compare: NeuCompareComponent;
  let root: HTMLElement;
  let range: HTMLInputElement;
  function pointerCaptureSpies(): { capture: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> } {
    const capture = vi.fn();
    const release = vi.fn();
    Object.defineProperty(root, 'setPointerCapture', { configurable: true, value: capture });
    Object.defineProperty(root, 'releasePointerCapture', { configurable: true, value: release });
    return { capture, release };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideZonelessChangeDetection()] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    root = fixture.nativeElement.querySelector('neu-compare');
    range = fixture.nativeElement.querySelector('neu-compare-handle input');
    compare = fixture.debugElement.children[0].children[0].componentInstance as NeuCompareComponent;
  });

  it('renders one adjustable control in Handle and presentation-only children', () => {
    expect(fixture.nativeElement.querySelectorAll('input[type=range]')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('neu-compare-indicator input')).toBeNull();
    expect(range.getAttribute('aria-label')).toBe('Reveal comparison');
    expect(range.getAttribute('aria-orientation')).toBe('horizontal');
    expect(range.value).toBe('20');
    expect(root.querySelectorAll('img[alt]')).toHaveLength(2);
    expect(root.querySelector('neu-compare-item')?.getAttribute('style')).toContain('20%');
    expect(root.querySelector('neu-compare-indicator')?.getAttribute('style')).toContain('20%');
    expect(root.querySelector('neu-compare-handle')?.getAttribute('style')).toContain('20%');
    expect(host.changes).toEqual([]);
  });

  it('keeps rejected proposals unapplied and accepts parent writes without echo', () => {
    range.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(host.changes).toEqual([30]);
    expect(host.ends).toEqual([30]);
    expect(range.value).toBe('20');
    host.accept = true;
    range.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(host.changes).toEqual([30, 100]);
    expect(range.value).toBe('100');
    host.value.set(40);
    fixture.detectChanges();
    expect(host.changes).toEqual([30, 100]);
    expect(range.value).toBe('40');
  });

  it('uses logical horizontal RTL and vertical keyboard movement', () => {
    host.direction.set('rtl');
    fixture.detectChanges();
    range.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(host.changes).toEqual([10]);
    host.orientation.set('vertical');
    fixture.detectChanges();
    expect(range.getAttribute('aria-orientation')).toBe('vertical');
    range.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    range.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(host.changes).toEqual([10, 30, 10]);
  });

  it('uses exact applied bounds, step, fallback and disabled state', () => {
    host.min.set(10); host.max.set(50); host.step.set(20); host.value.set(undefined); host.fallback.set(35);
    fixture.detectChanges();
    expect(range.value).toBe('30');
    range.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    expect(host.changes).toEqual([10]);
    host.disabled.set(true);
    fixture.detectChanges();
    expect(range.disabled).toBe(true);
    range.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    expect(host.changes).toEqual([10]);
  });

  it('captures one pointer, dedupes moves and cancels without completion', () => {
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect);
    const { capture, release } = pointerCaptureSpies();
    const pointer = (type: string, x: number, id = 3) => root.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { pointerId: id, button: 0, clientX: x, clientY: 0 }));
    pointer('pointerdown', 100);
    pointer('pointermove', 100);
    pointer('pointermove', 160, 9);
    pointer('pointermove', 160);
    pointer('pointercancel', 160);
    pointer('pointerup', 160);
    expect(capture).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(host.changes).toEqual([50, 80]);
    expect(host.ends).toEqual([]);
    expect(compare.dragging()).toBe(false);
  });

  it('maps RTL pointer coordinates to inline-start and ends exactly once', () => {
    host.direction.set('rtl'); fixture.detectChanges();
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect);
    pointerCaptureSpies();
    const pointer = (type: string, x: number) => root.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { pointerId: 4, button: 0, clientX: x, clientY: 0 }));
    pointer('pointerdown', 0);
    pointer('pointerup', 0);
    pointer('pointerup', 0);
    expect(host.changes).toEqual([100]);
    expect(host.ends).toEqual([100]);
  });

  it('releases active capture on destroy without a late completion', () => {
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100 } as DOMRect);
    const { release } = pointerCaptureSpies();
    root.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { pointerId: 7, button: 0, clientX: 40, clientY: 0 }));
    fixture.destroy();
    expect(release).toHaveBeenCalledOnce();
    expect(host.ends).toEqual([]);
  });

  it('survives 50 zoneless create/destroy cycles without a global resource', () => {
    for (let index = 0; index < 50; index++) {
      const cycle = TestBed.createComponent(Host);
      cycle.detectChanges();
      expect(cycle.nativeElement.querySelectorAll('neu-compare-handle input')).toHaveLength(1);
      cycle.destroy();
    }
  });
});
