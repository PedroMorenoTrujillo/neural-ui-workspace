import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuSplitterComponent, type NeuSplitterPane } from './neu-splitter.component';

function setup(panes: readonly NeuSplitterPane[] = [{ size: 50 }, { size: 50 }]) {
  const fixture = TestBed.createComponent(NeuSplitterComponent);
  fixture.componentRef.setInput('panes', panes);
  fixture.detectChanges();
  Object.defineProperty(fixture.nativeElement, 'offsetWidth', { configurable: true, value: 200 });
  Object.defineProperty(fixture.nativeElement, 'offsetHeight', { configurable: true, value: 200 });
  return fixture;
}

function handle(fixture: ReturnType<typeof setup>, index = 0): HTMLElement {
  return fixture.nativeElement.querySelectorAll('.neu-splitter__handle')[index];
}

function pointer(target: HTMLElement, type: string, x: number, y = 0, pointerId = 1): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId }, button: { value: 0 },
    clientX: { value: x }, clientY: { value: y },
  });
  target.dispatchEvent(event);
}

function key(target: HTMLElement, name: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
}

@Component({
  imports: [NeuSplitterComponent],
  template: `<neu-splitter [panes]="[{size: 50}, {size: 50}]">
    <div ngProjectAs="neu-splitter-pane" class="pane-a">A</div>
    <div ngProjectAs="neu-splitter-pane" class="pane-b">B</div>
  </neu-splitter>`,
})
class ProjectionHost {}

beforeEach(() => TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()],
}).compileComponents());

describe('NeuSplitterComponent controlled layout', () => {
  it('keeps horizontal as default and renders percentages in pane order', () => {
    const f = setup([{ size: 30 }, { size: 70 }]);
    const panes = f.nativeElement.querySelectorAll('.neu-splitter__pane');
    expect(f.nativeElement.classList).toContain('neu-splitter--horizontal');
    expect(panes[0].style.flexBasis).toBe('30%');
    expect(panes[1].style.flexBasis).toBe('70%');
    expect(handle(f).getAttribute('aria-valuenow')).toBe('30');
  });

  it('distributes unspecified sizes while preserving explicit zero', () => {
    const f = setup([{ size: 0 }, {}]);
    expect([...f.nativeElement.querySelectorAll('.neu-splitter__pane')].map((p: Element) =>
      (p as HTMLElement).style.flexBasis)).toEqual(['0%', '100%']);
    f.componentRef.setInput('panes', [{}, {}]);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('50%');
  });

  it('renders no handle for empty/one-pane layouts and N-1 handles for multiple panes', () => {
    const f = setup([]);
    expect(f.nativeElement.querySelectorAll('[role="separator"]')).toHaveLength(0);
    f.componentRef.setInput('panes', [{ size: 100 }]);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('[role="separator"]')).toHaveLength(0);
    f.componentRef.setInput('panes', [{ size: 30 }, { size: 40 }, { size: 30 }]);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('[role="separator"]')).toHaveLength(2);
  });

  it('projects each pane into its matching slot', async () => {
    const f = TestBed.createComponent(ProjectionHost);
    f.detectChanges();
    await f.whenStable();
    const panes = f.nativeElement.querySelectorAll('.neu-splitter__pane');
    expect(panes[0].querySelector('.pane-a')?.textContent).toContain('A');
    expect(panes[1].querySelector('.pane-b')?.textContent).toContain('B');
  });

  it('proposes a fresh immutable keyboard value but does not apply it when parent rejects', () => {
    const applied = Object.freeze([Object.freeze({ size: 50 }), Object.freeze({ size: 50 })]);
    const f = setup(applied);
    const proposals: readonly number[][] = [];
    f.componentInstance.sizesChange.subscribe((value) => (proposals as number[][]).push([...value]));
    key(handle(f), 'ArrowRight');
    f.detectChanges();
    expect(proposals).toEqual([[52, 48]]);
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('50%');
    expect(applied[0].size).toBe(50);
    expect('sizeChange' in f.componentInstance).toBe(false);
    expect('direction' in f.componentInstance).toBe(false);
  });

  it('keeps accepted parent writes and reconstructed pane arrays', () => {
    const f = setup();
    f.componentInstance.sizesChange.subscribe((sizes) => {
      f.componentRef.setInput('panes', sizes.map((size) => ({ size })));
    });
    key(handle(f), 'ArrowRight');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('52%');
    f.componentRef.setInput('panes', [{ size: 40 }, { size: 60 }]);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('40%');
  });

  it('uses physical horizontal arrows in LTR and RTL without reversing pane identity', () => {
    const ltr = setup();
    const ltrValues: readonly number[][] = [];
    ltr.componentInstance.sizesChange.subscribe((v) => (ltrValues as number[][]).push([...v]));
    key(handle(ltr), 'ArrowRight');
    key(handle(ltr), 'ArrowLeft');
    expect(ltrValues).toEqual([[52, 48], [48, 52]]);

    const rtl = setup();
    rtl.nativeElement.style.direction = 'rtl';
    const rtlValues: readonly number[][] = [];
    rtl.componentInstance.sizesChange.subscribe((v) => (rtlValues as number[][]).push([...v]));
    key(handle(rtl), 'ArrowRight');
    key(handle(rtl), 'ArrowLeft');
    expect(rtlValues).toEqual([[48, 52], [52, 48]]);
  });

  it('uses physical vertical arrows regardless of RTL', () => {
    const f = setup();
    f.componentRef.setInput('orientation', 'vertical');
    f.nativeElement.style.direction = 'rtl';
    f.detectChanges();
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    key(handle(f), 'ArrowDown');
    key(handle(f), 'ArrowUp');
    key(handle(f), 'ArrowRight');
    expect(values).toEqual([[52, 48], [48, 52]]);
    expect(handle(f).getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('enforces adjacent pixel min/max and exposes logical separator bounds', () => {
    const f = setup([{ size: 50, min: 80, max: 110 }, { size: 50, min: 70, max: 120 }]);
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    const h = handle(f);
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 140);
    expect(values.at(-1)?.[0]).toBeCloseTo(55);
    f.detectChanges();
    expect(handle(f).getAttribute('aria-valuemin')).toBe('40');
    expect(Number(handle(f).getAttribute('aria-valuemax'))).toBeCloseTo(55);
  });

  it('starts one pointer session, previews one proposal, then restores rejected layout', () => {
    const f = setup();
    const h = handle(f);
    const capture = vi.fn();
    const release = vi.fn();
    Object.defineProperties(h, {
      setPointerCapture: { configurable: true, value: capture },
      hasPointerCapture: { configurable: true, value: () => true },
      releasePointerCapture: { configurable: true, value: release },
    });
    const starts: number[][] = [], live: number[][] = [], proposals: number[][] = [];
    f.componentInstance.resizeStart.subscribe((v) => starts.push([...v]));
    f.componentInstance.resize.subscribe((v) => live.push([...v]));
    f.componentInstance.sizesChange.subscribe((v) => proposals.push([...v]));
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 120);
    f.detectChanges();
    expect(capture).toHaveBeenCalledWith(1);
    expect(starts).toEqual([[50, 50]]);
    expect(live).toEqual([[60, 40]]);
    expect(proposals).toEqual([[60, 40]]);
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('60%');
    pointer(h, 'pointerup', 120);
    f.detectChanges();
    expect(release).toHaveBeenCalledWith(1);
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('50%');
    expect(proposals).toHaveLength(1);
  });

  it('cancels a pointer preview and releases capture on destroy', () => {
    const f = setup();
    const h = handle(f);
    const release = vi.fn();
    Object.defineProperties(h, {
      setPointerCapture: { configurable: true, value: vi.fn() },
      hasPointerCapture: { configurable: true, value: () => true },
      releasePointerCapture: { configurable: true, value: release },
    });
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 120);
    pointer(h, 'pointercancel', 120);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('50%');
    pointer(h, 'pointerdown', 100);
    f.destroy();
    expect(release).toHaveBeenCalledTimes(2);
  });

  it('uses RTL pointer sign and only resizes the adjacent pair', () => {
    const f = setup([{ size: 30 }, { size: 40 }, { size: 30 }]);
    f.nativeElement.style.direction = 'rtl';
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    const h = handle(f, 1);
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 120);
    expect(values).toEqual([[30, 30, 40]]);
  });

  it('does not emit a proposal when the pointer has not moved', () => {
    const f = setup();
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    const h = handle(f);
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 100);
    pointer(h, 'pointerup', 100);
    expect(values).toEqual([]);
  });

  it('converts vertical pointer movement using container height', () => {
    const f = setup();
    f.componentRef.setInput('orientation', 'vertical');
    f.detectChanges();
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    const h = handle(f);
    pointer(h, 'pointerdown', 0, 100);
    pointer(h, 'pointermove', 0, 120);
    expect(values).toEqual([[60, 40]]);
  });

  it('increases the logical start pane for a physical left drag in RTL', () => {
    const f = setup();
    f.nativeElement.style.direction = 'rtl';
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    const h = handle(f);
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 80);
    expect(values).toEqual([[60, 40]]);
  });

  it('keeps an accepted pointer proposal after its preview ends', () => {
    const f = setup();
    f.componentInstance.sizesChange.subscribe((v) => {
      f.componentRef.setInput('panes', v.map((size) => ({ size })));
    });
    const h = handle(f);
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 120);
    f.detectChanges();
    pointer(h, 'pointerup', 120);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('60%');
  });

  it('clamps a pointer proposal to the pixel minimum of the logical start pane', () => {
    const f = setup([{ size: 50, min: 80 }, { size: 50 }]);
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    const h = handle(f);
    pointer(h, 'pointerdown', 100);
    pointer(h, 'pointermove', 0);
    expect(values).toEqual([[40, 60]]);
  });

  it('never echoes a parent-only panes replacement', () => {
    const f = setup();
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    f.componentRef.setInput('panes', [{ size: 20 }, { size: 80 }]);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-splitter__pane').style.flexBasis).toBe('20%');
    expect(values).toEqual([]);
  });

  it('ignores non-arrow keys, secondary pointer buttons and exposes no collapse owner', () => {
    const f = setup();
    const values: number[][] = [];
    f.componentInstance.sizesChange.subscribe((v) => values.push([...v]));
    key(handle(f), 'Tab');
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(event, { button: { value: 2 }, pointerId: { value: 1 } });
    handle(f).dispatchEvent(event);
    expect(values).toEqual([]);
    expect('collapsed' in f.componentInstance).toBe(false);
    expect('collapse' in f.componentInstance).toBe(false);
  });
});
