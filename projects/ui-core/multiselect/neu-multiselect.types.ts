import {
  NeuOptionFilterConfig,
  NeuOptionGroupTemplateContext,
  NeuOptionLazyRequest,
  NeuOptionLoaderTemplateContext,
  NeuOptionTemplateContext,
} from '@neural-ui/core/option-api';

export type NeuMultiselectSize = 'sm' | 'md' | 'lg';
export type NeuMultiselectVariant = 'outlined' | 'filled';
export type NeuMultiselectDisplay = 'comma' | 'chip' | 'count';

export interface NeuMultiselectItemContext<T, V>
  extends NeuOptionTemplateContext<T> {
  readonly value: V;
}

export interface NeuMultiselectSelectedContext<T, V> {
  readonly $implicit: T | null;
  readonly option: T | null;
  readonly value: V;
  readonly index: number;
  readonly remove: () => void;
}

export interface NeuMultiselectSelectedItemsContext<T, V> {
  readonly $implicit: readonly T[];
  readonly options: readonly T[];
  readonly values: readonly V[];
  readonly count: number;
  readonly clear: () => void;
}

export type NeuMultiselectGroupContext<G> = NeuOptionGroupTemplateContext<G>;

export interface NeuMultiselectFilterContext<T> {
  readonly $implicit: string;
  readonly value: string;
  readonly config: Readonly<NeuOptionFilterConfig<T>>;
  readonly filter: (value: string) => void;
  readonly reset: () => void;
}

export type NeuMultiselectLoaderContext = NeuOptionLoaderTemplateContext;

export interface NeuMultiselectIconContext {
  readonly open: boolean;
  readonly disabled: boolean;
  readonly readonly: boolean;
}

export interface NeuMultiselectChangeEvent<T, V> {
  readonly originalEvent: Event | null;
  readonly value: readonly V[];
  readonly selectedOptions: readonly T[];
  readonly option: T | null;
  readonly added: boolean;
  readonly removed: boolean;
}

export interface NeuMultiselectFilterEvent {
  readonly originalEvent: Event | null;
  readonly filter: string;
  readonly controlled: boolean;
}

export interface NeuMultiselectRemoveEvent<T, V> {
  readonly originalEvent: Event | null;
  readonly option: T | null;
  readonly value: V;
  readonly source: 'option' | 'token';
}

export interface NeuMultiselectSelectAllChangeEvent<T, V> {
  readonly originalEvent: Event | null;
  readonly checked: boolean;
  readonly value: readonly V[];
  readonly selectedOptions: readonly T[];
  readonly scope: 'filtered-loaded';
}

export interface NeuMultiselectOverlayEvent {
  readonly originalEvent: Event | null;
  readonly reason:
    | 'trigger'
    | 'keyboard'
    | 'outside'
    | 'escape'
    | 'tab'
    | 'programmatic'
    | 'disabled';
}

export type NeuMultiselectLazyLoadEvent = NeuOptionLazyRequest;
