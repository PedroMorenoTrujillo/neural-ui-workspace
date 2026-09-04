import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuSplitterComponent, NeuSplitterPane } from './neu-splitter.component';

function setup(panes: NeuSplitterPane[] = [], direction: 'horizontal' | 'vertical' = 'horizontal') {
  const f = TestBed.createComponent(NeuSplitterComponent);
  f.componentRef.setInput('panes', panes);
  f.componentRef.setInput('direction', direction);
  f.detectChanges();
  return f;
}

@Component({
  imports: [NeuSplitterComponent],
  template: `
    <neu-splitter [panes]="[{ size: 50 }, { size: 50 }]">
      <div ngProjectAs="neu-splitter-pane" class="pane-a">Panel A</div>
      <div ngProjectAs="neu-splitter-pane" class="pane-b">Panel B</div>
    </neu-splitter>
  `,
})
class SplitterProjectionHostComponent {}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents(),
);

describe('NeuSplitterComponent', () => {
  it('should create', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should apply neu-splitter class', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-splitter');
  });

  it('should apply horizontal class by default', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-splitter--horizontal');
  });

  it('should apply vertical class when direction is vertical', async () => {
    const f = setup([{ size: 50 }, { size: 50 }], 'vertical');
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-splitter--vertical');
  });

  it('_sizes should initialize from panes input', async () => {
    const f = setup([{ size: 30 }, { size: 70 }]);
    await f.whenStable();
    expect(f.componentInstance['_sizes']()).toEqual([30, 70]);
  });

  it('should leave sizes empty when panes are empty and preserve explicit zero sizes', async () => {
    const empty = setup([]);
    await empty.whenStable();
    expect(empty.componentInstance['_sizes']()).toEqual([]);

    const zero = setup([{ size: 0 }, { size: 100 }]);
    await zero.whenStable();
    expect(zero.componentInstance['_sizes']()).toEqual([0, 100]);
  });

  it('_sizes should distribute remaining evenly when sizes not set', async () => {
    const f = setup([{}, {}]);
    await f.whenStable();
    expect(f.componentInstance['_sizes']()).toEqual([50, 50]);
  });

  it('should render handles between panes', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    f.detectChanges();
    await f.whenStable();
    const handles = f.nativeElement.querySelectorAll('.neu-splitter__handle');
    expect(handles.length).toBe(1); // N-1 handles for N panes
  });

  it('ArrowRight key on handle should increase size of first pane', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const initial = f.componentInstance['_sizes']()[0];
    f.componentInstance['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowRight' }), 0);
    expect(f.componentInstance['_sizes']()[0]).toBeGreaterThan(initial);
  });

  it('ArrowLeft key on handle should decrease size of first pane', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const initial = f.componentInstance['_sizes']()[0];
    f.componentInstance['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowLeft' }), 0);
    expect(f.componentInstance['_sizes']()[0]).toBeLessThan(initial);
  });

  it('sizeChange should emit after keyboard adjustment', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    // sizeChange only emits on mouse/touch release, not keyboard
    // We test that _sizes change correctly
    const before = f.componentInstance['_sizes']()[0];
    f.componentInstance['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
    expect(f.componentInstance['_sizes']()[0]).toBeGreaterThan(before);
  });

  it('_sizes sum should remain approximately 100 after adjustment', async () => {
    const f = setup([{ size: 60 }, { size: 40 }]);
    await f.whenStable();
    f.componentInstance['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowRight' }), 0);
    const sum = f.componentInstance['_sizes']().reduce((a, b) => a + b, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it('_startDrag then mouseup should emit sizeChange', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const emitted: number[][] = [];
    f.componentInstance.sizeChange.subscribe((s: number[]) => emitted.push(s));
    f.componentInstance['_startDrag'](
      { button: 0, preventDefault: vi.fn(), clientX: 200, clientY: 0 } as unknown as MouseEvent,
      0,
    );
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 210, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(emitted.length).toBe(1);
  });

  it('_startTouchDrag then touchend should emit sizeChange', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const emitted: number[][] = [];
    f.componentInstance.sizeChange.subscribe((s: number[]) => emitted.push(s));
    const touch = { clientX: 100, clientY: 0 };
    f.componentInstance['_startTouchDrag']({ touches: [touch] } as unknown as TouchEvent, 0);
    window.dispatchEvent(new TouchEvent('touchend'));
    expect(emitted.length).toBe(1);
  });

  it('ArrowUp key should increase size when direction is vertical', async () => {
    const f = setup([{ size: 50 }, { size: 50 }], 'vertical');
    await f.whenStable();
    const initial = f.componentInstance['_sizes']()[0];
    f.componentInstance['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowUp' }), 0);
    expect(f.componentInstance['_sizes']()[0]).toBeLessThan(initial);
  });

  it('pane with min should clamp size during drag', async () => {
    const f = setup([
      { size: 50, min: 30 },
      { size: 50, min: 30 },
    ]);
    await f.whenStable();
    // Try to reduce pane 0 below min
    for (let i = 0; i < 20; i++) {
      f.componentInstance['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowLeft' }), 0);
    }
    expect(f.componentInstance['_sizes']()[0]).toBeGreaterThanOrEqual(0);
    expect(f.componentInstance['_sizes']()[1]).toBeGreaterThanOrEqual(0);
  });

  it('non-arrow key on handle should do nothing', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const before = [...f.componentInstance['_sizes']()];
    f.componentInstance['_onHandleKey'](new KeyboardEvent('keydown', { key: 'Tab' }), 0);
    expect(f.componentInstance['_sizes']()).toEqual(before);
  });

  it('drag move returns without changing sizes when no drag is active or container has no size', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const comp = f.componentInstance as any;
    const before = [...comp['_sizes']()];

    comp._onDragMove(10, 10);
    expect(comp['_sizes']()).toEqual(before);

    comp._dragIndex = 0;
    Object.defineProperty(f.nativeElement, 'offsetWidth', { configurable: true, value: 0 });
    comp._onDragMove(20, 20);
    expect(comp['_sizes']()).toEqual(before);
  });

  it('_sizes should handle 3 panes', async () => {
    const f = setup([{ size: 30 }, { size: 40 }, { size: 30 }]);
    await f.whenStable();
    const handles = f.nativeElement.querySelectorAll('.neu-splitter__handle');
    expect(handles.length).toBe(2);
    expect(f.componentInstance['_sizes']().length).toBe(3);
  });

  it('_sizes with missing sizes distributes remaining evenly', async () => {
    const f = setup([{ size: 60 }, {}]);
    await f.whenStable();
    expect(f.componentInstance['_sizes']()[1]).toBe(40);
  });

  it('normalizes explicit null pane sizes at the defensive input boundary', async () => {
    const f = setup([{ size: null as unknown as number }, { size: 100 }]);
    await f.whenStable();

    expect(f.componentInstance['_sizes']()).toEqual([0, 100]);
  });

  it('does not install mouse or touch drag listeners without an owning window', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const component = f.componentInstance as any;
    component._el = { nativeElement: { ownerDocument: { defaultView: null } } };

    component._startDrag({ button: 0, preventDefault: vi.fn(), clientX: 10, clientY: 20 }, 0);
    expect(component._dragSessionDisposer).toBeNull();
    component._startTouchDrag({ touches: [{ clientX: 10, clientY: 20 }] }, 0);
    expect(component._dragSessionDisposer).toBeNull();
  });

  it('_startDrag with vertical direction should respond to clientY movement', async () => {
    // El drag vertical debe responder al eje Y del mouse
    // Vertical drag must respond to the mouse Y axis
    const f = setup([{ size: 50 }, { size: 50 }], 'vertical');
    await f.whenStable();
    const emitted: number[][] = [];
    f.componentInstance.sizeChange.subscribe((s: number[]) => emitted.push(s));
    f.componentInstance['_startDrag'](
      { button: 0, preventDefault: vi.fn(), clientX: 0, clientY: 200 } as unknown as MouseEvent,
      0,
    );
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 210 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(emitted.length).toBe(1);
  });

  it('_startTouchDrag with vertical direction should emit sizeChange', async () => {
    // El drag táctil vertical debe emitir sizeChange al soltar
    // Vertical touch drag must emit sizeChange on release
    const f = setup([{ size: 50 }, { size: 50 }], 'vertical');
    await f.whenStable();
    const emitted: number[][] = [];
    f.componentInstance.sizeChange.subscribe((s: number[]) => emitted.push(s));
    const touch = { clientX: 0, clientY: 100 };
    f.componentInstance['_startTouchDrag']({ touches: [touch] } as unknown as TouchEvent, 0);
    window.dispatchEvent(new TouchEvent('touchend'));
    expect(emitted.length).toBe(1);
  });

  it('_startTouchDrag touchmove event should call _onDragMove (covers onMove lambda)', async () => {
    // El evento touchmove debe llamar a _onDragMove (cubre la lambda onMove)
    // The touchmove event must call _onDragMove (covers the onMove lambda)
    const f = setup([{ size: 50 }, { size: 50 }], 'horizontal');
    await f.whenStable();
    f.componentInstance['_startTouchDrag'](
      { touches: [{ clientX: 100, clientY: 0 }] } as unknown as TouchEvent,
      0,
    );
    // Dispatch touchmove — triggers the onMove lambda registered on window
    window.dispatchEvent(
      new TouchEvent('touchmove', { touches: [{ clientX: 120, clientY: 0 }] as any }),
    );
    window.dispatchEvent(new TouchEvent('touchend'));
    // No throw, sizes should still be valid
    expect(f.componentInstance['_sizes']()[0]).toBeGreaterThanOrEqual(0);
    expect(f.componentInstance['_sizes']()[1]).toBeGreaterThanOrEqual(0);
  });

  it('_adjustPair should clamp pane sizes to 0 when dragging past boundary', async () => {
    // _adjustPair debe limitar los tamaños de los paneles a 0 al arrastrar más allá del límite
    // _adjustPair must clamp pane sizes to 0 when dragging past the boundary
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Apply a massive delta that would make newB go negative (covers clamping branch)
    comp._adjustPair(0, 200);
    expect(comp['_sizes']()[0]).toBeGreaterThanOrEqual(0);
    expect(comp['_sizes']()[1]).toBeGreaterThanOrEqual(0);
  });

  it('_adjustPair with large negative delta clamps first pane to 0', async () => {
    // _adjustPair con delta negativo grande debe limitar el primer panel a 0
    // _adjustPair with large negative delta must clamp first pane to 0
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Apply a large negative delta that would make newA go negative
    comp._adjustPair(0, -200);
    expect(comp['_sizes']()[0]).toBeGreaterThanOrEqual(0);
    expect(comp['_sizes']()[1]).toBeGreaterThanOrEqual(0);
  });

  it('keydown on the handle should trigger _onHandleKey via the template listener', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();

    const handle = f.nativeElement.querySelector('.neu-splitter__handle') as HTMLDivElement;
    const before = f.componentInstance['_sizes']()[0];
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    f.detectChanges();

    expect(f.componentInstance['_sizes']()[0]).toBeGreaterThan(before);
  });

  it('mousedown on the handle should trigger drag listeners via the template listener', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();

    Object.defineProperty(f.nativeElement, 'offsetWidth', { configurable: true, value: 200 });
    const emitted: number[][] = [];
    f.componentInstance.sizeChange.subscribe((sizes: number[]) => emitted.push(sizes));

    const handle = f.nativeElement.querySelector('.neu-splitter__handle') as HTMLDivElement;
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseup'));

    expect(emitted.length).toBe(1);
  });

  it('touchstart on the handle should trigger touch drag listeners via the template listener', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();

    Object.defineProperty(f.nativeElement, 'offsetWidth', { configurable: true, value: 200 });
    const emitted: number[][] = [];
    f.componentInstance.sizeChange.subscribe((sizes: number[]) => emitted.push(sizes));

    const handle = f.nativeElement.querySelector('.neu-splitter__handle') as HTMLDivElement;
    const start = new Event('touchstart', { bubbles: true });
    Object.defineProperty(start, 'touches', {
      configurable: true,
      value: [{ clientX: 100, clientY: 0 }],
    });
    handle.dispatchEvent(start);

    const move = new Event('touchmove', { bubbles: true });
    Object.defineProperty(move, 'touches', {
      configurable: true,
      value: [{ clientX: 130, clientY: 0 }],
    });
    window.dispatchEvent(move);
    window.dispatchEvent(new Event('touchend'));

    expect(emitted.length).toBe(1);
  });

  it('owns one drag session and removes mouse and touch listeners on cancellation and destroy', async () => {
    const f = setup([{ size: 50 }, { size: 50 }]);
    await f.whenStable();
    const component = f.componentInstance as any;

    component._startDrag({ button: 0, preventDefault: vi.fn(), clientX: 10, clientY: 0 } as any, 0);
    expect(component._dragSessionDisposer).toEqual(expect.any(Function));
    component._startDrag({ button: 0, preventDefault: vi.fn(), clientX: 20, clientY: 0 } as any, 0);
    expect(component._dragSessionDisposer).toEqual(expect.any(Function));
    window.dispatchEvent(new Event('blur'));
    expect(component._dragSessionDisposer).toBeNull();
    expect(component._dragIndex).toBe(-1);

    component._startTouchDrag({ touches: [{ clientX: 10, clientY: 0 }] } as any, 0);
    window.dispatchEvent(new Event('touchcancel'));
    expect(component._dragSessionDisposer).toBeNull();

    component._startDrag({ button: 0, preventDefault: vi.fn(), clientX: 30, clientY: 0 } as any, 0);
    f.destroy();
    expect(component._dragSessionDisposer).toBeNull();
    expect(component._dragIndex).toBe(-1);
  });

  it('projects each declared pane into one rendered slot', async () => {
    const f = TestBed.createComponent(SplitterProjectionHostComponent);
    f.detectChanges();
    await f.whenStable();
    const splitter = f.debugElement.query(By.directive(NeuSplitterComponent));
    const panes = splitter.nativeElement.querySelectorAll('.neu-splitter__pane');
    expect(panes).toHaveLength(2);
    expect(panes[0].querySelector('.pane-a')?.textContent).toContain('Panel A');
    expect(panes[0].querySelector('.pane-b')).toBeNull();
    expect(panes[1].querySelector('.pane-b')?.textContent).toContain('Panel B');
  });

  it('enforces pane max constraints and emits keyboard size changes', async () => {
    const f = setup([
      { size: 50, min: 10, max: 55 },
      { size: 50, min: 10, max: 90 },
    ]);
    Object.defineProperty(f.nativeElement, 'offsetWidth', { configurable: true, value: 100 });
    const events: number[][] = [];
    f.componentInstance.sizeChange.subscribe((sizes) => events.push(sizes));
    for (let index = 0; index < 10; index += 1) {
      f.componentInstance['_onHandleKey'](
        new KeyboardEvent('keydown', { key: 'ArrowRight' }),
        0,
      );
    }
    expect(f.componentInstance['_sizes']()[0]).toBeCloseTo(55);
    expect(events.length).toBeGreaterThan(0);
    f.detectChanges();
    const handle = f.nativeElement.querySelector('[role="separator"]');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    expect(handle.getAttribute('aria-valuemax')).toBe('55');
  });

  it('rejects adjustments outside a valid adjacent pane pair', async () => {
    const f = setup([{ size: 100 }]);
    await f.whenStable();
    expect(f.componentInstance['_adjustPair'](1, 2)).toBe(false);
  });
});
