import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders, type Type } from '@angular/core';

/** Application-owned key. Core does not prescribe an icon catalogue or provider. */
export type NeuIconKey = string;

export interface NeuIconRenderContext {
  readonly key: NeuIconKey;
  readonly size: string | number;
  readonly strokeWidth: number;
  readonly label: string | null;
}

/** A standalone Angular component and its inputs, supplied by the application. */
export interface NeuIconRender {
  readonly component: Type<unknown>;
  readonly inputs?: Readonly<Record<string, unknown>>;
}

export type NeuIconResolver = (context: NeuIconRenderContext) => NeuIconRender | null;

export const NEU_ICON_RESOLVER = new InjectionToken<NeuIconResolver>('NEU_ICON_RESOLVER');

/** Optional application integration. Core renders its own minimal affordances without it. */
export function provideNeuIconResolver(resolver: NeuIconResolver): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: NEU_ICON_RESOLVER, useValue: resolver }]);
}
