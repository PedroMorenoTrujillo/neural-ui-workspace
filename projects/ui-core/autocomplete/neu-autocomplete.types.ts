import {
  NeuOptionGroupTemplateContext,
  NeuOptionLazyRequest,
  NeuOptionLoaderTemplateContext,
  NeuOptionTemplateContext,
} from '@neural-ui/core/option-api';

export interface NeuAutocompleteOption<V = unknown> {
  readonly value: V;
  readonly label: string;
  readonly disabled?: boolean;
}

export type NeuAutocompleteValue<V> = V | string;
export type NeuAutocompleteDropdownMode = 'blank' | 'current';
export type NeuAutocompleteSize = 'sm' | 'md' | 'lg';
export type NeuAutocompleteVariant = 'outlined' | 'filled';
export type NeuAutocompleteCompletionSource = 'input' | 'focus' | 'dropdown' | 'programmatic';

export interface NeuAutocompleteCompleteEvent {
  readonly originalEvent: Event | null;
  readonly query: string;
  readonly source: NeuAutocompleteCompletionSource;
  readonly requestId: number;
}

export interface NeuAutocompleteSelectEvent<T, V> {
  readonly originalEvent: Event | null;
  readonly option: T;
  readonly value: V;
}

export interface NeuAutocompleteDropdownClickEvent {
  readonly originalEvent: Event;
  readonly query: string;
  readonly mode: NeuAutocompleteDropdownMode;
}

export interface NeuAutocompleteClearEvent<V> {
  readonly originalEvent: Event | null;
  readonly previousValue: NeuAutocompleteValue<V> | null;
  readonly previousText: string;
  readonly reason: 'button' | 'input' | 'force-selection' | 'programmatic';
}

export interface NeuAutocompleteOverlayEvent {
  readonly originalEvent: Event | null;
  readonly reason:
    | 'completion'
    | 'focus'
    | 'dropdown'
    | 'keyboard'
    | 'selection'
    | 'clear'
    | 'escape'
    | 'outside'
    | 'tab'
    | 'programmatic';
}

export interface NeuAutocompleteLazyLoadEvent extends NeuOptionLazyRequest {
  readonly query: string;
}

export interface NeuAutocompleteItemContext<T, V = unknown> extends NeuOptionTemplateContext<T> {
  readonly label: string;
  readonly value: V;
}

export type NeuAutocompleteGroupContext<G> = NeuOptionGroupTemplateContext<G>;
export type NeuAutocompleteLoaderContext = NeuOptionLoaderTemplateContext;

export interface NeuAutocompleteIconContext {
  readonly $implicit: boolean;
  readonly active: boolean;
}
