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
    expect(bounds()).toEqual('');
    open.set(true);
    TestBed.tick();
    expect(bounds()).toEqual('inset:0px auto auto 0px;width:390px;height:844px');
    const unchanged = bounds();
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toBe(unchanged);
    viewport.height = 390;
    viewport.offsetTop = 120;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toEqual('inset:120px auto auto 0px;width:390px;height:390px');
    viewport.offsetTop = 160;
    viewport.offsetLeft = 12;
    viewport.dispatchEvent(new Event('scroll'));
    expect(bounds()).toEqual('inset:160px auto auto 12px;width:390px;height:390px');
    viewport.height = 180;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toContain('height:180px');
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
    expect(bounds()).toEqual('');
    open.set(true);
    TestBed.tick();
    expect(bounds()).toContain('height:375px');
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
    expect(browser()).toEqual('');
    expect(server()).toEqual('');
  });

  it('discards invalid geometry and clamps overscroll offsets', () => {
    const viewport = new ViewportFake();
    viewport.width = 0;
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    const bounds = TestBed.runInInjectionContext(() =>
      observeDialogViewport(signal(true), document),
    );
    TestBed.tick();
    expect(bounds()).toEqual('');
    viewport.width = 390;
    viewport.offsetTop = -8;
    viewport.offsetLeft = -4;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toEqual('inset:0px auto auto 0px;width:390px;height:844px');
    viewport.height = Number.NaN;
    viewport.dispatchEvent(new Event('resize'));
    expect(bounds()).toEqual('');
  });
});
