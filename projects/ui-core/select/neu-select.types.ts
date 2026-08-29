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

export type NeuSelectSize = 'sm' | 'md' | 'lg';
export type NeuSelectVariant = 'outlined' | 'filled';

export type NeuSelectModelValue<V, M extends boolean = false> = [M] extends [true]
  ? readonly V[]
  : V | null;

interface NeuSelectChangeEventBase<T> {
  readonly originalEvent: Event | null;
  readonly option: T | null;
  readonly selectedOptions: readonly T[];
  readonly custom: boolean;
}

export type NeuSelectChangeEvent<T, V, M extends boolean = boolean> = M extends true
  ? NeuSelectChangeEventBase<T> & {
      readonly value: readonly V[];
      readonly multiple: true;
    }
  : NeuSelectChangeEventBase<T> & {
      readonly value: V | null;
      readonly multiple: false;
    };

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
  readonly options: readonly T[];
  readonly values: readonly V[];
  readonly multiple: boolean;
  readonly custom: boolean;
}

export type NeuSelectGroupContext<G> = NeuOptionGroupTemplateContext<G>;
export type NeuSelectFilterContext<T> = NeuOptionFilterTemplateContext<T>;
export type NeuSelectLoaderContext = NeuOptionLoaderTemplateContext;

export interface NeuSelectIconContext {
  readonly $implicit: boolean;
  readonly active: boolean;
}
