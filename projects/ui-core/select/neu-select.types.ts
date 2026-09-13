import {
  NeuOptionActivatedEvent,
  NeuOptionDataRequest,
  NeuOptionFilterConfig,
  NeuOptionFilterTemplateContext,
  NeuOptionGroupTemplateContext,
  NeuOptionLoaderTemplateContext,
  NeuOptionTemplateContext,
  NeuSelectionMode,
  NeuSelectionValue,
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

export type NeuSelectMode = NeuSelectionMode;
export type NeuSelectModelValue<V, M extends NeuSelectMode = 'single'> = NeuSelectionValue<V, M>;
export type NeuSelectOptionActivated<T, V> = NeuOptionActivatedEvent<T, V>;

export interface NeuSelectSelectionOptions {
  readonly chips?: boolean;
  readonly selectionLimit?: number;
  readonly maxSelectedLabels?: number;
  readonly toggleAll?: boolean;
  readonly toggleAllScope?: 'filtered' | 'loaded';
}

export interface NeuSelectFilterOptions {
  readonly enabled?: boolean;
  readonly debounceMs?: number;
  readonly locale?: string;
  readonly resetOnClose?: boolean;
}

export type NeuSelectDataRequest = NeuOptionDataRequest;

export interface NeuSelectClearedEvent {
  readonly source: 'pointer' | 'keyboard' | 'programmatic-command';
  readonly originalEvent?: Event;
}

export interface NeuSelectItemContext<T> extends NeuOptionTemplateContext<T> {}

export interface NeuSelectSelectedContext<T, V = unknown> {
  readonly $implicit: T | null;
  readonly option: T | null;
  readonly value: V | null;
  readonly options: readonly T[];
  readonly values: readonly V[];
  readonly multiple: boolean;
}

export type NeuSelectGroupContext<G> = NeuOptionGroupTemplateContext<G>;
export type NeuSelectFilterContext<T> = NeuOptionFilterTemplateContext<T>;
export type NeuSelectLoaderContext = NeuOptionLoaderTemplateContext;

export interface NeuSelectIconContext {
  readonly $implicit: boolean;
  readonly active: boolean;
}
