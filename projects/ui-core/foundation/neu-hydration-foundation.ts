import { InjectionToken, LOCALE_ID, inject } from '@angular/core';

export type NeuNow = () => Date;

/** Deterministic application locale used when a component locale input is omitted. */
export const NEURAL_LOCALE = new InjectionToken<string>('NEURAL_LOCALE', {
  providedIn: 'root',
  factory: () => inject(LOCALE_ID) || 'en-US',
});

/** Optional IANA timezone for formatting surfaces that expose timezone-aware output. */
export const NEURAL_TIME_ZONE = new InjectionToken<string | undefined>('NEURAL_TIME_ZONE', {
  providedIn: 'root',
  factory: () => undefined,
});

/** Clock sampled once for the initial application render. */
export const NEURAL_NOW = new InjectionToken<NeuNow>('NEURAL_NOW', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
