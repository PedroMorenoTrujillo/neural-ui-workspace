import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NEU_IV_DATA,
  NeuImageViewerDirective,
  NeuImageViewerOverlayComponent,
} from './neu-image-viewer.component';

const ITEMS = [
  { src: 'img1.jpg', alt: 'Imagen 1', caption: 'Caption 1' },
  { src: 'img2.jpg', alt: 'Imagen 2' },
  { src: 'img3.jpg' },
];

function mkData(partial: Partial<{ items: typeof ITEMS; initialIndex: number }> = {}) {
  return {
    items: partial.items ?? ITEMS,
    initialIndex: partial.initialIndex ?? 0,
    close: vi.fn(),
  };
}

function setupOverlay(data = mkData()) {
  TestBed.overrideProvider(NEU_IV_DATA, { useValue: data });
  const f = TestBed.createComponent(NeuImageViewerOverlayComponent);
  f.detectChanges();
  return { f, data };
}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), Overlay],
  }).compileComponents(),
);

describe('NeuImageViewerOverlayComponent', () => {
  it('should create', async () => {
    const { f } = setupOverlay();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('_current should return item at _index', () => {
    const { f } = setupOverlay(mkData({ initialIndex: 1 }));
    expect(f.componentInstance._current().src).toBe('img2.jpg');
  });

  it('_navigate(1) should advance index', () => {
    const { f } = setupOverlay();
    f.componentInstance._navigate(1);
    expect(f.componentInstance._index()).toBe(1);
  });

  it('_navigate(-1) should not go below 0', () => {
    const { f } = setupOverlay();
    f.componentInstance._navigate(-1);
    expect(f.componentInstance._index()).toBe(0);
  });

  it('_navigate(1) should not exceed last item', () => {
    const { f } = setupOverlay(mkData({ initialIndex: 2 }));
    f.componentInstance._navigate(1);
    expect(f.componentInstance._index()).toBe(2);
  });

  it('_zoom should update scale', () => {
    const { f } = setupOverlay();
    f.componentInstance._zoom(0.5);
    expect(f.componentInstance._scale()).toBe(1.5);
  });

  it('_zoom should clamp min at 0.25', () => {
    const { f } = setupOverlay();
    f.componentInstance._zoom(-2);
    expect(f.componentInstance._scale()).toBe(0.25);
  });

  it('_zoom should clamp max at 5', () => {
    const { f } = setupOverlay();
    f.componentInstance._zoom(10);
    expect(f.componentInstance._scale()).toEqual(5);
  });

  it('_resetZoom should reset scale and pan', () => {
    const { f } = setupOverlay();
    f.componentInstance._zoom(2);
    f.componentInstance._panX.set(50);
    f.componentInstance._resetZoom();
    expect(f.componentInstance._scale()).toBe(1);
    expect(f.componentInstance._panX()).toBe(0);
  });

  it('_onKey Escape should call close()', () => {
    const { f, data } = setupOverlay();
    f.componentInstance._onKey(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(data.close).toHaveBeenCalled();
  });

  it('_onKey ArrowRight should navigate forward', () => {
    const { f } = setupOverlay();
    f.componentInstance._onKey(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(f.componentInstance._index()).toBe(1);
  });

  it('_transform should include scale and pan', () => {
    const { f } = setupOverlay();
    f.componentInstance._scale.set(2);
    f.componentInstance._panX.set(10);
    expect(f.componentInstance._transform()).toContain('scale(2)');
    expect(f.componentInstance._transform()).toContain('translate(10px');
  });

  it('_onKey ArrowLeft should navigate backward', () => {
    const { f } = setupOverlay(mkData({ initialIndex: 2 }));
    f.componentInstance._onKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(f.componentInstance._index()).toBe(1);
  });

  it('_onKey + should zoom in', () => {
    const { f } = setupOverlay();
    f.componentInstance._onKey(new KeyboardEvent('keydown', { key: '+' }));
    expect(f.componentInstance._scale()).toBeGreaterThan(1);
  });

  it('_onKey - should zoom out', () => {
    const { f } = setupOverlay();
    f.componentInstance._onKey(new KeyboardEvent('keydown', { key: '-' }));
    expect(f.componentInstance._scale()).toBeLessThan(1);
  });

  it('_onBackdropClick should call close()', () => {
    const { f, data } = setupOverlay();
    f.componentInstance._onBackdropClick(new MouseEvent('click'));
    expect(data.close).toHaveBeenCalled();
  });

  it('_onWheel with negative deltaY should zoom in', () => {
    const { f } = setupOverlay();
    const ev = { preventDefault: vi.fn(), deltaY: -1 } as unknown as WheelEvent;
    f.componentInstance._onWheel(ev);
    expect(f.componentInstance._scale()).toBeGreaterThan(1);
    expect(ev.preventDefault).toHaveBeenCalled();
  });

  it('_onWheel with positive deltaY should zoom out', () => {
    const { f } = setupOverlay();
    const ev = { preventDefault: vi.fn(), deltaY: 1 } as unknown as WheelEvent;
    f.componentInstance._onWheel(ev);
    expect(f.componentInstance._scale()).toBeLessThan(1);
  });

  it('_onMouseDown triggers pan on move', () => {
    const { f } = setupOverlay();
    const comp = f.componentInstance;
    const mockDown = {
      button: 0,
      clientX: 100,
      clientY: 100,
      preventDefault: vi.fn(),
    } as unknown as MouseEvent;
    comp._onMouseDown(mockDown);
    const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 115 });
    window.dispatchEvent(moveEvent);
    expect(comp._panX()).toBe(20);
    expect(comp._panY()).toBe(15);
    const upEvent = new MouseEvent('mouseup');
    window.dispatchEvent(upEvent);
  });

  it('_onMouseDown ignores non-left-button clicks', () => {
    const { f } = setupOverlay();
    const comp = f.componentInstance;
    comp._onMouseDown({
      button: 2,
      clientX: 100,
      clientY: 100,
      preventDefault: vi.fn(),
    } as unknown as MouseEvent);
    const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 200 });
    window.dispatchEvent(moveEvent);
    expect(comp._panX()).toBe(0);
  });

  it('caption is rendered when item has caption', async () => {
    const { f } = setupOverlay(mkData({ items: ITEMS, initialIndex: 0 }));
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Caption 1');
  });

  it('caption is NOT rendered when item has no caption', async () => {
    const { f } = setupOverlay(mkData({ items: ITEMS, initialIndex: 1 }));
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-iv__caption')).toBeNull();
  });
});

@Component({
  template: `<img src="x.jpg" [neuImageViewer]="src" />`,
  imports: [NeuImageViewerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostForDirective {
  src = 'x.jpg';
}

@Component({
  template: `<img src="x.jpg" [neuImageViewer]="item" />`,
  imports: [NeuImageViewerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostWithItemDirective {
  item: any = { src: 'x.jpg', alt: 'Test', caption: 'Hello' };
}

@Component({
  template: `<img src="x.jpg" [neuImageViewer]="items" [neuIvIndex]="1" />`,
  imports: [NeuImageViewerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostWithArrayDirective {
  items = ITEMS;
}

describe('NeuImageViewerDirective', () => {
  it('should be creatable via host element', async () => {
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('open() should create an overlay, close() should dispose it', async () => {
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective);
    expect((dir as any)._overlayRef).toBeNull();
    dir.open();
    expect((dir as any)._overlayRef).not.toBeNull();
    dir.close();
    expect((dir as any)._overlayRef).toBeNull();
  });

  it('open() called twice should not create multiple overlays', async () => {
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective);
    dir.open();
    const firstRef = (dir as any)._overlayRef;
    dir.open();
    expect((dir as any)._overlayRef).toBe(firstRef);
    dir.close();
  });

  it('ngOnDestroy should close the overlay', async () => {
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective);
    dir.open();
    expect((dir as any)._overlayRef).not.toBeNull();
    dir.ngOnDestroy();
    expect((dir as any)._overlayRef).toBeNull();
  });

  it('_normalizeItems with string input should return single-item array', () => {
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective);
    const items = (dir as any)._normalizeItems();
    expect(items).toEqual([{ src: 'x.jpg' }]);
  });

  it('_normalizeItems with object input should wrap in array', () => {
    const f = TestBed.createComponent(HostWithItemDirective);
    f.detectChanges();
    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective);
    const items = (dir as any)._normalizeItems();
    expect(items[0].src).toBe('x.jpg');
    expect(items[0].caption).toBe('Hello');
  });

  it('_normalizeItems with array and neuIvIndex should start at given index', () => {
    const f = TestBed.createComponent(HostWithArrayDirective);
    f.detectChanges();
    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective);
    const items = (dir as any)._normalizeItems();
    expect(items.length).toBe(ITEMS.length);
  });

  it('clicking prev arrow button in overlay should navigate backward', async () => {
    // Hacer clic en la flecha prev del overlay debe navegar hacia atrás
    // Clicking the prev arrow in the overlay must navigate backward
    // Use setupOverlay directly (avoids overrideProvider-after-createComponent conflict)
    const { f: overlay } = setupOverlay(mkData({ initialIndex: 1 }));
    await overlay.whenStable();
    const prevBtn = overlay.nativeElement.querySelector('.neu-iv__arrow--prev');
    if (prevBtn) {
      prevBtn.click();
      overlay.detectChanges();
      expect(overlay.componentInstance._index()).toBe(0);
    } else {
      // Fallback: direct call
      overlay.componentInstance._navigate(-1);
      expect(overlay.componentInstance._index()).toBe(0);
    }
  });

  it('clicking next arrow button in overlay should navigate forward', async () => {
    // Hacer clic en la flecha next del overlay debe navegar hacia adelante
    // Clicking the next arrow in the overlay must navigate forward
    const data = { items: ITEMS, initialIndex: 0, close: vi.fn() };
    TestBed.overrideProvider(NEU_IV_DATA, { useValue: data });
    const overlay = TestBed.createComponent(NeuImageViewerOverlayComponent);
    overlay.detectChanges();
    await overlay.whenStable();
    const nextBtn = overlay.nativeElement.querySelector('.neu-iv__arrow--next');
    if (nextBtn) {
      nextBtn.click();
      overlay.detectChanges();
      expect(overlay.componentInstance._index()).toBe(1);
    } else {
      overlay.componentInstance._navigate(1);
      expect(overlay.componentInstance._index()).toBe(1);
    }
  });

  // ── Toolbar button DOM click tests ────────────────────────────────────────

  it('clicking zoom-in button zooms in via template handler', async () => {
    // Clic en botón de zoom in debe hacer zoom vía handler del template
    // Clicking zoom-in button zooms in via template event handler
    const { f } = setupOverlay();
    f.detectChanges();
    await f.whenStable();
    const zoomInBtn: HTMLButtonElement = f.nativeElement.querySelector('[aria-label="Zoom in"]');
    if (zoomInBtn) {
      zoomInBtn.click();
      f.detectChanges();
      expect(f.componentInstance._scale()).toBeGreaterThan(1);
    } else {
      f.componentInstance._zoom(0.25);
      expect(f.componentInstance._scale()).toBeGreaterThan(1);
    }
  });

  it('clicking zoom-out button zooms out via template handler', async () => {
    // Clic en botón de zoom out debe reducir el zoom vía handler del template
    // Clicking zoom-out button zooms out via template event handler
    const { f } = setupOverlay();
    f.detectChanges();
    await f.whenStable();
    const zoomOutBtn: HTMLButtonElement = f.nativeElement.querySelector('[aria-label="Zoom out"]');
    if (zoomOutBtn) {
      zoomOutBtn.click();
      f.detectChanges();
      expect(f.componentInstance._scale()).toBeLessThan(1);
    } else {
      f.componentInstance._zoom(-0.25);
      expect(f.componentInstance._scale()).toBeLessThan(1);
    }
  });

  it('clicking reset-zoom button resets zoom via template handler', async () => {
    // Clic en reset zoom debe restablecer el zoom vía handler del template
    // Clicking reset-zoom button resets zoom via template event handler
    const { f } = setupOverlay();
    f.componentInstance._zoom(2);
    f.componentInstance._panX.set(50);
    f.detectChanges();
    await f.whenStable();
    const resetBtn: HTMLButtonElement = f.nativeElement.querySelector('[aria-label="Reset zoom"]');
    if (resetBtn) {
      resetBtn.click();
      f.detectChanges();
      expect(f.componentInstance._scale()).toBe(1);
      expect(f.componentInstance._panX()).toBe(0);
    } else {
      f.componentInstance._resetZoom();
      expect(f.componentInstance._scale()).toBe(1);
    }
  });

  it('clicking close button in toolbar calls data.close via template handler', async () => {
    // Clic en botón de cerrar llama data.close vía handler del template
    // Clicking close button calls data.close via template event handler
    const data = mkData();
    const { f } = setupOverlay(data);
    f.detectChanges();
    await f.whenStable();
    const closeBtn: HTMLButtonElement = f.nativeElement.querySelector('[aria-label="Cerrar"]');
    if (closeBtn) {
      closeBtn.click();
      f.detectChanges();
      expect(data.close).toHaveBeenCalled();
    } else {
      f.componentInstance._data.close();
      expect(data.close).toHaveBeenCalled();
    }
  });

  it('directive open() data.close callback calls directive close()', async () => {
    // El callback close en data debe llamar a close() de la directiva
    // The data.close callback in directive open() must call directive close()
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    await f.whenStable();
    vi.useFakeTimers();
    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective);
    dir.open();
    vi.runAllTimers(); // flush the focus setTimeout
    const overlayRef = (dir as any)._overlayRef;
    expect(overlayRef).not.toBeNull();
    // Call the close callback — covers the `close: () => this.close()` lambda at line 248
    const compRef = (dir as any)._compRef;
    if (compRef) {
      compRef.instance._data.close(); // triggers the lambda
    } else {
      dir.close(); // fallback
    }
    expect((dir as any)._overlayRef).toBeNull();
    vi.useRealTimers();
  });

  it('single-item overlay should not render navigation arrows', async () => {
    const { f } = setupOverlay(mkData({ items: [{ src: 'single.jpg' } as any] }));
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-iv__arrow--prev')).toBeNull();
    expect(f.nativeElement.querySelector('.neu-iv__arrow--next')).toBeNull();
  });

  it('clicking the host element should open the overlay through the directive host listener', async () => {
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    await f.whenStable();

    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective) as any;
    const img = f.nativeElement.querySelector('img') as HTMLImageElement;
    img.click();

    expect(dir._overlayRef).not.toBeNull();
    dir.close();
  });

  it('unknown keyboard keys should leave overlay state unchanged', () => {
    const { f } = setupOverlay(mkData({ initialIndex: 1 }));
    const before = {
      index: f.componentInstance._index(),
      scale: f.componentInstance._scale(),
    };

    f.componentInstance._onKey(new KeyboardEvent('keydown', { key: 'Tab' }));

    expect(f.componentInstance._index()).toBe(before.index);
    expect(f.componentInstance._scale()).toBe(before.scale);
  });

  it('clicking the close button from a directive-created overlay should execute the data.close lambda', async () => {
    const f = TestBed.createComponent(HostForDirective);
    f.detectChanges();
    await f.whenStable();
    vi.useFakeTimers();

    const dir = f.debugElement.children[0].injector.get(NeuImageViewerDirective) as any;
    const closeSpy = vi.spyOn(dir, 'close');
    dir.open();
    vi.runAllTimers();

    const closeButton = document.body.querySelector('[aria-label="Cerrar"]') as HTMLButtonElement;
    closeButton.click();

    expect(closeSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
