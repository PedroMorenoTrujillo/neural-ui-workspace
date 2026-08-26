import {
  APP_ID,
  Component,
  EnvironmentInjector,
  LOCALE_ID,
  PLATFORM_ID,
  TransferState,
  createEnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  NEURAL_LOCALE,
  NEURAL_NOW,
  NEURAL_TIME_ZONE,
  NeuIdGenerator,
  NeuInitialTemporalState,
  NeuResponsiveState,
} from './neu-hydration-foundation';

@Component({ template: '' })
class ResponsiveHost {
  readonly first = inject(NeuResponsiveState).observe('(max-width: 800px)');
  readonly second = inject(NeuResponsiveState).observe('(max-width: 800px)');
}

describe('Neural hydration foundation', () => {
  it('allocates unique IDs within an application and restarts for a new application injector', () => {
    const parent = TestBed.inject(EnvironmentInjector);
    const first = createEnvironmentInjector([NeuIdGenerator], parent);
    const second = createEnvironmentInjector([NeuIdGenerator], parent);

    expect(first.get(NeuIdGenerator).getId('neu-input-')).toBe('neu-input-0');
    expect(first.get(NeuIdGenerator).getId('neu-input-')).toBe('neu-input-1');
    expect(first.get(NeuIdGenerator).getId('neu-select-')).toBe('neu-select-0');
    expect(second.get(NeuIdGenerator).getId('neu-input-')).toBe('neu-input-0');

    first.destroy();
    second.destroy();
  });

  it('uses Angular application locale as the deterministic default', () => {
    const injector = createEnvironmentInjector(
      [
        TransferState,
        { provide: LOCALE_ID, useValue: 'es-ES' },
        { provide: NEURAL_LOCALE, useFactory: () => inject(LOCALE_ID) },
      ],
      TestBed.inject(EnvironmentInjector),
    );
    expect(runInInjectionContext(injector, () => injector.get(NEURAL_LOCALE))).toBe('es-ES');
    injector.destroy();
  });

  it('transfers the initial clock, local date, and timezone between server and client', () => {
    const transferState = TestBed.inject(TransferState);
    const parent = TestBed.inject(EnvironmentInjector);
    const server = createEnvironmentInjector(
      [
        NeuInitialTemporalState,
        { provide: APP_ID, useValue: 'temporal-contract-test' },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: TransferState, useValue: transferState },
        { provide: NEURAL_NOW, useValue: () => new Date(2026, 7, 26, 23, 59, 58) },
        { provide: NEURAL_TIME_ZONE, useValue: 'Europe/Madrid' },
      ],
      parent,
    );
    const serverTemporal = server.get(NeuInitialTemporalState);

    expect(serverTemporal.now().getTime()).toBe(new Date(2026, 7, 26, 23, 59, 58).getTime());
    expect(serverTemporal.today().getFullYear()).toBe(2026);
    expect(serverTemporal.today().getMonth()).toBe(7);
    expect(serverTemporal.today().getDate()).toBe(26);
    expect(serverTemporal.timeZone()).toBe('Europe/Madrid');

    const client = createEnvironmentInjector(
      [
        NeuInitialTemporalState,
        { provide: APP_ID, useValue: 'temporal-contract-test' },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: TransferState, useValue: transferState },
        { provide: NEURAL_NOW, useValue: () => new Date(2040, 0, 1) },
      ],
      parent,
    );
    const clientTemporal = client.get(NeuInitialTemporalState);

    expect(clientTemporal.now().getTime()).toBe(serverTemporal.now().getTime());
    expect(clientTemporal.today().getTime()).toBe(serverTemporal.today().getTime());
    expect(clientTemporal.timeZone()).toBe('Europe/Madrid');
    expect(clientTemporal.currentNow().getTime()).toBe(serverTemporal.now().getTime());

    client.destroy();
    server.destroy();
  });

  it('shares one modern media-query listener and cleans it up after render', async () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const addEventListener = vi.fn(
      (_type: string, callback: (event: MediaQueryListEvent) => void) => (listener = callback),
    );
    const removeEventListener = vi.fn();
    const media = {
      matches: true,
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList;
    const matchMedia = vi.fn().mockReturnValue(media);
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });
    await TestBed.configureTestingModule({
      imports: [ResponsiveHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResponsiveHost);

    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.first()).toBe(true);
    expect(fixture.componentInstance.second()).toBe(true);
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledTimes(1);

    listener?.({ matches: false } as MediaQueryListEvent);
    expect(fixture.componentInstance.first()).toBe(false);
    expect(fixture.componentInstance.second()).toBe(false);

    fixture.destroy();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('supports legacy media-query listeners', async () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    const media = { matches: false, addListener, removeListener } as unknown as MediaQueryList;
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => media,
    });
    await TestBed.configureTestingModule({
      imports: [ResponsiveHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResponsiveHost);

    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.first()).toBe(false);
    expect(addListener).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(removeListener).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });
});
