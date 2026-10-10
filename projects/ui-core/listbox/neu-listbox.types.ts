import { NeuOptionFilterConfig, NeuOptionTemplateContext } from '@neural-ui/core/option-api';

export interface NeuListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
  group?: string;
}

export interface NeuListboxChangeEvent<T, V> {
  readonly originalEvent: Event | null;
  readonly option: T | null;
  readonly value: V | readonly V[] | null;
  readonly selectedOptions: readonly T[];
  readonly selected: boolean;
}

export interface NeuListboxOptionEvent<T, V> {
  readonly originalEvent: Event;
  readonly option: T;
  readonly value: V | readonly V[] | null;
}

export interface NeuListboxFilterEvent<T> {
  readonly originalEvent: Event | null;
  readonly filter: string;
  readonly visibleOptions: readonly T[];
  readonly config: Readonly<NeuOptionFilterConfig<T>>;
}

export interface NeuListboxSelectAllEvent<T, V> {
  readonly originalEvent: Event;
  readonly checked: boolean;
  readonly scope: 'visible-eligible';
  readonly options: readonly T[];
  readonly value: readonly V[];
}

export interface NeuListboxDropEvent<T> {
  readonly originalEvent: Event;
  readonly option: T;
  readonly previousIndex: number;
  readonly currentIndex: number;
  readonly options: readonly T[];
}

export type NeuListboxItemContext<T> = NeuOptionTemplateContext<T>;

export interface NeuListboxIndicatorContext<T, V> {
  readonly $implicit: boolean;
  readonly selected: boolean;
  readonly option: T;
  readonly value: V;
  readonly checkbox: boolean;
  readonly checkmark: boolean;
}
