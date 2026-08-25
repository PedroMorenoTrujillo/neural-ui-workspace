import {
  NeuOptionFilterConfig,
  NeuOptionFilterTemplateContext,
  NeuOptionGroupTemplateContext,
  NeuOptionLazyRequest,
  NeuOptionLoaderTemplateContext,
  NeuOptionTemplateContext,
} from '@neural-ui/core/option-api';

export interface NeuSelectOption<V = string, D = unknown> {
  value: V;
  label: string;
  disabled?: boolean;
  group?: string;
  /** Origin object retained for legacy consumers. */
  data?: D;
}

export interface NeuSelectGroup<T = NeuSelectOption> {
  label: string;
  options: T[];
  disabled?: boolean;
}

export type NeuSelectSize = 'sm' | 'md' | 'lg' | 'small' | 'large';
export type NeuSelectVariant = 'outlined' | 'filled';

export interface NeuSelectVirtualScrollOptions {
  readonly itemSize?: number;
  readonly viewportItems?: number;
  readonly buffer?: number;
}

export interface NeuSelectChangeEvent<T, V> {
  readonly originalEvent: Event | null;
  readonly value: V | null;
  readonly option: T | null;
  readonly custom: boolean;
}

export interface NeuSelectFilterEvent<T> {
  readonly originalEvent: Event | null;
  readonly filter: string;
  readonly visibleOptions: readonly T[];
  readonly config: Readonly<NeuOptionFilterConfig<T>>;
}

export interface NeuSelectOverlayEvent {
  readonly originalEvent: Event | null;
  readonly reason:
    | 'programmatic'
    | 'trigger'
    | 'keyboard'
    | 'selection'
    | 'clear'
    | 'escape'
    | 'outside'
    | 'tab';
}

export type NeuSelectLazyLoadEvent = NeuOptionLazyRequest;
export interface NeuSelectItemContext<T> extends NeuOptionTemplateContext<T> {}

export interface NeuSelectSelectedContext<T, V = unknown> {
  readonly $implicit: T | null;
  readonly option: T | null;
  readonly value: V | null;
  readonly custom: boolean;
}

export type NeuSelectGroupContext<G> = NeuOptionGroupTemplateContext<G>;
export type NeuSelectFilterContext<T> = NeuOptionFilterTemplateContext<T>;
export type NeuSelectLoaderContext = NeuOptionLoaderTemplateContext;

export interface NeuSelectIconContext {
  readonly $implicit: boolean;
  readonly active: boolean;
}
