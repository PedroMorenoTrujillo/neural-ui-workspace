import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EnvironmentInjector,
  ErrorHandler,
  PLATFORM_ID,
  Type,
  createComponent,
  createEnvironmentInjector,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Mock, type MockInstance } from 'vitest';
import { NeuDockComponent } from '../dock/neu-dock.component';
import { NeuMegaMenuComponent } from '../mega-menu/neu-mega-menu.component';
import { NeuStepperComponent } from '../stepper/neu-stepper.component';
import { replaceGlobalProperty } from '../testing/global-property-test.util';
import { NeuResponsiveState } from './neu-hydration-states';

@Component({ template: '' })
class ResponsiveLifecycleHost {
  readonly query = signal('(max-width: 800px)');
  readonly matches = inject(NeuResponsiveState).observe(this.query);
}

@Component({
  imports: [NeuDockComponent, NeuMegaMenuComponent, NeuStepperComponent],
  template: `@if (shown()) {
    @switch (kind) {
      @case ('Dock') { <neu-dock /> }
      @case ('MegaMenu') { <neu-mega-menu /> }
      @case ('Stepper') { <neu-stepper /> }
    }
  }`,
})
class ResponsiveRemovalHost {
  readonly shown = signal(false);
  kind = 'Dock';
  private readonly changeDetector = inject(ChangeDetectorRef);

  setShown(shown: boolean): void {
    this.shown.set(shown);
    // Local view checks deliberately leave application afterNextRender work pending.
    this.changeDetector.detectChanges();
  }
}

type MediaListener = (event: MediaQueryListEvent) => void;

describe('CORE-P1-001 responsive consumer lifecycle', () => {
  const consumers: readonly [string, Type<unknown>][] = [
    ['Dock', NeuDockComponent],
    ['MegaMenu', NeuMegaMenuComponent],
    ['Stepper', NeuStepperComponent],
  ];
  let restoreMatchMedia: () => void;
  let matchMedia: Mock<(query: string) => MediaQueryList>;
  let listeners: Map<string, Set<MediaListener>>;
  let removeListener: Mock<(query: string) => void>;
  let handleError: MockInstance<ErrorHandler['handleError']>;

  beforeEach(async () => {
    listeners = new Map();
    removeListener = vi.fn();
    matchMedia = vi.fn((query: string) => {
      const callbacks = new Set<MediaListener>();
      listeners.set(query, callbacks);
      return {
        matches: true,
        addEventListener: (_type: string, listener: MediaListener) => callbacks.add(listener),
        removeEventListener: (_type: string, listener: MediaListener) => {
          removeListener(query);
          callbacks.delete(listener);
        },
      } as unknown as MediaQueryList;
    });
    restoreMatchMedia = replaceGlobalProperty(window, 'matchMedia', matchMedia);
    await TestBed.configureTestingModule({
      imports: [ResponsiveLifecycleHost, ResponsiveRemovalHost],
      providers: [provideRouter([])],
    }).compileComponents();
    handleError = vi.spyOn(TestBed.inject(ErrorHandler), 'handleError');
  });

  afterEach(() => {
    try {
      TestBed.resetTestingModule();
      expect(handleError).not.toHaveBeenCalled();
    } finally {
      restoreMatchMedia();
      vi.restoreAllMocks();
    }
  });

  function activeListeners(): number {
    return [...listeners.values()].reduce((total, callbacks) => total + callbacks.size, 0);
  }

  function emit(query: string, matches: boolean): void {
    for (const listener of listeners.get(query) ?? []) {
      listener({ matches } as MediaQueryListEvent);
    }
  }

  for (const [name, component] of consumers) {
    it(`${name}: cancels initialization when destroyed before its first render`, () => {
      const fixture = TestBed.createComponent(component);
      fixture.destroy();
      expect(() => TestBed.tick()).not.toThrow();
      expect(matchMedia).not.toHaveBeenCalled();
      expect(activeListeners()).toBe(0);
    });

    it(`${name}: releases active observers after rendering and viewport changes`, () => {
      const fixture = TestBed.createComponent(component);
      fixture.detectChanges();
      TestBed.tick();
      expect(activeListeners()).toBeGreaterThan(0);
      for (const query of listeners.keys()) emit(query, false);
      TestBed.tick();
      const acquired = matchMedia.mock.calls.length;
      fixture.destroy();
      fixture.destroy();
      expect(activeListeners()).toBe(0);
      expect(removeListener).toHaveBeenCalledTimes(acquired);
      expect(() => TestBed.tick()).not.toThrow();
      expect(matchMedia).toHaveBeenCalledTimes(acquired);
    });

    it(`${name}: safely recreates after alternating early and active destruction`, () => {
      for (let cycle = 0; cycle < 10; cycle++) {
        const early = TestBed.createComponent(component);
        early.destroy();
        TestBed.tick();
        expect(activeListeners()).toBe(0);
        const rendered = TestBed.createComponent(component);
        rendered.detectChanges();
        TestBed.tick();
        expect(activeListeners()).toBeGreaterThan(0);
        rendered.destroy();
        TestBed.tick();
        expect(activeListeners()).toBe(0);
      }
    });

    it(`${name}: cancels a static @if child removed before application render`, () => {
      const fixture = TestBed.createComponent(ResponsiveRemovalHost);
      fixture.componentInstance.kind = name;
      fixture.detectChanges();
      fixture.componentInstance.setShown(true);
      fixture.componentInstance.setShown(false);
      expect(() => TestBed.tick()).not.toThrow();
      expect(matchMedia).not.toHaveBeenCalled();
      expect(activeListeners()).toBe(0);
    });

    it(`${name}: releases repeated static @if mounts with active observers`, () => {
      const fixture = TestBed.createComponent(ResponsiveRemovalHost);
      fixture.componentInstance.kind = name;
      fixture.detectChanges();
      for (let cycle = 0; cycle < 10; cycle++) {
        fixture.componentInstance.setShown(true);
        TestBed.tick();
        expect(activeListeners()).toBeGreaterThan(0);
        fixture.componentInstance.setShown(false);
        TestBed.tick();
        expect(activeListeners()).toBe(0);
      }
    });

    it(`${name}: safely renders and destroys in a server platform lifecycle`, () => {
      const server = createEnvironmentInjector(
        [NeuResponsiveState, { provide: PLATFORM_ID, useValue: 'server' }],
        TestBed.inject(EnvironmentInjector),
      );
      const componentRef = createComponent(component, { environmentInjector: server });
      TestBed.inject(ApplicationRef).attachView(componentRef.hostView);
      expect(() => TestBed.tick()).not.toThrow();
      expect(matchMedia).not.toHaveBeenCalled();
      expect(() => componentRef.destroy()).not.toThrow();
      expect(() => server.destroy()).not.toThrow();
      expect(() => TestBed.tick()).not.toThrow();
    });
  }

  it('keeps the initial hydration state stable until the first application render', () => {
    const fixture = TestBed.createComponent(ResponsiveLifecycleHost);
    expect(fixture.componentInstance.matches()).toBe(false);
    expect(matchMedia).not.toHaveBeenCalled();
    TestBed.tick();
    expect(fixture.componentInstance.matches()).toBe(true);
    expect(matchMedia).toHaveBeenCalledOnce();
    fixture.destroy();
    expect(activeListeners()).toBe(0);
  });

  it('registers pending cleanup with the consumer immediately, without root cleanup ownership', () => {
    const state = TestBed.inject(NeuResponsiveState);
    const root = TestBed.inject(EnvironmentInjector);
    const owner = createEnvironmentInjector([], root);
    const ownerCleanup = vi.spyOn(owner.get(DestroyRef), 'onDestroy');
    const rootCleanup = vi.spyOn(root.get(DestroyRef), 'onDestroy');
    state.observe('(max-width: 800px)', owner.get(DestroyRef));
    expect(ownerCleanup).toHaveBeenCalledOnce();
    expect(rootCleanup).not.toHaveBeenCalled();
    owner.destroy();
    expect(() => TestBed.tick()).not.toThrow();
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('keeps shared listeners only while a live consumer owns them', () => {
    const first = TestBed.createComponent(ResponsiveLifecycleHost);
    const second = TestBed.createComponent(ResponsiveLifecycleHost);
    TestBed.tick();
    expect(matchMedia).toHaveBeenCalledOnce();
    expect(activeListeners()).toBe(1);
    first.destroy();
    emit('(max-width: 800px)', false);
    expect(first.componentInstance.matches()).toBe(true);
    expect(second.componentInstance.matches()).toBe(false);
    second.destroy();
    expect(activeListeners()).toBe(0);
    expect(removeListener).toHaveBeenCalledOnce();
  });

  it('releases obsolete breakpoint queries and stops the effect after consumer destruction', () => {
    const root = TestBed.inject(EnvironmentInjector);
    TestBed.inject(NeuResponsiveState);
    const rootCleanup = vi.spyOn(root.get(DestroyRef), 'onDestroy');
    const fixture = TestBed.createComponent(ResponsiveLifecycleHost);
    TestBed.tick();
    fixture.componentInstance.query.set('(max-width: 600px)');
    TestBed.tick();
    expect(listeners.get('(max-width: 800px)')?.size).toBe(0);
    expect(listeners.get('(max-width: 600px)')?.size).toBe(1);
    fixture.destroy();
    fixture.componentInstance.query.set('(max-width: 400px)');
    TestBed.tick();
    expect(matchMedia).toHaveBeenCalledTimes(2);
    expect(activeListeners()).toBe(0);
    expect(rootCleanup).not.toHaveBeenCalled();
  });

  it('safely ignores an already destroyed explicit owner', () => {
    const state = TestBed.inject(NeuResponsiveState);
    const owner = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const destroyRef = owner.get(DestroyRef);
    owner.destroy();
    expect(() => state.observe('(max-width: 800px)', destroyRef)).not.toThrow();
    expect(() => TestBed.tick()).not.toThrow();
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('releases acquisition if its consumer is destroyed reentrantly during matchMedia', () => {
    const fixture = TestBed.createComponent(ResponsiveLifecycleHost);
    const acquire = matchMedia.getMockImplementation()!;
    matchMedia.mockImplementation((query: string) => {
      fixture.destroy();
      return acquire(query);
    });
    expect(() => TestBed.tick()).not.toThrow();
    expect(activeListeners()).toBe(0);
    expect(removeListener).toHaveBeenCalledOnce();
  });

  it('keeps SSR responsive state deterministic and safely tears down pending consumers', () => {
    const server = createEnvironmentInjector(
      [NeuResponsiveState, { provide: PLATFORM_ID, useValue: 'server' }],
      TestBed.inject(EnvironmentInjector),
    );
    const result = runInInjectionContext(server, () => server.get(NeuResponsiveState).observe('(max-width: 800px)'));
    TestBed.tick();
    expect(result()).toBe(false);
    expect(matchMedia).not.toHaveBeenCalled();
    expect(() => server.destroy()).not.toThrow();
  });
});
