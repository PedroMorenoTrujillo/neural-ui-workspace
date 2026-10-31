import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { observeDialogViewport } from './neu-dialog-viewport';

class ViewportFake extends EventTarget {
  width = 390;
  height = 844;
  offsetTop = 0;
  offsetLeft = 0;
}

describe('dialog visual viewport', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
  afterEach(() => {
    if (original) Object.defineProperty(window, 'visualViewport', original);
    else Reflect.deleteProperty(window, 'visualViewport');
  });

  it('tracks keyboard resizing and panning without depending on the layout viewport', () => {
    const viewport = new ViewportFake();
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    const open = signal(false);
    const bounds = TestBed.runInInjectionContext(() => observeDialogViewport(open, document));
    TestBed.tick();
    expect(bounds()).toBeNull();
    open.set(true);
    TestBed.tick();
    expect(bounds()).toEqual({ top: 0, left: 0, width: 390, height: 844 });
    viewport.height = 390;
    viewport.offsetTop = 120;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toEqual({ top: 120, left: 0, width: 390, height: 390 });
    viewport.offsetTop = 160;
    viewport.offsetLeft = 12;
    viewport.dispatchEvent(new Event('scroll'));
    expect(bounds()).toEqual({ top: 160, left: 12, width: 390, height: 390 });
  });

  it('removes listeners on close and destroy and reads fresh geometry on reopen', () => {
    const viewport = new ViewportFake();
    const remove = vi.spyOn(viewport, 'removeEventListener');
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    const open = signal(true);
    const bounds = TestBed.runInInjectionContext(() => observeDialogViewport(open, document));
    TestBed.tick();
    open.set(false);
    TestBed.tick();
    expect(remove).toHaveBeenCalledTimes(2);
    viewport.height = 375;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toBeNull();
    open.set(true);
    TestBed.tick();
    expect(bounds()?.height).toBe(375);
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledTimes(4);
  });

  it('preserves the CSS fallback during SSR and without the visual viewport API', () => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
    const open = signal(true);
    const browser = TestBed.runInInjectionContext(() => observeDialogViewport(open, document));
    const server = TestBed.runInInjectionContext(() =>
      observeDialogViewport(open, { defaultView: null }),
    );
    TestBed.tick();
    expect(browser()).toBeNull();
    expect(server()).toBeNull();
  });

  it('discards invalid geometry and clamps overscroll offsets', () => {
    const viewport = new ViewportFake();
    viewport.width = 0;
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    const bounds = TestBed.runInInjectionContext(() =>
      observeDialogViewport(signal(true), document),
    );
    TestBed.tick();
    expect(bounds()).toBeNull();
    viewport.width = 390;
    viewport.offsetTop = -8;
    viewport.offsetLeft = -4;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toEqual({ top: 0, left: 0, width: 390, height: 844 });
    viewport.height = Number.NaN;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toBeNull();
  });
});
