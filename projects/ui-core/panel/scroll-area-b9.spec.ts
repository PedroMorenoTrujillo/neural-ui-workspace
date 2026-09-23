import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuScrollAreaComponent } from './neu-panel.component';

function setup(enhanced = false, rtl = false) {
  const fixture = TestBed.createComponent(NeuScrollAreaComponent);
  fixture.componentRef.setInput('enhanced', enhanced);
  fixture.detectChanges();
  const viewport = fixture.nativeElement.querySelector('.neu-scroll-area__viewport') as HTMLDivElement;
  viewport.style.direction = rtl ? 'rtl' : 'ltr';
  Object.defineProperties(viewport, {
    scrollWidth: { configurable: true, value: 300 },
    clientWidth: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, value: 300 },
    clientHeight: { configurable: true, value: 100 },
  });
  return { fixture, viewport, area: fixture.componentInstance };
}

beforeEach(() => TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()],
}).compileComponents());

describe('NeuScrollArea logical B9 contract', () => {
  it('keeps native mode without decorative tracks or extra scrolling engine', () => {
    const { fixture, viewport } = setup();
    expect(viewport.classList).not.toContain('neu-scroll-area__viewport--enhanced');
    expect(fixture.nativeElement.querySelectorAll('[role="scrollbar"]')).toHaveLength(0);
    expect(viewport.id).toContain('neu-scroll-area-');
  });

  it('exposes normalized RTL logical left on position and scrollPositionChange', () => {
    const { area, viewport } = setup(false, true);
    (area as any).rtlScrollMode = 'negative';
    const changes: number[] = [];
    area.scrollPositionChange.subscribe((value) => changes.push(value.left));
    viewport.scrollLeft = -75;
    viewport.dispatchEvent(new Event('scroll'));
    expect(area.position().left).toBe(75);
    expect(changes).toEqual([75]);
  });

  it('writes clamped logical left through the native RTL coordinate', () => {
    const { area, viewport } = setup(false, true);
    (area as any).rtlScrollMode = 'negative';
    Object.defineProperty(viewport, 'scrollTo', {
      configurable: true, value: ({ left }: ScrollToOptions) => { viewport.scrollLeft = left ?? 0; },
    });
    area.scrollTo({ left: 50 });
    expect(viewport.scrollLeft).toBe(-50);
    expect(area.position().left).toBe(50);
    area.scrollTo({ left: 1000 });
    expect(viewport.scrollLeft).toBe(-200);
    area.scrollTo({ left: -50 });
    expect(viewport.scrollLeft).toBe(0);
  });

  it('maps horizontal Home/End to logical limits and arrows to physical direction', () => {
    const { area, viewport, fixture } = setup(true, true);
    (area as any).rtlScrollMode = 'negative';
    Object.defineProperty(viewport, 'scrollTo', {
      configurable: true, value: ({ left }: ScrollToOptions) => { viewport.scrollLeft = left ?? 0; },
    });
    area.scrollTo({ left: 100 });
    const bar = fixture.nativeElement.querySelector('.neu-scroll-area__bar--x') as HTMLElement;
    const press = (key: string) => bar.dispatchEvent(new KeyboardEvent('keydown', {
      key, bubbles: true, cancelable: true,
    }));
    press('ArrowRight');
    expect(area.position().left).toBe(60);
    press('ArrowLeft');
    expect(area.position().left).toBe(100);
    press('Home');
    expect(area.position().left).toBe(0);
    press('End');
    expect(area.position().left).toBe(200);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('200');
    expect(parseFloat((bar.querySelector('.neu-scroll-area__thumb') as HTMLElement).style.insetInlineStart))
      .toBeCloseTo(100 - area.thumbX());
  });

  it('keeps physical ArrowRight as increasing logical left in LTR', () => {
    const { area, viewport, fixture } = setup(true);
    Object.defineProperty(viewport, 'scrollTo', {
      configurable: true, value: ({ left }: ScrollToOptions) => { viewport.scrollLeft = left ?? 0; },
    });
    const bar = fixture.nativeElement.querySelector('.neu-scroll-area__bar--x') as HTMLElement;
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(area.position().left).toBe(40);
  });

  it('rebinds exactly one ResizeObserver when enhanced toggles and disconnects on destroy', async () => {
    const previous = window.ResizeObserver;
    const instances: Array<{ observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
    class Observer {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor() { instances.push(this); }
    }
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: Observer });
    try {
      const { area, fixture, viewport } = setup(false);
      await fixture.whenStable();
      expect(instances).toHaveLength(0);
      fixture.componentRef.setInput('enhanced', true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(instances).toHaveLength(1);
      expect(instances[0].observe).toHaveBeenCalledOnce();
      expect(instances[0].observe).toHaveBeenCalledWith(viewport);
      fixture.componentRef.setInput('enhanced', false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(instances[0].disconnect).toHaveBeenCalledOnce();
      fixture.componentRef.setInput('enhanced', true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(instances).toHaveLength(2);
      fixture.destroy();
      expect(instances[1].disconnect).toHaveBeenCalledOnce();
      expect(area.position().left).toBe(0);
    } finally {
      Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: previous });
    }
  });

  it('does not construct an observer under server platform', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const previous = window.ResizeObserver;
    const observer = vi.fn();
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: observer });
    try {
      const { fixture } = setup(true);
      expect(observer).not.toHaveBeenCalled();
      fixture.destroy();
    } finally {
      Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: previous });
    }
  });

  it('leaves zero observer residue across 50 create/destroy cycles', async () => {
    const previous = window.ResizeObserver;
    let active = 0;
    class Observer {
      private connected = false;
      observe() { this.connected = true; active += 1; }
      disconnect() { if (this.connected) { this.connected = false; active -= 1; } }
    }
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: Observer });
    try {
      for (let index = 0; index < 50; index++) {
        const { fixture } = setup(true);
        await fixture.whenStable();
        expect(active).toBe(1);
        fixture.destroy();
        expect(active).toBe(0);
      }
    } finally {
      Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: previous });
    }
  });
});
